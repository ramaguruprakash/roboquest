"use strict";

// Tens: pay a toll with bags of ten and single pebbles.
//   prices: [{ who: "🦦 otter", n: 23 }, { who: "🦫 beaver", n: 14 }]  paid together
//   limit:  the most things (bags + pebbles) she can carry — forces trading ten singles for a bag
// Tap "bag" or "pebble" to add to the tray; tap a thing in the tray to put it back.
// The tray shows its total live. Pay when ready. Place value, and the first
// two-digit sum, with the tens and ones visible as objects.

window.SCENE_TYPES = window.SCENE_TYPES || {};
window.SCENE_TYPES.tens = {
  mount(scene, stage, api) {
    const target = scene.prices.reduce((a, p) => a + p.n, 0);
    let bags = 0, pebbles = 0;
    const tries = [];
    stage.innerHTML =
      `<div class="tens-wrap">
         <div class="tags">${scene.prices.map((p) => `<div class="tag"><span class="tag-who">${p.who}</span><span class="tag-n">${p.n}</span></div>`).join("")}</div>
         <div class="tray"><div class="tray-items"></div><div class="tray-total"></div><div class="tray-count"></div></div>
         <div class="tens-buttons">
           <button class="tens-add bag">💰<small>bag of 10</small></button>
           <button class="tens-add pebble">🪨<small>1 pebble</small></button>
           <button class="run-btn tens-pay" disabled>Pay!</button>
         </div>
       </div>`;
    const items = stage.querySelector(".tray-items");
    const totalEl = stage.querySelector(".tray-total");
    const countEl = stage.querySelector(".tray-count");
    const pay = stage.querySelector(".tens-pay");
    const total = () => bags * 10 + pebbles;
    const count = () => bags + pebbles;
    function render() {
      items.innerHTML = "";
      for (let i = 0; i < bags; i++) { const b = document.createElement("button"); b.className = "tray-thing bag"; b.textContent = "💰"; b.title = "Put back"; b.addEventListener("click", () => { bags--; render(); }); items.appendChild(b); }
      for (let i = 0; i < pebbles; i++) { const b = document.createElement("button"); b.className = "tray-thing"; b.textContent = "🪨"; b.title = "Put back"; b.addEventListener("click", () => { pebbles--; render(); }); items.appendChild(b); }
      totalEl.textContent = total();
      countEl.textContent = `${count()} thing${count() === 1 ? "" : "s"}${scene.limit ? ` of ${scene.limit}` : ""}`;
      countEl.classList.toggle("over", scene.limit && count() > scene.limit);
      pay.disabled = count() === 0;
    }
    stage.querySelector(".bag").addEventListener("click", () => { bags++; render(); });
    stage.querySelector(".pebble").addEventListener("click", () => { pebbles++; render(); });
    pay.addEventListener("click", () => {
      tries.push(`${bags} bags + ${pebbles} pebbles = ${total()}`);
      if (total() === target && (!scene.limit || count() <= scene.limit)) {
        stage.querySelector(".tray").classList.add("right");
        stage.querySelectorAll("button").forEach((b) => { b.disabled = true; });
        api.solved();
      } else {
        stage.querySelector(".tray").classList.add("shake");
        setTimeout(() => stage.querySelector(".tray").classList.remove("shake"), 500);
        api.wrong({ total: total(), items: count(), bags, pebbles });
      }
    });
    render();
    return {
      state: () => `tray: ${bags} bag(s) of ten and ${pebbles} pebble(s) = ${total()}, ${count()} things${tries.length ? `; payments tried: ${tries.join(" | ")}` : ""}`,
      solution: () => `${target} in total: ${Math.floor(target / 10)} bags and ${target % 10} pebbles (${Math.floor(target / 10) + (target % 10)} things)`,
      details: () => `price tags: ${scene.prices.map((p) => `${p.who} ${p.n}`).join(", ")}; she pays with bags of ten and single pebbles${scene.limit ? `, carrying at most ${scene.limit} things` : ""}`,
    };
  },
};
