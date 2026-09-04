"use strict";

// Guess: Teddy hides a number. Ask yes/no questions, watch the number line shrink, then guess.
//   min, max:   the range (1 to 20)
//   questions:  how many questions before she must guess
// Tap a number, then choose "Is it bigger than N?" or "Is it N?". An "Is it even?"
// button is always there. Numbers ruled out fade. A wrong final guess costs
// nothing but gives two more questions. Halving the range is the whole idea.

window.SCENE_TYPES = window.SCENE_TYPES || {};
window.SCENE_TYPES.guess = {
  mount(scene, stage, api) {
    const min = scene.min || 1, max = scene.max || 20;
    const secret = min + Math.floor(Math.random() * (max - min + 1));
    let alive = new Set(Array.from({ length: max - min + 1 }, (_, i) => min + i));
    let left = scene.questions || 5;
    let picked = null;
    const log = [];
    stage.innerHTML =
      `<div class="guess-wrap">
         <div class="guess-bubble"><span class="guess-cub">🐻</span><span class="guess-say">Pick a number. Then ask me!</span></div>
         <div class="numline"></div>
         <div class="guess-actions">
           <button class="q-btn bigger" disabled>Is it bigger than ?</button>
           <button class="q-btn even">Is it even?</button>
           <button class="run-btn final" disabled>It is ?!</button>
         </div>
         <p class="guess-left"></p>
       </div>`;
    const line = stage.querySelector(".numline");
    const say = stage.querySelector(".guess-say");
    const bigger = stage.querySelector(".bigger");
    const even = stage.querySelector(".even");
    const final = stage.querySelector(".final");
    const leftEl = stage.querySelector(".guess-left");
    const numEls = {};
    for (let n = min; n <= max; n++) {
      const b = document.createElement("button");
      b.className = "num";
      b.textContent = n;
      b.addEventListener("click", () => { if (alive.has(n)) { picked = n; render(); } });
      line.appendChild(b);
      numEls[n] = b;
    }
    function render() {
      for (let n = min; n <= max; n++) { numEls[n].classList.toggle("out", !alive.has(n)); numEls[n].classList.toggle("picked", picked === n); }
      bigger.disabled = picked === null || left === 0;
      bigger.textContent = picked === null ? "Is it bigger than ?" : `Is it bigger than ${picked}?`;
      even.disabled = left === 0;
      final.disabled = picked === null;
      final.textContent = picked === null ? "It is ?!" : `It is ${picked}!`;
      leftEl.textContent = left > 0 ? `${left} question${left === 1 ? "" : "s"} left. ${alive.size} numbers could still be it.` : `No questions left. ${alive.size} numbers could still be it. Guess!`;
    }
    function answer(q, yes, keep) {
      left--;
      alive = new Set([...alive].filter(keep));
      say.textContent = yes ? "Yes!" : "No!";
      log.push(`${q} → ${yes ? "yes" : "no"}`);
      picked = null;
      render();
    }
    bigger.addEventListener("click", () => { if (bigger.disabled) return; const p = picked; const yes = secret > p; answer(`bigger than ${p}`, yes, (n) => (yes ? n > p : n <= p)); });
    even.addEventListener("click", () => { if (even.disabled) return; const yes = secret % 2 === 0; answer("even", yes, (n) => (yes ? n % 2 === 0 : n % 2 === 1)); });
    final.addEventListener("click", () => {
      if (final.disabled) return;
      const g = picked;
      log.push(`guessed ${g}`);
      if (g === secret) {
        say.textContent = "You got it!";
        numEls[g].classList.add("right");
        stage.querySelectorAll("button").forEach((b) => { b.disabled = true; });
        api.solved();
        return;
      }
      alive.delete(g);
      left += 2;
      picked = null;
      say.textContent = "Nope!";
      render();
      api.wrong({ guess: g });
    });
    render();
    return {
      state: () => `questions left: ${left}; numbers still possible: ${[...alive].join(", ")}; asked so far: ${log.join("; ") || "nothing"}`,
      solution: () => `the secret number is ${secret}; asking "bigger than" the middle number each time finds it`,
      details: () => `Teddy hid a number from ${min} to ${max}; she may ask "is it bigger than N" or "is it even" ${scene.questions || 5} times, then must tap the number`,
    };
  },
};
