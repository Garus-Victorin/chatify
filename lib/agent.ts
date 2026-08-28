/**
 * ReAct Agent — Reasoning + Acting loop.
 *
 * Pattern: Thought ? Action ? Observation ? (repeat) ? Final Answer
 *
 * The agent:
 *   1. Thinks about what tool to use (Thought)
 *   2. Calls the tool (Action)
 *   3. Observes the result (Observation)
 *   4. Decides if more steps are needed or gives Final Answer
 *
 * Max iterations: 4 (prevents infinite loops)
 * Model: Puter server default (via chatServer)
 */

import { chatServer, PUTER_SERVER_DEFAULT_MODEL } from "./puter-server";
import { Plugin, PluginContext } from "./plugins/index";
import { logger } from "./logger";

const MAX_ITERATIONS = 4;

// --- Types ---------------------------------------------------------------------

export interface AgentStep {
  type: "thought" | "action" | "observation" | "answer";
  content: string;
  toolId?: string;
  toolInput?: string;
}

export interface AgentResult {
  answer: string;
  steps: AgentStep[];
  toolsUsed: string[];
  iterations: number;
}

// --- System prompt -------------------------------------------------------------

function buildAgentSystemPrompt(tools: Plugin[]): string {
  const toolDescriptions = tools
    .map((t) => `- **${t.id}**: ${t.description}`)
    .join("\n");

  return `You are an autonomous AI agent. You solve problems step by step using available tools.

## Available Tools
${toolDescriptions}

## Response Format
You MUST respond in this exact format for each step:

Thought: [your reasoning about what to do next]
Action: [tool_id]
Action Input: [the exact input to pass to the tool]

OR when you have enough information:

Thought: [I now have enough information to answer]
Final Answer: [your complete, well-formatted answer in Markdown]

## Rules
- Always start with a Thought
- Use tools when you need real-time data, calculations, or code execution
- After each Observation, decide if you need another tool or can answer
- Final Answer must be comprehensive and well-formatted
- Never make up tool results — only use what Observations provide`;
}

// --- Step parser ---------------------------------------------------------------

interface ParsedStep {
  thought?: string;
  action?: string;
  actionInput?: string;
  finalAnswer?: string;
}

function parseAgentResponse(text: string): ParsedStep {
  const thought = text.match(/Thought:\s*(.+?)(?=\n(?:Action|Final Answer)|$)/s)?.[1]?.trim();
  const action = text.match(/Action:\s*(.+?)(?=\n|$)/)?.[1]?.trim();
  const actionInput = text.match(/Action Input:\s*(.+?)(?=\nObservation|$)/s)?.[1]?.trim();
  const finalAnswer = text.match(/Final Answer:\s*(.+?)$/s)?.[1]?.trim();

  return { thought, action, actionInput, finalAnswer };
}

// --- Main agent ----------------------------------------------------------------

export async function runAgent(
  input: string,
  tools: Plugin[],
  context?: PluginContext,
  onStep?: (step: AgentStep) => void
): Promise<AgentResult> {
  const steps: AgentStep[] = [];
  const toolsUsed: string[] = [];
  const conversationHistory: { role: "user" | "assistant"; content: string }[] = [];

  const systemPrompt = buildAgentSystemPrompt(tools);

  // Initial user message
  conversationHistory.push({ role: "user", content: input });

  let iterations = 0;

  while (iterations < MAX_ITERATIONS) {
    iterations++;

    // -- LLM reasoning step --------------------------------------------------
    const llmResponse = await chatServer(
      [
        { role: "system", content: systemPrompt },
        ...conversationHistory,
      ],
      { model: PUTER_SERVER_DEFAULT_MODEL, temperature: 0.1, maxTokens: 512 }
    );

    if (!llmResponse) {
      logger.error("[agent] LLM (Puter) unavailable — check PUTER_AUTH_TOKEN");
      break;
    }

    conversationHistory.push({ role: "assistant", content: llmResponse });

    const parsed = parseAgentResponse(llmResponse);

    // -- Record thought ------------------------------------------------------
    if (parsed.thought) {
      const step: AgentStep = { type: "thought", content: parsed.thought };
      steps.push(step);
      onStep?.(step);
    }

    // -- Final answer --------------------------------------------------------
    if (parsed.finalAnswer) {
      const step: AgentStep = { type: "answer", content: parsed.finalAnswer };
      steps.push(step);
      onStep?.(step);

      return {
        answer: parsed.finalAnswer,
        steps,
        toolsUsed: [...new Set(toolsUsed)],
        iterations,
      };
    }

    // -- Tool action ---------------------------------------------------------
    if (parsed.action && parsed.actionInput !== undefined) {
      const tool = tools.find(
        (t) => t.id === parsed.action || t.name.toLowerCase() === parsed.action?.toLowerCase()
      );

      const actionStep: AgentStep = {
        type: "action",
        content: `Using ${parsed.action} with: ${parsed.actionInput}`,
        toolId: parsed.action,
        toolInput: parsed.actionInput,
      };
      steps.push(actionStep);
      onStep?.(actionStep);

      let observation: string;

      if (tool) {
        try {
          const result = await tool.execute(parsed.actionInput, context);
          observation = result.error
            ? `Error: ${result.error}`
            : result.output;
          toolsUsed.push(tool.id);
        } catch (err) {
          observation = `Tool execution failed: ${err instanceof Error ? err.message : String(err)}`;
        }
      } else {
        observation = `Tool "${parsed.action}" is not available or not enabled.`;
      }

      const obsStep: AgentStep = { type: "observation", content: observation };
      steps.push(obsStep);
      onStep?.(obsStep);

      // Feed observation back to LLM
      conversationHistory.push({
        role: "user",
        content: `Observation: ${observation}\n\nContinue your reasoning.`,
      });
    } else {
      // No action and no final answer — force a final answer
      break;
    }
  }

  // -- Fallback: generate final answer from accumulated context ---------------
  logger.warn("[agent] Max iterations reached or no final answer, generating fallback");

  const observationsSummary = steps
    .filter((s) => s.type === "observation")
    .map((s) => s.content)
    .join("\n\n");

  const fallbackAnswer =
    (await chatServer(
      [
        {
          role: "system",
          content:
            "Based on the following observations, provide a comprehensive final answer in Markdown. " +
            "Be direct and well-structured.",
        },
        {
          role: "user",
          content: `Original question: ${input}\n\nObservations:\n${observationsSummary || "No tool results available."}`,
        },
      ],
      { model: PUTER_SERVER_DEFAULT_MODEL, temperature: 0.4, maxTokens: 1024 }
    )) ?? "I could not complete this task.";

  const step: AgentStep = { type: "answer", content: fallbackAnswer };
  steps.push(step);

  return {
    answer: fallbackAnswer,
    steps,
    toolsUsed: [...new Set(toolsUsed)],
    iterations,
  };
}
