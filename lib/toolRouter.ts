/**
 * Tool router — determines which plugin (if any) should handle a given input.
 *
 * Resolution order:
 *   1. Slash command parser  (/search, /calc, /run, /pdf)
 *   2. Heuristic trigger()   (each plugin's built-in trigger function)
 *   3. LLM classification    (llama-3.1-8b-instant, only if heuristics are ambiguous)
 *   4. null                  (fallback → normal LLM response)
 */

import { Plugin, PLUGIN_REGISTRY, getEnabledPlugins } from "./plugins/index";
import { Personality, PERSONALITY_PROMPTS } from "./toolTypes";
import { logger } from "./logger";

// Lazy Groq instance — only created server-side when needed
function getGroq() {
  const { default: Groq } = require("groq-sdk");
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
}

// ─── Slash command map ─────────────────────────────────────────────────────────

const SLASH_COMMANDS: Record<string, string> = {
  "/search": "web-search",
  "/calc":   "calculator",
  "/run":    "code-interpreter",
  "/exec":   "code-interpreter",
  "/pdf":    "pdf",
};

// Re-export types for convenience
export type { Personality };
export { PERSONALITY_PROMPTS };

// ─── Command parser ────────────────────────────────────────────────────────────

export interface ParsedCommand {
  command: string;
  args: string;
  pluginId: string | null;
}

export function parseSlashCommand(input: string): ParsedCommand | null {
  const trimmed = input.trim();
  if (!trimmed.startsWith("/")) return null;

  const spaceIdx = trimmed.indexOf(" ");
  const command = spaceIdx === -1 ? trimmed : trimmed.slice(0, spaceIdx);
  const args = spaceIdx === -1 ? "" : trimmed.slice(spaceIdx + 1).trim();
  const pluginId = SLASH_COMMANDS[command.toLowerCase()] ?? null;

  return { command, args, pluginId };
}

// ─── Heuristic routing ─────────────────────────────────────────────────────────

function heuristicRoute(input: string, enabledPlugins: Plugin[]): Plugin | null {
  for (const plugin of enabledPlugins) {
    if (plugin.trigger(input)) return plugin;
  }
  return null;
}

// ─── LLM routing (fallback) ────────────────────────────────────────────────────

async function llmRoute(input: string, enabledPlugins: Plugin[]): Promise<Plugin | null> {
  if (enabledPlugins.length === 0) return null;

  const toolList = enabledPlugins
    .map((p) => `- ${p.id}: ${p.description}`)
    .join("\n");

  try {
    const groq = getGroq();
    const res = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      max_tokens: 20,
      temperature: 0,
      messages: [
        {
          role: "system",
          content:
            `You are a tool classifier. Given a user message, output ONLY the tool ID to use, or "none".\n\nAvailable tools:\n${toolList}\n\nOutput ONLY the tool ID (e.g. "calculator") or "none". No explanation.`,
        },
        { role: "user", content: input },
      ],
    });

    const toolId = res.choices[0]?.message?.content?.trim().toLowerCase() ?? "none";
    if (toolId === "none") return null;

    return enabledPlugins.find((p) => p.id === toolId) ?? null;
  } catch (err) {
    logger.warn("[toolRouter] LLM routing failed, using heuristic only", { error: err });
    return null;
  }
}

// ─── Main router ───────────────────────────────────────────────────────────────

export interface RouteResult {
  plugin: Plugin | null;
  command: ParsedCommand | null;
  resolvedInput: string;  // Input after stripping command prefix
}

export async function routeTool(
  input: string,
  enabledPluginIds: string[] = [],
  useLLMFallback = false
): Promise<RouteResult> {
  const enabledPlugins = getEnabledPlugins(enabledPluginIds);

  // 1. Slash command
  const cmd = parseSlashCommand(input);
  if (cmd?.pluginId) {
    const plugin = enabledPlugins.find((p) => p.id === cmd.pluginId);
    if (plugin) {
      return {
        plugin,
        command: cmd,
        resolvedInput: cmd.args || input,
      };
    }
  }

  // 2. Heuristic
  const heuristic = heuristicRoute(input, enabledPlugins);
  if (heuristic) {
    return { plugin: heuristic, command: null, resolvedInput: input };
  }

  // 3. LLM classification (only for ambiguous inputs, opt-in)
  if (useLLMFallback && enabledPlugins.length > 0) {
    const llm = await llmRoute(input, enabledPlugins);
    if (llm) {
      return { plugin: llm, command: null, resolvedInput: input };
    }
  }

  return { plugin: null, command: null, resolvedInput: input };
}
