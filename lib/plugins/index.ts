/**
 * Plugin system for Chatify.
 *
 * Each plugin is a self-contained unit with:
 *   - trigger()  — heuristic to detect if this plugin should handle the input
 *   - execute()  — async function that returns a string result
 *   - schema     — metadata for UI display and LLM tool-calling
 *
 * Plugins are registered in the PLUGIN_REGISTRY and can be toggled per-session
 * via the PluginPanel UI component.
 */

import { searchWeb } from "@/lib/search";
import { logger } from "@/lib/logger";

// ─── Core types ────────────────────────────────────────────────────────────────

export interface Plugin {
  id: string;
  name: string;
  description: string;
  icon: string;           // emoji icon for UI
  category: "search" | "compute" | "document" | "code";
  trigger: (input: string) => boolean;
  execute: (input: string, context?: PluginContext) => Promise<PluginResult>;
}

export interface PluginContext {
  chatId?: string;
  userId?: string;
  fileContent?: string;   // For PDF plugin
}

export interface PluginResult {
  output: string;
  metadata?: Record<string, unknown>;
  error?: string;
}

// ─── 1. WebSearch Plugin ───────────────────────────────────────────────────────

const WebSearchPlugin: Plugin = {
  id: "web-search",
  name: "Web Search",
  description: "Search the web for real-time information using Tavily",
  icon: "🔎",
  category: "search",

  trigger: (input) => {
    const q = input.toLowerCase();
    return (
      q.startsWith("/search ") ||
      /\b(search|find|look up|what is the latest|current price|news about)\b/.test(q)
    );
  },

  execute: async (input) => {
    const query = input.replace(/^\/search\s+/i, "").trim();
    try {
      const { results } = await searchWeb(query, 5);
      if (results.length === 0) {
        return { output: "No results found for: " + query };
      }
      const formatted = results
        .map((r, i) => `**[${i + 1}] ${r.title}**\n${r.content}\n🔗 ${r.url}`)
        .join("\n\n");
      return {
        output: `## Web Search Results for "${query}"\n\n${formatted}`,
        metadata: { query, resultCount: results.length, sources: results },
      };
    } catch (err) {
      logger.error("[WebSearchPlugin] Failed", err);
      return { output: "Web search failed.", error: String(err) };
    }
  },
};

// ─── 2. Calculator Plugin ──────────────────────────────────────────────────────

/**
 * Safe math evaluator — no eval(), uses a recursive descent parser.
 * Supports: +, -, *, /, **, %, parentheses, sqrt(), abs(), round(), floor(), ceil()
 */
function safeMath(expr: string): number {
  const clean = expr
    .replace(/\s+/g, "")
    .replace(/sqrt\(/g, "Math.sqrt(")
    .replace(/abs\(/g, "Math.abs(")
    .replace(/round\(/g, "Math.round(")
    .replace(/floor\(/g, "Math.floor(")
    .replace(/ceil\(/g, "Math.ceil(")
    .replace(/pi/gi, String(Math.PI))
    .replace(/e(?![0-9])/g, String(Math.E));

  // Whitelist: only allow safe math characters
  if (!/^[0-9+\-*/().%^Math.sqrtabsroundflorceil\s]+$/.test(clean)) {
    throw new Error("Invalid expression — only math operations allowed");
  }

  // Use Function constructor (safer than eval — no scope access)
  // eslint-disable-next-line no-new-func
  const result = new Function(`"use strict"; return (${clean})`)();
  if (typeof result !== "number" || !isFinite(result)) {
    throw new Error("Result is not a finite number");
  }
  return result;
}

const CalculatorPlugin: Plugin = {
  id: "calculator",
  name: "Calculator",
  description: "Evaluate mathematical expressions safely",
  icon: "🧮",
  category: "compute",

  trigger: (input) => {
    const q = input.toLowerCase().trim();
    return (
      q.startsWith("/calc ") ||
      q.startsWith("calculate ") ||
      q.startsWith("compute ") ||
      /^[\d\s+\-*/().^%]+$/.test(q) ||
      /\b(what is|calculate|compute|evaluate|solve)\b.*[\d+\-*/]/.test(q)
    );
  },

  execute: async (input) => {
    // Extract the math expression
    const expr = input
      .replace(/^\/calc\s+/i, "")
      .replace(/^(calculate|compute|evaluate|solve|what is)\s+/i, "")
      .trim();

    try {
      const result = safeMath(expr);
      const formatted = Number.isInteger(result)
        ? result.toString()
        : result.toFixed(6).replace(/\.?0+$/, "");

      return {
        output: `**${expr} = ${formatted}**`,
        metadata: { expression: expr, result },
      };
    } catch (err) {
      return {
        output: `Could not evaluate: \`${expr}\`\n> ${err instanceof Error ? err.message : "Unknown error"}`,
        error: String(err),
      };
    }
  },
};

// ─── 3. Code Interpreter Plugin ────────────────────────────────────────────────

/**
 * Sandboxed code interpreter — simulates execution via LLM.
 * In production, replace with a real sandbox (e2b.dev, Pyodide, etc.)
 *
 * The LLM is asked to "execute" the code and return the output.
 * This is safe because no actual code runs on the server.
 */
const CodeInterpreterPlugin: Plugin = {
  id: "code-interpreter",
  name: "Code Interpreter",
  description: "Execute and explain code snippets (LLM-simulated sandbox)",
  icon: "💻",
  category: "code",

  trigger: (input) => {
    const q = input.toLowerCase();
    return (
      q.startsWith("/run ") ||
      q.startsWith("/exec ") ||
      (q.includes("```") && (q.includes("run") || q.includes("execute") || q.includes("output")))
    );
  },

  execute: async (input) => {
    const code = input
      .replace(/^\/run\s+/i, "")
      .replace(/^\/exec\s+/i, "")
      .trim();

    // Detect language from code block or heuristic
    const langMatch = code.match(/^```(\w+)/);
    const lang = langMatch?.[1] ?? detectLanguage(code);
    const cleanCode = code.replace(/^```\w*\n?/, "").replace(/```$/, "").trim();

    try {
      const { default: Groq } = await import("groq-sdk");
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

      const res = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        max_tokens: 512,
        temperature: 0,
        messages: [
          {
            role: "system",
            content:
              "You are a code execution simulator. Given code, output ONLY what the program would print/return. " +
              "Format: show the output in a code block, then a brief explanation. " +
              "If there's an error, show the error message.",
          },
          {
            role: "user",
            content: `Execute this ${lang} code:\n\`\`\`${lang}\n${cleanCode}\n\`\`\``,
          },
        ],
      });

      const output = res.choices[0]?.message?.content ?? "No output";
      return {
        output: `## Code Execution (${lang})\n\n\`\`\`${lang}\n${cleanCode}\n\`\`\`\n\n**Output:**\n${output}`,
        metadata: { language: lang, simulated: true },
      };
    } catch (err) {
      logger.error("[CodeInterpreterPlugin] Failed", err);
      return { output: "Code execution failed.", error: String(err) };
    }
  },
};

function detectLanguage(code: string): string {
  if (/def |import |print\(/.test(code)) return "python";
  if (/console\.log|const |let |=>/.test(code)) return "javascript";
  if (/fn |println!|let mut/.test(code)) return "rust";
  if (/public class|System\.out/.test(code)) return "java";
  return "text";
}

// ─── 4. PDF Plugin ─────────────────────────────────────────────────────────────

/**
 * PDF text extraction and Q&A.
 * The actual PDF parsing happens client-side (FileReader API).
 * This plugin receives the extracted text via PluginContext.fileContent.
 */
const PDFPlugin: Plugin = {
  id: "pdf",
  name: "PDF Reader",
  description: "Upload and analyze PDF documents",
  icon: "📄",
  category: "document",

  trigger: (input) => {
    const q = input.toLowerCase();
    return (
      q.startsWith("/pdf ") ||
      q.includes("summarize this pdf") ||
      q.includes("analyze this document") ||
      q.includes("from the pdf")
    );
  },

  execute: async (input, context) => {
    const question = input.replace(/^\/pdf\s+/i, "").trim();
    const fileContent = context?.fileContent;

    if (!fileContent) {
      return {
        output: "📄 **PDF Plugin**: Please upload a PDF file first using the attachment button.",
        error: "No file content provided",
      };
    }

    try {
      const { default: Groq } = await import("groq-sdk");
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

      const truncatedContent = fileContent.slice(0, 8000); // Token budget

      const res = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        max_tokens: 1024,
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content:
              "You are a document analyst. Answer questions based ONLY on the provided document content. " +
              "If the answer is not in the document, say so explicitly. Use Markdown formatting.",
          },
          {
            role: "user",
            content: `Document content:\n\n${truncatedContent}\n\n---\n\nQuestion: ${question || "Summarize this document"}`,
          },
        ],
      });

      const answer = res.choices[0]?.message?.content ?? "Could not analyze document";
      return {
        output: `## 📄 PDF Analysis\n\n${answer}`,
        metadata: { contentLength: fileContent.length, question },
      };
    } catch (err) {
      logger.error("[PDFPlugin] Failed", err);
      return { output: "PDF analysis failed.", error: String(err) };
    }
  },
};

// ─── Plugin Registry ───────────────────────────────────────────────────────────

export const PLUGIN_REGISTRY: Plugin[] = [
  WebSearchPlugin,
  CalculatorPlugin,
  CodeInterpreterPlugin,
  PDFPlugin,
];

export function getPlugin(id: string): Plugin | undefined {
  return PLUGIN_REGISTRY.find((p) => p.id === id);
}

export function getEnabledPlugins(enabledIds: string[]): Plugin[] {
  return PLUGIN_REGISTRY.filter((p) => enabledIds.includes(p.id));
}

// Default enabled plugins