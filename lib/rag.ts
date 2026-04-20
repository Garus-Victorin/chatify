import Groq from "groq-sdk";
import { searchWeb, formatContext, SearchResult } from "./search";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export interface RAGContext {
  needsSearch: boolean;
  sources: SearchResult[];
  systemPrompt: string;
}

// ─── System prompts ────────────────────────────────────────────────────────────

const BASE_SYSTEM = `You are Chatify, a professional AI assistant. You ALWAYS respond in clean Markdown format.

## OUTPUT FORMAT (STRICT — ALWAYS FOLLOW)

Your responses MUST use Markdown formatting:
- Use **bold** for key terms and important concepts
- Use # ## ### headings to structure long answers
- Use bullet lists (- item) for enumerations
- Use numbered lists (1. item) for steps or ranked items
- Use \`inline code\` for technical terms, commands, variables
- Use fenced code blocks with language tag for all code:
  \`\`\`python
  # code here
  \`\`\`
- Use > blockquotes for notes, warnings, or citations
- Use tables for comparisons or structured data
- Use --- horizontal rules to separate major sections

## RESPONSE STRUCTURE

For factual/informational questions:
## [Short Title]

[1-2 sentence summary]

### Key Points
- Point 1
- Point 2

For code questions:
Brief explanation, then a properly tagged code block.

For conversational questions:
Respond naturally but still use **bold** for emphasis.

## QUALITY RULES
- Never output plain unformatted paragraphs for structured content
- Never repeat words, phrases, or sentences
- Never produce incomplete or broken text
- Be direct and factual — no filler phrases
- Do not hallucinate — if unsure, say so explicitly
- Keep responses concise but complete`;

const WEB_SYSTEM = (contextBlock: string) =>
  `${BASE_SYSTEM}

## WEB SEARCH CONTEXT
The following results were retrieved from the web. Use them to answer accurately.
Cite sources using [1], [2], etc. when referencing specific facts.
If results are outdated or irrelevant, rely on your training knowledge and say so.

---
${contextBlock}
---

## IMPORTANT
- Synthesize the sources — do not copy them verbatim
- Only cite sources that are directly relevant
- If sources contradict each other, mention it
- Always end with a brief, clear conclusion`;

// ─── Intent detection ──────────────────────────────────────────────────────────

async function detectSearchIntent(query: string): Promise<boolean> {
  try {
    const res = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      max_tokens: 3,
      temperature: 0,
      messages: [
        {
          role: "system",
          content:
            "You are a classifier. Reply ONLY with YES or NO.\n" +
            "Does this question require real-time web search?\n" +
            "YES for: current events, news, prices, weather, sports, recent releases, live data.\n" +
            "NO for: general knowledge, coding, math, writing, history, explanations.",
        },
        { role: "user", content: query },
      ],
    });

    const answer = res.choices[0]?.message?.content?.trim().toUpperCase() ?? "NO";
    return answer.startsWith("YES");
  } catch {
    return keywordDetect(query);
  }
}

function keywordDetect(query: string): boolean {
  const q = query.toLowerCase();
  const triggers = [
    "today", "now", "current", "latest", "news", "price", "weather",
    "score", "stock", "2024", "2025", "recently", "just announced",
    "who won", "what happened", "live", "trending", "release date",
    "actualité", "prix", "météo", "aujourd'hui", "récent",
  ];
  return triggers.some((t) => q.includes(t));
}

// ─── Main RAG pipeline ─────────────────────────────────────────────────────────

export async function buildRAGContext(
  query: string,
  forceSearch = false
): Promise<RAGContext> {
  const needsSearch = forceSearch || (await detectSearchIntent(query));

  if (!needsSearch) {
    return { needsSearch: false, sources: [], systemPrompt: BASE_SYSTEM };
  }

  try {
    const { results } = await searchWeb(query);

    if (results.length === 0) {
      return {
        needsSearch: true,
        sources: [],
        systemPrompt:
          BASE_SYSTEM +
          "\n\n> Web search returned no relevant results. Answer from training knowledge.",
      };
    }

    const contextBlock = formatContext(results);

    return {
      needsSearch: true,
      sources: results,
      systemPrompt: WEB_SYSTEM(contextBlock),
    };
  } catch (err) {
    console.error("[RAG] Search failed:", err);
    return {
      needsSearch: true,
      sources: [],
      systemPrompt:
        BASE_SYSTEM +
        "\n\n> Web search is currently unavailable. Answering from training data only.",
    };
  }
}
