/**
 * Tool router — determines which plugin (if any) should handle a given input.
 *
 * Resolution order:
 *   1. Slash command parser  (/search, /calc, /run, /pdf)
 *   2. Heuristic trigger()   (each plugin's built-in trigger function)
 *   3. LLM classification    — disabled (heuristic + slash only)
 *   4. null                  (fallback ? normal LLM response)
 */

import { Plugin, PLUGIN_REGISTRY, getEnabledPlugins } from "./plugins/index";
import { Personality, PERSONALITY_PROMPTS } from "./toolTypes";
import { logger } from "./logger";

// --- Slash command map ---------------------------------------------------------

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

// --- Command parser ------------------------------------------------------------

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

// --- Heuristic routing ---------------------------------------------------------

function heuristicRoute(input: string, enabledPlugins: Plugin[]): Plugin | null {
  for (const plugin of enabledPlugins) {
    if (plugin.trigger(input)) return plugin;
  }
  return null;
}

// --- LLM routing (disabled — heuristic + slash only) ---------------------------

async function llmRoute(input: string, enabledPlugins: Plugin[]): Promise<Plugin | null> {
  // LLM routing disabled — Groq removed; heuristic + slash commands only
  return null;
}

// --- Main router ---------------------------------------------------------------

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