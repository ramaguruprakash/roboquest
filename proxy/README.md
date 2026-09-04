# Dronacharya's brain (the guru proxy)

A single Vercel Edge Function that lets the static RoboQuest page talk to Claude
without ever holding an API key. The page sends the level, the kid's program, and
what happened when it ran; this function checks the kid's password, adds the key,
asks Claude to coach in Dronacharya's voice, and returns the reply.

## Deploy (once, ~5 minutes)

1. Create a Vercel project from this `proxy/` folder (Vercel → Add New → Project →
   import the repo, set **Root Directory** to `proxy`). Or from the terminal:
   ```bash
   cd proxy && npx vercel
   ```
2. In the Vercel project, Settings → Environment Variables, add:

   | Variable | Value |
   |---|---|
   | `ANTHROPIC_API_KEY` | a **dedicated** key with a monthly spend cap set in the Anthropic console |
   | `GURU_TOKENS` | the passwords kids type, comma-separated: `mayur-2026` (add more later, remove one to revoke it) |
   | `ALLOWED_ORIGINS` | optional; defaults to `https://ramaguruprakash.github.io` plus localhost:8000 |
   | `GURU_MODEL` | optional; defaults to `claude-opus-5` |
   | `ELEVENLABS_API_KEY` | optional; turns on the ElevenLabs narrator for Rainier Rescue (`/api/say`). Without it the game uses the browser voice |
   | `ELEVEN_VOICE_NARRATOR` / `ELEVEN_VOICE_GURU` | optional voice ids (defaults: Matilda for the story, George for Dronacharya). List yours with `curl -H "xi-api-key: $KEY" https://api.elevenlabs.io/v1/voices` |

3. Redeploy so the variables take effect. Your endpoint is
   `https://<project>.vercel.app/api/guru`.
4. Paste that URL into `GURU_ENDPOINT` at the top of `js/guru.js`, and push the game.

## The narrator (`/api/say`)

`GET /api/say?text=...&voice=narrator|guru&token=...` returns MP3 from ElevenLabs. Same origin
allowlist and password as the guru; at most 400 characters a call and 40,000 an hour per password.
Responses carry a one-year CDN cache header, so each sentence is generated once and replayed free.
The game also keeps a copy in the browser's Cache Storage.

## What protects the key

- The key lives only in Vercel's environment. It is never in the repo or the page.
- Requests need a password from `GURU_TOKENS`. Wrong password → 401; the game asks the kid to check with a grown-up.
- Per-password rate limit (40 an hour, best-effort per edge instance). For a shared counter across
  instances, swap the `buckets` Map for Upstash Redis or Vercel KV.
- Origin allowlist stops other websites from using the endpoint from a browser. (A script can fake an
  Origin header — that is what the password and the spend cap are for.)
- The prompt is fixed here, `max_tokens` is small, and the request body is size-checked, so the worst
  case for an abuser is a few cents of guru replies, not a leaked key.
- Nothing is logged except upstream error statuses. Kids' names and programs are not stored.

## Trying it locally (no Vercel account needed)

```bash
# 1. secrets — this file is git-ignored
printf 'ANTHROPIC_API_KEY=sk-ant-...\nGURU_TOKENS=mayur-2026\n' > proxy/.env.local

# 2. the brain, in one terminal
node proxy/dev.js                     # → http://localhost:3000/api/guru

# 3. the game, in another
python3 -m http.server 8000
```
Then open **http://localhost:8000/?guru=http://localhost:3000/api/guru** once. The game stores that
endpoint in localStorage and keeps using it; `?guru=reset` forgets it. Sign in with any name and the
password from `GURU_TOKENS`.

`npx vercel dev` also works if you prefer the Vercel toolchain.
