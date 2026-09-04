"use strict";

// The narrator: ElevenLabs through the proxy's /api/say, with the browser's own
// voice as the fallback. Audio is cached in the browser (Cache Storage) so a
// sentence is fetched once per device, and the CDN caches it for everyone else.
//
//   Voice.speak(text, { voice: "narrator" | "guru" })  -> Promise<boolean> (true if it played)
//   Voice.prefetch(text, voice)                          warm the cache for what comes next
//   Voice.stop()
//
// Needs the grown-up password (the same one Dronacharya uses). Without it, or
// offline, speak() returns false and the caller uses speechSynthesis instead.

const Voice = (() => {
  const CACHE = "rainier-voice-v1";
  const endpoint = () => (Guru.endpoint || "").replace(/\/api\/guru$/, "/api/say");
  const identity = () => {
    try { return JSON.parse(localStorage.getItem("rainier-guru-identity") || "null") || {}; } catch { return {}; }
  };
  let current = null;   // the <audio> playing now
  let disabledUntil = 0; // back off after a hard failure (no key, wrong password)

  function url(text, voice) {
    const tok = identity().token;
    if (!tok || !endpoint()) return null;
    return `${endpoint()}?voice=${encodeURIComponent(voice)}&text=${encodeURIComponent(text)}&token=${encodeURIComponent(tok)}`;
  }

  async function fetchAudio(text, voice) {
    const u = url(text, voice);
    if (!u || Date.now() < disabledUntil) return null;
    let cache = null;
    try { cache = "caches" in window ? await caches.open(CACHE) : null; } catch { cache = null; }
    if (cache) {
      const hit = await cache.match(u).catch(() => null);
      if (hit) return hit.blob();
    }
    const res = await fetch(u).catch(() => null);
    if (!res || !res.ok) {
      // No key on the proxy, wrong password, or over budget: stop asking for a while.
      if (res && [401, 403, 429, 501].includes(res.status)) disabledUntil = Date.now() + 10 * 60_000;
      return null;
    }
    if (cache) cache.put(u, res.clone()).catch(() => {});
    return res.blob();
  }

  function stop() {
    if (current) { current.pause(); current.src = ""; current = null; }
  }

  async function speak(text, opts = {}) {
    const clean = String(text).replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, "").replace(/\s+/g, " ").trim();
    if (!clean) return false;
    const blob = await fetchAudio(clean, opts.voice || "narrator");
    if (!blob) return false;
    stop();
    const a = new Audio(URL.createObjectURL(blob));
    current = a;
    a.onended = () => { if (current === a) current = null; URL.revokeObjectURL(a.src); if (opts.onEnd) opts.onEnd(); };
    try { await a.play(); } catch { current = null; return false; }
    return true;
  }

  function prefetch(text, voice = "narrator") {
    const clean = String(text).replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, "").replace(/\s+/g, " ").trim();
    if (clean) fetchAudio(clean, voice).catch(() => {});
  }

  return { speak, stop, prefetch, available: () => !!url("x", "narrator") };
})();
