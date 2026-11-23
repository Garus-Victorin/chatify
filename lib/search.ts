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
  const q = query.toLowerCase();
  const isWeather = /météo|meteo|weather|température|temperature/.test(q);

  if (isWeather) {
    const w = await fetchWeather(query);
    if (w) return { results: [w], query };
  }

  const apiKey = process.env.TAVILY_API_KEY;

  if (apiKey) {
    try {
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
            content: deduplicatedContent.slice(0, 300),
            score: r.score ?? 0,
          };
        })
        .filter((r: SearchResult) => r.content.length > 20);

      if (results.length > 0) return { results, query };
    } catch {
      // fall through to free fallback
    }
  }

  // Free fallback: DuckDuckGo Instant Answer
  try {
    const res = await axios.get("https://api.duckduckgo.com/", {
      params: { q: query, format: "json", no_html: 1, skip_disambig: 1 },
      timeout: 8000,
    });
    const data = res.data ?? {};
    const results: SearchResult[] = [];
    if (data.AbstractText) {
      results.push({
        title: data.Heading || query,
        url: data.AbstractURL || "",
        content: cleanText(data.AbstractText).slice(0, 300),
        score: 1,
      });
    }
    for (const t of data.RelatedTopics ?? []) {
      if (t.Text && results.length < maxResults) {
        results.push({
          title: cleanText(t.Text).slice(0, 80),
          url: t.FirstURL || "",
          content: cleanText(t.Text).slice(0, 300),
          score: 0.5,
        });
      }
    }
    return { results: results.filter((r) => r.content.length > 20), query };
  } catch {
    return { results: [], query };
  }
}

/**
 * Extract a location from a weather query
 */
function extractWeatherLocation(query: string): string | null {
  const m = query.match(/(?:météo|meteo|weather|température|temperature).*(?:de|à|a|in|for|pour)\s+([a-zA-ZÀ-ÿ\s]+)/i);
  if (m && m[1]) return m[1].trim().replace(/[?.!,]+$/, "");
  const words = query.trim().split(/\s+/);
  if (words.length > 0) {
    const last = words[words.length - 1].replace(/[?.!,]+$/, "");
    if (last.length > 2) return last;
  }
  return null;
}

/**
 * Fetch current weather from wttr.in (free, no API key)
 */
async function fetchWeather(query: string): Promise<SearchResult | null> {
  const loc = extractWeatherLocation(query);
  if (!loc) return null;
  try {
    const res = await axios.get(`https://wttr.in/${encodeURIComponent(loc)}`, {
      params: { format: "j1" },
      timeout: 8000,
      headers: { "User-Agent": "curl" },
    });
    const data = res.data ?? {};
    const current = data.current_condition?.[0];
    if (!current) return null;
    const desc = current.weatherDesc?.[0]?.value ?? "N/A";
    const temp = current.temp_C ?? "N/A";
    const humidity = current.humidity ?? "N/A";
    const wind = current.windspeedKmph ?? "N/A";
    const content = `Météo actuelle à ${loc}: ${desc}, ${temp}°C, humidité ${humidity}%, vent ${wind} km/h.`;
    return {
      title: `Météo ${loc}`,
      url: `https://wttr.in/${loc}`,
      content: content.slice(0, 300),
      score: 1,
    };
  } catch {
    return null;
  }
}
export function extractUrls(text: string): string[] {
  const regex = /https?:\/\/[^\s<>"')]+/gi;
  const matches = text.match(regex) ?? [];
  return [...new Set(matches.map((u) => u.replace(/[.,;:!?]+$/, "")))];
}

/**
 * Fetch and extract readable text from a URL
 */
export async function fetchUrlContent(url: string): Promise<SearchResult | null> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;

  const host = parsed.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    host === "0.0.0.0" ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    /^169\.254\./.test(host) ||
    host.endsWith(".local")
  ) {
    return null;
  }

  try {
    const res = await axios.get(url, {
      timeout: 10000,
      maxContentLength: 2 * 1024 * 1024,
      maxBodyLength: 2 * 1024 * 1024,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ChatifyBot/1.0)" },
      responseType: "text",
    });
    const cleaned = cleanText(String(res.data ?? ""));
    const deduplicated = deduplicateSentences(cleaned);
    if (deduplicated.length < 20) return null;
    return {
      title: url,
      url,
      content: deduplicated.slice(0, 1500),
      score: 1,
    };
  } catch {
    return null;
  }
}
export function formatContext(results: SearchResult[]): string {
  if (results.length === 0) return "No relevant web results found.";

  return results
    .map((r, i) => {
      return `[${i + 1}] ${r.title}\nSummary: ${r.content}\nURL: ${r.url}`;
    })
    .join("\n\n---\n\n");
}
