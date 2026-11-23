import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const apiKey = process.env.KILO_API_KEY || process.env.NEXT_PUBLIC_KILO_API_KEY;
  const base = process.env.KILO_BASE_URL || process.env.NEXT_PUBLIC_KILO_BASE_URL || "https://ai-gateway.kilo.ai/api/v1";
  const headers: Record<string, string> = {};
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  try {
    const res = await fetch(`${base}/models`, { headers });
    if (!res.ok) {
      return Response.json({ error: `Kilo models failed: ${res.status}` }, { status: res.status });
    }
    const data = await res.json();
    return Response.json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ error: msg }, { status: 500 });
  }
}
