"use strict";

// Beam: a number line the hero hops along.
//   start   where the hero begins (a number on the beam)
//   hops    [5, 3] — hop sizes, in order (negative hops go backwards)
//   length  the biggest number on the beam
// The kid taps the number where the hero will land. Right or wrong, the hero
// then hops for real, one hop at a time, so the answer is visible either way.

window.SCENE_TYPES = window.SCENE_TYPES || {};
window.SCENE_TYPES.beam = {
  mount(scene, stage, api) {
    const answer = scene.hops.reduce((a, b) => a + b, scene.start);
    const guesses = [];
    let busy = false;

    stage.innerHTML =
      `<div class="beam-wrap">
         <div class="beam-hops">${scene.hops.map((h) => `<span class="hop-card">hop ${h > 0 ? h : h}</span>`).join("<span class='hop-then'>then</span>")}</div>
         <div class="beam"><div class="beam-hero">${api.names.avatar}</div></div>
       </div>`;
    const beam = stage.querySelector(".beam");
    const hero = stage.querySelector(".beam-hero");
    const spots = [];
    for (let n = 0; n <= scene.length; n++) {
      const b = document.createElement("button");
      b.className = "beam-spot";
      b.innerHTML = `<span class="beam-flower">🌼</span><span class="beam-num">${n}</span>`;
      b.style.setProperty("--i", n);
      b.addEventListener("click", () => tap(n, b));
      beam.appendChild(b);
      spots.push(b);
    }
    beam.style.setProperty("--count", scene.length + 1);
    place(scene.start, false);

    function place(n, animate) {
      hero.style.transition = animate ? "left 0.45s cubic-bezier(.4,1.6,.6,1)" : "none";
      hero.style.left = `calc((100% / var(--count)) * ${n} + (100% / var(--count)) / 2)`;
    }

    async function tap(n, b) {
      if (busy) return;
      busy = true;
      guesses.push(n);
      b.classList.add("picked");
      // Hop for real so the kid sees where the hero really lands.
      let at = scene.start;
      place(at, false);
      for (const h of scene.hops) {
        await api.wait(350);
        at += h;
        hero.classList.add("jump");
        place(at, true);
        await api.wait(500);
        hero.classList.remove("jump");
      }
      if (n === answer) {
        spots[n].classList.add("right");
        spots.forEach((s) => { s.disabled = true; });
        api.solved();
      } else {
        spots[n].classList.add("shake");
        setTimeout(() => { spots[n].classList.remove("shake", "picked"); }, 600);
        api.wrong({ landed: at, guess: n });
        busy = false;
        await api.wait(900);
        if (!busy) place(scene.start, true);
      }
    }

    return {
      state: () => guesses.length ? `flowers tapped so far: ${guesses.join(", ")}` : "nothing tapped yet",
      solution: () => `${answer} (start at ${scene.start}, hops ${scene.hops.join(" then ")})`,
      details: () => `a beam numbered 0 to ${scene.length}; the hero starts on ${scene.start}`,
    };
  },
};
