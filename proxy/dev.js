// Run Dronacharya's brain on your own machine — no Vercel needed.
//
//   1. Put your secrets in proxy/.env.local (git-ignored):
//        ANTHROPIC_API_KEY=sk-ant-...
//        GURU_TOKENS=mayur-2026
//   2. node proxy/dev.js            → http://localhost:3000/api/guru
//   3. Serve the game (python3 -m http.server 8000) and open it once as
//        http://localhost:8000/?guru=http://localhost:3000/api/guru
//      The game remembers that endpoint in localStorage.
//
// This is the exact handler Vercel runs, wrapped in node's http module.

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const envFile = path.join(here, ".env.local");
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
for (const k of ["ANTHROPIC_API_KEY", "GURU_TOKENS"]) {
  if (!process.env[k]) console.warn(`⚠️  ${k} is not set — put it in proxy/.env.local`);
}

const { default: handler } = await import("./api/guru.js");
const PORT = Number(process.env.PORT || 3000);

http.createServer(async (req, res) => {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const body = Buffer.concat(chunks);
  const request = new Request(`http://localhost:${PORT}${req.url}`, {
    method: req.method,
    headers: req.headers,
    body: req.method === "GET" || req.method === "HEAD" ? undefined : body,
  });
  try {
    const out = await handler(request);
    res.writeHead(out.status, Object.fromEntries(out.headers));
    res.end(Buffer.from(await out.arrayBuffer()));
  } catch (e) {
    console.error(e);
    res.writeHead(500, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "dev server crashed: " + e.message }));
  }
}).listen(PORT, () => {
  console.log(`🧙 Dronacharya is listening at http://localhost:${PORT}/api/guru`);
  console.log(`   open the game as: http://localhost:8000/?guru=http://localhost:${PORT}/api/guru`);
});
