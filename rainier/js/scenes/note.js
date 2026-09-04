"use strict";

// Note: read a note, then tap the object it describes.
//   note      the note's text (shown on paper; tap any word to hear it)
//   objects   [{ icon, n?, label? }] things on the ground; `n` shows as a number tag
//   answer    the index of the right object
// The note is NOT read aloud automatically — reading it is the puzzle — but every
// word can be tapped to hear it. Reading plus adding when the note holds a sum.

window.SCENE_TYPES = window.SCENE_TYPES || {};
window.SCENE_TYPES.note = {
  mount(scene, stage, api) {
    const tapped = [];
    stage.innerHTML =
      `<div class="note-wrap">
         <div class="paper"><span class="paper-pin">📌</span><p class="paper-text"></p><small class="paper-tip">Tap a word to hear it</small></div>
         <div class="ground"></div>
       </div>`;
    const text = stage.querySelector(".paper-text");
    for (const w of api.fill(scene.note).split(/(\s+)/)) {
      if (/^\s+$/.test(w)) { text.appendChild(document.createTextNode(" ")); continue; }
      const s = document.createElement("button");
      s.className = "word";
      s.textContent = w;
      s.addEventListener("click", () => api.speak(w.replace(/[^\w']/g, ""), true));
      text.appendChild(s);
    }
    const ground = stage.querySelector(".ground");
    const order = api.shuffle(scene.objects.map((o, i) => i));
    for (const i of order) {
      const o = scene.objects[i];
      const b = document.createElement("button");
      b.className = "thing";
      b.innerHTML = `<span class="thing-icon">${o.icon}</span>${o.n !== undefined ? `<span class="thing-n">${o.n}</span>` : ""}${o.label ? `<span class="thing-label">${api.fill(o.label)}</span>` : ""}`;
      b.addEventListener("click", () => {
        if (b.disabled) return;
        tapped.push(describe(o));
        if (i === scene.answer) {
          b.classList.add("right");
          ground.querySelectorAll("button").forEach((x) => { x.disabled = true; });
          api.solved();
        } else {
          b.classList.add("shake");
          setTimeout(() => b.classList.remove("shake"), 500);
          api.wrong({ tapped: describe(o) });
        }
      });
      ground.appendChild(b);
    }
    function describe(o) { return o.label ? api.fill(o.label) : o.n !== undefined ? `${o.icon} ${o.n}` : o.icon; }
    return {
      state: () => tapped.length ? `things tapped so far: ${tapped.join(", ")}` : "nothing tapped yet",
      solution: () => describe(scene.objects[scene.answer]),
      details: () => `the note says: "${api.fill(scene.note)}"; things on the ground: ${scene.objects.map(describe).join(", ")}`,
    };
  },
};
