"use strict";

// Beam: a number line the hero hops along. Two ways to play:
//
// Recognise (tutorial):  start, hops: [5, 3], length
//   The hops are given; the kid taps the flower where the hero will land.
//
// Construct:  start, length, target, count, jumps: [2, 3, 5], avoid?: [7]
//   The kid builds a plan of exactly `count` jumps from the jump cards, presses
//   Go, and watches the hero hop. Landing on `target` wins. Landing anywhere else
//   (or in an `avoid` puddle) shows where she really ended up, and she rearranges.
//   Many plans, one target — the try-watch-adjust loop is the point.

window.SCENE_TYPES = window.SCENE_TYPES || {};
window.SCENE_TYPES.beam = {
  mount(scene, stage, api) {
    const construct = Array.isArray(scene.jumps);
    const avoid = new Set(scene.avoid || []);
    const tries = []; // each try: the plan or the guess, and where it landed
    let busy = false;
    let plan = [];

    stage.innerHTML =
      `<div class="beam-wrap">
         <div class="beam-top"></div>
         <div class="beam"><div class="beam-hero">${api.names.avatar}</div></div>
       </div>`;
    const top = stage.querySelector(".beam-top");
    const beam = stage.querySelector(".beam");
    const hero = stage.querySelector(".beam-hero");
    const spots = [];
    for (let n = 0; n <= scene.length; n++) {
      const b = document.createElement("button");
      b.className = "beam-spot" + (avoid.has(n) ? " puddle" : "") + (construct && n === scene.target ? " goal" : "");
      b.innerHTML = `<span class="beam-flower">${avoid.has(n) ? "💧" : construct && n === scene.target ? "🌻" : "🌼"}</span><span class="beam-num">${n}</span>`;
      if (!construct) b.addEventListener("click", () => guess(n, b));
      else b.disabled = true;
      beam.appendChild(b);
      spots.push(b);
    }
    beam.style.setProperty("--count", scene.length + 1);
    place(scene.start, false);

    function place(n, animate) {
      hero.style.transition = animate ? "left 0.45s cubic-bezier(.4,1.6,.6,1)" : "none";
      hero.style.left = `calc((100% / var(--count)) * ${n} + (100% / var(--count)) / 2)`;
    }

    // Hop for real, one jump at a time. Returns where the hero ended up (or the puddle hit).
    async function hopAll(hops) {
      let at = scene.start;
      place(at, false);
      for (const h of hops) {
        await api.wait(350);
        at += h;
        hero.classList.add("jump");
        place(at, true);
        await api.wait(500);
        hero.classList.remove("jump");
        if (avoid.has(at)) { hero.classList.add("splash"); await api.wait(500); hero.classList.remove("splash"); return { at, splash: true }; }
      }
      return { at, splash: false };
    }

    // ---- Recognise mode ----
    if (!construct) {
      top.innerHTML = `<div class="beam-hops">${scene.hops.map((h) => `<span class="hop-card">hop ${h}</span>`).join("<span class='hop-then'>then</span>")}</div>`;
    }
    const answer = construct ? scene.target : scene.hops.reduce((a, b) => a + b, scene.start);
    async function guess(n, b) {
      if (busy) return;
      busy = true;
      b.classList.add("picked");
      const r = await hopAll(scene.hops);
      tries.push(`tapped ${n}, hero landed on ${r.at}`);
      if (n === answer) {
        spots[n].classList.add("right");
        spots.forEach((s) => { s.disabled = true; });
        api.solved();
      } else {
        spots[n].classList.add("shake");
        setTimeout(() => spots[n].classList.remove("shake", "picked"), 600);
        api.wrong({ landed: r.at, guess: n });
        busy = false;
        await api.wait(900);
        if (!busy) place(scene.start, true);
      }
    }

    // ---- Construct mode ----
    if (construct) {
      top.innerHTML =
        `<div class="plan">
           <div class="plan-slots"></div>
           <button class="run-btn plan-go" disabled>Go! 🤸</button>
         </div>
         <div class="jump-cards"></div>`;
      const slotsEl = top.querySelector(".plan-slots");
      const go = top.querySelector(".plan-go");
      const cardsEl = top.querySelector(".jump-cards");
      for (const j of scene.jumps) {
        const b = document.createElement("button");
        b.className = "jump-card";
        b.textContent = (j > 0 ? "+" : "") + j;
        b.addEventListener("click", () => { if (!busy && plan.length < scene.count) { plan.push(j); renderPlan(); } });
        cardsEl.appendChild(b);
      }
      function renderPlan() {
        slotsEl.innerHTML = "";
        for (let i = 0; i < scene.count; i++) {
          const s = document.createElement("button");
          s.className = "plan-slot" + (plan[i] !== undefined ? " filled" : "");
          s.textContent = plan[i] !== undefined ? (plan[i] > 0 ? "+" : "") + plan[i] : "?";
          s.title = plan[i] !== undefined ? "Take this jump out" : "";
          s.disabled = plan[i] === undefined;
          s.addEventListener("click", () => { if (!busy) { plan.splice(i, 1); renderPlan(); } });
          slotsEl.appendChild(s);
        }
        go.disabled = plan.length !== scene.count;
        cardsEl.querySelectorAll(".jump-card").forEach((c) => { c.disabled = plan.length >= scene.count; });
      }
      renderPlan();
      go.addEventListener("click", async () => {
        if (busy || plan.length !== scene.count) return;
        busy = true;
        go.disabled = true;
        const r = await hopAll(plan);
        tries.push(`plan ${plan.map((j) => (j > 0 ? "+" : "") + j).join(" ")} landed on ${r.at}${r.splash ? " (puddle!)" : ""}`);
        if (!r.splash && r.at === scene.target) {
          spots[scene.target].classList.add("right");
          api.solved();
          return;
        }
        api.wrong({ landed: r.at, splash: r.splash ? "yes" : "no" });
        busy = false;
        await api.wait(900);
        if (!busy) { place(scene.start, true); renderPlan(); }
      });
    }

    return {
      state: () => tries.length ? `${tries.length} tr${tries.length === 1 ? "y" : "ies"} so far: ${tries.join("; ")}${construct ? `; plan right now: ${plan.join(", ") || "empty"}` : ""}` : "nothing tried yet",
      solution: () => construct
        ? `a plan of ${scene.count} jumps from ${scene.jumps.join("/")} that lands exactly on ${scene.target} from ${scene.start}, e.g. ${firstPlan().join(" then ")}`
        : `${answer} (start at ${scene.start}, hops ${scene.hops.join(" then ")})`,
      details: () => construct
        ? `a beam numbered 0 to ${scene.length}; hero starts on ${scene.start}; the goal flower is ${scene.target}; jump cards ${scene.jumps.join(", ")}; exactly ${scene.count} jumps${avoid.size ? `; puddles on ${[...avoid].join(", ")}` : ""}`
        : `a beam numbered 0 to ${scene.length}; the hero starts on ${scene.start}`,
    };

    function firstPlan() {
      const found = [];
      (function dfs(at, path) {
        if (found.length) return;
        if (path.length === scene.count) { if (at === scene.target) found.push(...path); return; }
        for (const j of scene.jumps) {
          const nx = at + j;
          if (nx < 0 || nx > scene.length || avoid.has(nx)) continue;
          dfs(nx, path.concat(j));
        }
      })(scene.start, []);
      return found.map((j) => (j > 0 ? "+" : "") + j);
    }
  },
};
