// The narrator's voice — a Vercel Edge Function in front of ElevenLabs.
//
// The game asks for short sentences as audio: GET /api/say?text=...&voice=narrator&token=...
// This function checks the origin and the kid's password, keeps the ElevenLabs key
// server-side, and returns MP3 with long cache headers so Vercel's CDN replays a
// sentence for free the second time anyone hears it.
//
// Environment variables:
//   ELEVENLABS_API_KEY        from elevenlabs.io → profile → API keys
//   ELEVEN_VOICE_NARRATOR     voice id for story and scenes (default: Matilda, warm storyteller)
//   ELEVEN_VOICE_GURU         voice id for Dronacharya (default: George, warm storyteller)
//   ELEVEN_MODEL              default eleven_turbo_v2_5 (fast, cheap); eleven_multilingual_v2 for richer
//   GURU_TOKENS, ALLOWED_ORIGINS   shared with api/guru.js
//
// Without ELEVENLABS_API_KEY the endpoint answers 501 and the game falls back to
// the browser's built-in voice, so nothing breaks.

export const config = { runtime: "edge" };

const DEFAULT_ORIGINS = ["https://ramaguruprakash.github.io", "http://localhost:8000", "http://127.0.0.1:8000"];
const VOICES = {
  narrator: process.env.ELEVEN_VOICE_NARRATOR || "XrExE9yKIg1WjnnlVkGX", // Matilda: warm, clear, paced for a child reading along
  guru: process.env.ELEVEN_VOICE_GURU || "JBFqnCBsd6RMkjVDRZzb",         // George
};
const MODEL = process.env.ELEVEN_MODEL || "eleven_turbo_v2_5";
const MAX_CHARS = 400;            // one sentence or two; the game never sends more
const MAX_CHARS_PER_HOUR = 40_000; // per password, best effort per edge instance

const buckets = new Map(); // token -> [{ t, n }]
function overBudget(token, n) {
  const now = Date.now();
  const hits = (buckets.get(token) || []).filter((h) => now - h.t < 3600_000);
  const used = hits.reduce((a, h) => a + h.n, 0);
  if (used + n > MAX_CHARS_PER_HOUR) return true;
  hits.push({ t: now, n });
  buckets.set(token, hits);
  return false;
}

function corsHeaders(origin, allowed) {
  return {
    "Access-Control-Allow-Origin": allowed.includes(origin) ? origin : allowed[0],
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Max-Age": "86400",
  };
}
const json = (body, status, headers) =>
  new Response(JSON.stringify(body), { status, headers: { ...headers, "Content-Type": "application/json" } });

export default async function handler(req) {
  const allowed = (process.env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (!allowed.length) allowed.push(...DEFAULT_ORIGINS);
  const origin = req.headers.get("origin") || "";
  const headers = corsHeaders(origin, allowed);

  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (req.method !== "GET") return json({ error: "GET only" }, 405, headers);
  if (!allowed.includes(origin)) return json({ error: "origin not allowed" }, 403, headers);

  const url = new URL(req.url);
  const text = (url.searchParams.get("text") || "").replace(/\s+/g, " ").trim();
  const voiceName = url.searchParams.get("voice") || "narrator";
  const token = url.searchParams.get("token") || "";

  const tokens = (process.env.GURU_TOKENS || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (!tokens.length) return json({ error: "GURU_TOKENS not configured" }, 500, headers);
  if (!tokens.includes(token)) return json({ error: "wrong password" }, 401, headers);
  if (!text) return json({ error: "no text" }, 400, headers);
  if (text.length > MAX_CHARS) return json({ error: "too long" }, 413, headers);
  if (!VOICES[voiceName]) return json({ error: "unknown voice" }, 400, headers);
  if (!process.env.ELEVENLABS_API_KEY) return json({ error: "voice not configured" }, 501, headers);
  if (overBudget(token, text.length)) return json({ error: "slow down" }, 429, headers);

  let upstream;
  try {
    upstream = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICES[voiceName]}?output_format=mp3_44100_96`, {
      method: "POST",
      headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY, "content-type": "application/json", accept: "audio/mpeg" },
      body: JSON.stringify({
        text,
        model_id: MODEL,
        voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.35, use_speaker_boost: true },
      }),
    });
  } catch {
    return json({ error: "upstream unreachable" }, 502, headers);
  }
  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => "");
    console.error("elevenlabs", upstream.status, detail.slice(0, 300));
    return json({ error: "upstream " + upstream.status }, upstream.status === 429 ? 429 : 502, headers);
  }
  const audio = await upstream.arrayBuffer();
  return new Response(audio, {
    status: 200,
    headers: {
      ...headers,
      "Content-Type": "audio/mpeg",
      // The same sentence in the same voice never changes: let the CDN and the browser keep it.
      "Cache-Control": "public, max-age=2592000, s-maxage=31536000, immutable",
    },
  });
}
