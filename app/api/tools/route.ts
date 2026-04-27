import { NextRequest, NextResponse } from "next/server";
import { routeTool } from "@/lib/toolRouter";
import { runAgent } from "@/lib/agent";
import { getEnabledPlugins } from "@/lib/plugins/index";
import { getSession } from "@/lib/auth";
import { rateLimit, rateLimitResponse } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session    = await getSession();
  const identifier = session?.userId ?? (req.headers.get("x-forwarded-for") ?? "anonymous");

  const rl = rateLimit(identifier, "chat");
  if (!rl.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  const { input, enabledPlugins = [], agentMode = false, fileContent } = await req.json();

  if (!input?.trim()) {
    return NextResponse.json({ error: "Input is required" }, { status: 400 });
  }

  try {
    if (agentMode) {
      const plugins = getEnabledPlugins(enabledPlugins);
      const context = fileContent ? { fileContent } : undefined;
      const result  = await runAgent(input, plugins, context);
      return NextResponse.json({
        type: "agent",
        output: result.answer,
        toolsUsed: result.toolsUsed,
        iterations: result.iterations,
        steps: result.steps,
      });
    }

    const route = await routeTool(input, enabledPlugins, false);

    if (!route.plugin) {
      return NextResponse.json({ type: "none" });
    }

    const result = await route.plugin.execute(route.resolvedInput, { fileContent });
    return NextResponse.json({
      type: "plugin",
      pluginId: route.plugin.id,
      pluginName: route.plugin.name,
      output: result.output,
      error: result.error,
    });
  } catch (err) {
    logger.error("[tools] Execution failed", err);
    return NextResponse.json({ error: "Tool execution failed" }, { status: 500 });
  }
}
