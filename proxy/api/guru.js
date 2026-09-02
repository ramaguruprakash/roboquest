// Dronacharya's brain — a Vercel Edge Function.
//
// The RoboQuest page (static, on GitHub Pages) POSTs here; this function holds
// the Claude API key, checks the kid's password, rate-limits, and asks Claude
// to coach. The page never sees the key.
//
// Environment variables (Vercel → Project → Settings → Environment Variables):
//   ANTHROPIC_API_KEY   your key — make a dedicated one with a monthly spend cap
//   GURU_TOKENS         comma-separated passwords, e.g. "mayur-2026,cousins-xyz"
//   ALLOWED_ORIGINS     optional, comma-separated; defaults below
//   GURU_MODEL          optional, defaults to claude-opus-5
//
// Request:  { name, token, context, history: [{role, text}], question }
// Response: { reply }   or   { error } with 401 / 403 / 413 / 429 / 502

export const config = { runtime: "edge" };

const DEFAULT_ORIGINS = ["https://ramaguruprakash.github.io", "http://localhost:8000", "http://127.0.0.1:8000"];
const MODEL = process.env.GURU_MODEL || "claude-opus-5"; // e.g. claude-sonnet-5 for cheaper, quicker replies
const FALLBACKS = /^claude-(opus-5|fable)/.test(MODEL);
const MAX_PER_HOUR = 40; // per password — best-effort, per edge instance

// ---------- Rate limiting (best effort; use Upstash/Vercel KV for a shared counter) ----------
const buckets = new Map(); // token -> [timestamps]
function rateLimited(token) {
  const now = Date.now();
  const hits = (buckets.get(token) || []).filter((t) => now - t < 3600_000);
  if (hits.length >= MAX_PER_HOUR) return true;
  hits.push(now);
  buckets.set(token, hits);
  return false;
}

// ---------- Who Dronacharya is ----------

const PERSONA = `You are Dronacharya, the wise and playful coding guru inside RoboQuest, a game where a kid (age 8 to 11) writes tiny programs to steer Robo the robot 🤖 across a grid, collect gems 💎 and reach the flag 🏁. You are named after the legendary teacher of the Pandavas: patient, warm, a little mischievous, and utterly convinced this kid can figure it out.

YOUR ONE RULE: never give the answer. Never write the kid's program or the missing line for them. You give the kid a better QUESTION, a thing to LOOK at, or a tiny experiment to TRY. A guru who hands out answers makes weak coders.

HOW YOU TALK
- Short! 2 to 4 sentences. One idea at a time. A kid is reading this on a small panel.
- Simple words a 9-year-old knows. No jargon. Say "loop" not "iteration", "check" not "condition", "word" not "keyword".
- Warm and fun. Cheer real effort ("You got Robo around the corner — that part is DONE."). Sprinkle an emoji or two, never a parade of them.
- Almost always end with a question or a "try this and watch what happens". Curiosity, not commands.
- Use the kid's name once in a while, not every message.
- Start from what the kid actually did. If their program hit a wall on line 3, talk about line 3 and the wall. Point at the board: "count the squares", "slow Robo down to 🐢 and watch", "hover a square to see its column and row".
- Celebrate mistakes as clues: "Bonk! Excellent — now we know exactly where the trouble is."

HOW YOU HELP (a ladder — climb one rung per ask)
1. First ask: a pure question that points their eyes at the right place.
2. If they ask again about the same problem: name the idea they need (e.g. "this is a job for while, which keeps going until something changes") — still no code.
3. If still stuck: you may show the SHAPE of one spell from the spellbook (e.g. "repeat 4:" with the lines pushed in by 2 spaces) using a made-up example, never their actual missing line.
4. Never go further than that. If they beg for the answer, smile and hand them one more clue; tell them the 🗝️ hint button exists if they truly want it.

WHAT YOU KNOW BUT NEVER SAY
- You are given the level's reference solution and hint so you can steer well. Do not reveal either, do not paraphrase the solution line by line, do not confirm or deny a guess of the full program.
- If the kid's program would already WIN, say so joyfully and tell them to press ▶ Run.
- If the kid asks about something unrelated to the game, answer in one friendly sentence and steer back to Robo.

THE ROBO LANGUAGE (so you never invent syntax)
  move            walk 1 square      move 3   walks 3
  turn left / turn right             a quarter turn in place
  pickup          grab the gem on this square (error if none)
  drop            stamp a ⭐ here    drop A   stamps the character A (one stamp per square)
  dropgem         set down the LAST gem picked up (backpack is last-in-first-out)
  goto 4 2        art levels only: jump to column 4, row 2 (count from 0, top-left)
  set n = 3       a number box; set n = n + 1 makes it grow; use n anywhere a number goes
  repeat 4:       loop; the body is the lines below, pushed in by 2 spaces
  if gem here:    checks: gem here · wall ahead · clear ahead · at goal · has 3 gems · has red gem
  else:           put "not" before a check to flip it
  while not wall ahead:   keep going as long as the check is true
  define dance:   teach a new word; later write   dance   on its own line to do it
Columns count left to right from 0; rows count top to bottom from 0. Levels may have a line limit or "must use" words — those are teaching rules, honor them.

FOR WEB STUDIO LEVELS (kind = "web") the kid writes real HTML in a live preview: <h1>, <h2>, <p>, <ul>/<li>, <img src="img/robo.svg">, <button>. Same rules: questions, not markup. You may name a tag; never type their page for them.`;

function contextBlock(ctx) {
  if (ctx.kind === "web") {
    return [
      `LEVEL: ${ctx.level.title}`,
      `WHAT THE LEVEL ASKS: ${ctx.level.intro}`,
      ctx.level.newTags.length ? `NEW TAGS THIS LEVEL: ${ctx.level.newTags.join(", ")}` : "",
      `LEVEL HINT (secret, for steering only): ${ctx.level.hint}`,
      `REFERENCE SOLUTION (secret, never reveal):\n${ctx.level.solution}`,
      `THE KID'S PAGE RIGHT NOW:\n${ctx.code || "(empty)"}`,
      `WHAT THE CHECKS SAY: ${ctx.report}`,
    ].filter(Boolean).join("\n\n");
  }
  const lv = ctx.level;
  const rules = [];
  if (lv.maxLines) rules.push(`at most ${lv.maxLines} lines`);
  if (lv.mustUse.length) rules.push(`must use: ${lv.mustUse.join(", ")}`);
  return [
    `LEVEL: ${lv.title}  (concept: ${lv.concept})`,
    `WHAT THE LEVEL ASKS: ${lv.intro}`,
    rules.length ? `LEVEL RULES: ${rules.join("; ")}` : "",
    lv.newCommands.length ? `NEW WORD(S) THIS LEVEL: ${lv.newCommands.join(", ")}` : "",
    `WORDS THE KID HAS LEARNED SO FAR: ${lv.knownCommands.join(", ") || "none yet"}`,
    `THE BOARD(S):\n${ctx.worlds.join("\n")}`,
    `LEVEL HINT (secret, for steering only): ${lv.hint}`,
    `REFERENCE SOLUTION (secret, never reveal):\n${lv.solution}`,
    `THE KID'S PROGRAM RIGHT NOW:\n${ctx.code || "(empty)"}`,
    `WHAT HAPPENED WHEN IT RAN: ${ctx.report}`,
    `The kid has pressed Run ${lv.attempts} time(s) on this level${lv.completed ? " and has ALREADY beaten it before" : ""}.`,
  ].filter(Boolean).join("\n\n");
}

// ---------- The handler ----------

function corsHeaders(origin, allowed) {
  return {
    "Access-Control-Allow-Origin": allowed.includes(origin) ? origin : allowed[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Max-Age": "86400",
    "Content-Type": "application/json",
  };
}
const json = (body, status, headers) => new Response(JSON.stringify(body), { status, headers });

export default async function handler(req) {
  const allowed = (process.env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (!allowed.length) allowed.push(...DEFAULT_ORIGINS);
  const origin = req.headers.get("origin") || "";
  const headers = corsHeaders(origin, allowed);

  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (req.method !== "POST") return json({ error: "POST only" }, 405, headers);
  if (!allowed.includes(origin)) return json({ error: "origin not allowed" }, 403, headers);

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "bad json" }, 400, headers);
  }
  const { name = "", token = "", context, history = [], question = "" } = body || {};

  const tokens = (process.env.GURU_TOKENS || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (!tokens.length) return json({ error: "GURU_TOKENS not configured" }, 500, headers);
  if (typeof token !== "string" || !tokens.includes(token)) return json({ error: "wrong password" }, 401, headers);
  if (rateLimited(token)) return json({ error: "slow down" }, 429, headers);

  if (!context || (context.kind !== "robo" && context.kind !== "web") || typeof question !== "string") {
    return json({ error: "bad request" }, 400, headers);
  }
  if (JSON.stringify(context).length > 12_000 || question.length > 400 || !Array.isArray(history) || history.length > 8) {
    return json({ error: "too big" }, 413, headers);
  }
  if (!process.env.ANTHROPIC_API_KEY) return json({ error: "ANTHROPIC_API_KEY not configured" }, 500, headers);

  const kidName = String(name).replace(/[^\p{L}\p{N} '\-]/gu, "").slice(0, 24);
  const messages = [];
  for (const m of history) {
    if ((m.role === "user" || m.role === "assistant") && typeof m.text === "string" && m.text.trim()) {
      // Claude needs strictly alternating turns; skip a repeat of the previous role.
      if (messages.length && messages[messages.length - 1].role === m.role) continue;
      messages.push({ role: m.role, content: m.text.slice(0, 1200) });
    }
  }
  if (messages.length && messages[0].role === "assistant") messages.shift();
  if (messages.length && messages[messages.length - 1].role === "user") messages.pop();
  messages.push({
    role: "user",
    content:
      `<situation>\n${contextBlock(context)}\n</situation>\n\n` +
      `The kid${kidName ? ` (${kidName})` : ""} says: ${question.trim() || "I'm stuck. Can you help me think?"}`,
  });

  let upstream;
  try {
    upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        // Server-side refusal fallbacks exist for the Opus/Fable tier only.
        ...(FALLBACKS ? { "anthropic-beta": "server-side-fallback-2026-07-01" } : {}),
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 400,
        output_config: { effort: "low" },
        ...(FALLBACKS ? { fallbacks: "default" } : {}),
        system: [{ type: "text", text: PERSONA, cache_control: { type: "ephemeral" } }],
        messages,
      }),
    });
  } catch {
    return json({ error: "upstream unreachable" }, 502, headers);
  }

  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => "");
    console.error("anthropic", upstream.status, detail.slice(0, 300));
    return json({ error: "upstream " + upstream.status }, upstream.status === 429 ? 429 : 502, headers);
  }
  const data = await upstream.json();
  if (data.stop_reason === "refusal") {
    return json({ reply: "Hmm, let's come at that from a different side. What is the very next thing you want Robo to do?" }, 200, headers);
  }
  const reply = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
  return json({ reply: reply || "Tell me a little more — what did Robo do that surprised you?" }, 200, headers);
}
