"use strict";

// Fill: tap number cards into a container until it holds the right amount.
//   target      the total the container must reach
//   choices     [{ n, icon, label, need? }]  cards on the table
//   container   emoji for the bag / basket / jar
//   showTarget  show the target on the meter (false when the note already says it)
//   clues       optional note shown on paper (not auto-read): the list she must read
// Three ways to win, by data:
//   need: true on some cards  -> exactly those cards must go in (a reading list)
//   exactCards: 3             -> any cards that add up to target, but exactly that many
//   otherwise                 -> any cards that add up to target
// Tap a card in the container to take it back out. Overfilling is funny, not fatal.

window.SCENE_TYPES = window.SCENE_TYPES || {};
window.SCENE_TYPES.fill = {
  mount(scene, stage, api) {
    const inBag = new Set();
    const needMode = scene.choices.some((c) => c.need);
    let taps = 0;
    const tries = [];

    stage.innerHTML =
      `<div class="fill-wrap">
         <div class="fill-table"></div>
         <div class="fill-bag">
           <div class="fill-bag-icon">${scene.container || "🧺"}</div>
           <div class="fill-bag-items"></div>
           <div class="fill-meter"><div class="fill-meter-bar"></div>
             <span class="fill-meter-text"></span></div>
           <div class="fill-count"></div>
         </div>
       </div>`;
    if (scene.clues) stage.prepend(api.paper(scene.clues));
    const table = stage.querySelector(".fill-table");
    const items = stage.querySelector(".fill-bag-items");
    const bar = stage.querySelector(".fill-meter-bar");
    const text = stage.querySelector(".fill-meter-text");
    const countEl = stage.querySelector(".fill-count");
    const cards = [];

    api.shuffle(scene.choices.map((c, i) => i)).forEach((i) => {
      const c = scene.choices[i];
      const b = document.createElement("button");
      b.className = "fill-card";
      b.innerHTML = `<span class="fill-card-icon">${c.icon}</span><span class="fill-card-n">${c.n}</span><span class="fill-card-label">${api.fill(c.label)}</span>`;
      b.addEventListener("click", () => toggle(i));
      table.appendChild(b);
      cards[i] = b;
    });

    function sum() { return [...inBag].reduce((a, i) => a + scene.choices[i].n, 0); }
    function render() {
      const s = sum();
      const pct = Math.min(100, (s / scene.target) * 100);
      bar.style.width = pct + "%";
      bar.classList.toggle("over", s > scene.target);
      text.textContent = scene.showTarget === false ? `${s}` : `${s} of ${scene.target}`;
      countEl.textContent = scene.exactCards ? `${inBag.size} card${inBag.size === 1 ? "" : "s"}` : "";
      items.innerHTML = "";
      for (const i of inBag) {
        const c = scene.choices[i];
        const chip = document.createElement("button");
        chip.className = "fill-chip";
        chip.title = "Take it out";
        chip.innerHTML = `${c.icon}<b>${c.n}</b>`;
        chip.addEventListener("click", () => toggle(i));
        items.appendChild(chip);
      }
      scene.choices.forEach((c, i) => { cards[i].classList.toggle("used", inBag.has(i)); });
    }
    function win() {
      stage.querySelector(".fill-bag").classList.add("right");
      cards.forEach((b) => { b.disabled = true; });
      items.querySelectorAll("button").forEach((b) => { b.disabled = true; });
      api.solved();
    }
    function check() {
      const s = sum();
      const chosen = [...inBag];
      const vars = { total: s, count: chosen.length, over: s - scene.target };
      if (s > scene.target) {
        // Overflow: the last card bounces back out.
        const last = chosen[chosen.length - 1];
        stage.querySelector(".fill-bag").classList.add("burst");
        setTimeout(() => stage.querySelector(".fill-bag").classList.remove("burst"), 600);
        tries.push(`overfilled to ${s}`);
        api.wrong(vars);
        setTimeout(() => { inBag.delete(last); render(); }, 650);
        return;
      }
      if (s !== scene.target) return; // still filling
      if (needMode) {
        const ok = scene.choices.every((c, i) => !!c.need === inBag.has(i));
        tries.push(`reached ${s} with ${chosen.map((i) => scene.choices[i].label).join(", ")}`);
        if (ok) win(); else api.wrong(vars);
        return;
      }
      if (scene.exactCards && chosen.length !== scene.exactCards) {
        tries.push(`made ${s} with ${chosen.length} cards`);
        api.wrong(vars);
        return;
      }
      win();
    }
    function toggle(i) {
      if (cards[i].disabled) return;
      taps++;
      if (inBag.has(i)) inBag.delete(i); else inBag.add(i);
      render();
      check();
    }
    render();

    return {
      state: () => {
        const chosen = [...inBag].map((i) => scene.choices[i].label);
        return `${taps} tap(s); in the ${scene.container || "basket"} now: ${chosen.length ? chosen.join(", ") : "nothing"} (total ${sum()}, ${inBag.size} cards)${tries.length ? `; earlier tries: ${tries.join("; ")}` : ""}`;
      },
      solution: () => needMode
        ? `put in exactly: ${scene.choices.filter((c) => c.need).map((c) => api.fill(c.label)).join(", ")} (total ${scene.target})`
        : `${scene.exactCards ? `exactly ${scene.exactCards} ` : ""}cards that add up to ${scene.target}, e.g. ${firstSubset().map((c) => c.n).join(" + ")}`,
      details: () => `cards on the table: ${scene.choices.map((c) => api.fill(c.label)).join(", ")}${scene.clues ? `; the list on the paper says: "${api.fill(scene.clues)}"` : ""}${scene.showTarget === false ? "" : `; the meter shows the target ${scene.target}`}`,
    };

    function firstSubset() {
      const cs = scene.choices;
      const n = cs.length;
      for (let mask = 1; mask < (1 << n); mask++) {
        const pick = cs.filter((_, i) => mask & (1 << i));
        if (scene.exactCards && pick.length !== scene.exactCards) continue;
        if (pick.reduce((a, c) => a + c.n, 0) === scene.target) return pick;
      }
      return [];
    }
  },
};
