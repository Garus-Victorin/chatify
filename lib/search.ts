import axios from "axios";

export interface SearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

export interface SearchResponse {
  results: SearchResult[];
  query: string;
}

/**
 * Clean HTML tags and normalize text
 */
function cleanText(text: string): string {
  return text
    .replace(/<[^>]*>/g, " ")           // Remove HTML tags
    .replace(/&[a-z]+;/gi, " ")         // Remove HTML entities
    .replace(/\s+/g, " ")                // Normalize whitespace
    .replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, "") // Remove control chars
    .trim();
}

/**
 * Remove duplicate sentences from text
 */
function deduplicateSentences(text: string): string {
  const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const sentence of sentences) {
    const normalized = sentence.toLowerCase();
    if (!seen.has(normalized) && sentence.length > 10) {
      seen.add(normalized);
      unique.push(sentence);
    }
  }

  return unique.join(". ") + (unique.length > 0 ? "." : "");
}

/**
 * Search the web using Tavily API with cleaning and deduplication
 */
export async function searchWeb(query: string, maxResults = 5): Promise<SearchResponse> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) throw new Error("TAVILY_API_KEY is not set.");

  const res = await axios.post(
    "https://api.tavily.com/search",
    {
      api_key: apiKey,
      query,
      search_depth: "basic",
      include_answer: false,
      include_raw_content: false,
      max_results: maxResults,
    },
    { headers: { "Content-Type": "application/json" }, timeout: 8000 }
  );

  const results: SearchResult[] = (res.data.results ?? [])
    .map((r: { title?: string; url?: string; content?: string; score?: number }) => {
      const cleanedContent = cleanText(r.content ?? "");
      const deduplicatedContent = deduplicateSentences(cleanedContent);

      return {
        title: cleanText(r.title ?? "Untitled"),
        url: r.url ?? "",
        content: deduplicatedContent.slice(0, 300), // Limit to 300 chars
        score: r.score ?? 0,
      };
    })
    .filter((r: SearchResult) => r.content.length > 20); // Filter out empty results

  return { results, query };
}

/**
 * Format search results into a clean, structured context block for LLM
 */
export function formatContext(results: SearchResult[]): string {
  if (results.length === 0) return "No relevant web results found.";

  return results
    .map((r, i) => {
      return `[${i + 1}] ${r.title}\nSummary: ${r.content}\nURL: ${r.url}`;
    })
    .join("\n\n---\n\n");
}
