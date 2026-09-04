"use strict";

// Logicgrid: seat each friend in the right place from a few clues.
//   people: [{ name, icon }]
//   places: [{ name, icon, color }]   in a row; "next to" means neighbours in this row
//   clues:  the note text (on paper)
//   rules:  [{ who, is: place }, { who, not: place }, { next: [a, b] }] each with `say`
// Tap a friend, then a seat. When everyone is seated the clues are checked; the
// seats that break a clue wobble and the companion says which clue. Assignment
// puzzles are one rung above elimination: every choice constrains the others.

window.SCENE_TYPES = window.SCENE_TYPES || {};
window.SCENE_TYPES.logicgrid = {
  check(scene, seat) { // seat: person name -> place index; returns the first broken rule or null
    const at = (who) => seat[who];
    const idx = (placeName) => scene.places.findIndex((p) => p.name === placeName);
    for (const r of scene.rules) {
      if (r.is !== undefined && at(r.who) !== idx(r.is)) return r;
      if (r.not !== undefined && at(r.who) === idx(r.not)) return r;
      if (r.next && Math.abs(at(r.next[0]) - at(r.next[1])) !== 1) return r;
    }
    return null;
  },
  mount(scene, stage, api) {
    const T = window.SCENE_TYPES.logicgrid;
    const seat = {};
    let selected = null;
    let checks = 0;
    stage.innerHTML = `<div class="lg-wrap"><div class="lg-places"></div><div class="lg-bench"></div><p class="seg-hint">Tap a friend. Then tap a boat.</p></div>`;
    stage.querySelector(".lg-wrap").prepend(api.paper(scene.clues));
    const placesEl = stage.querySelector(".lg-places");
    const bench = stage.querySelector(".lg-bench");
    const placeEls = scene.places.map((p, pi) => {
      const el = document.createElement("button");
      el.className = "lg-place";
      el.style.setProperty("--c", p.color);
      el.innerHTML = `<span class="lg-seat"></span><span class="lg-place-icon">${p.icon}</span><span class="lg-place-name">${api.fill(p.name)}</span>`;
      el.addEventListener("click", () => sit(pi));
      placesEl.appendChild(el);
      return el;
    });
    const personEls = {};
    for (const person of scene.people) {
      const b = document.createElement("button");
      b.className = "lg-person";
      b.innerHTML = `<span class="lg-person-icon">${person.icon}</span><span class="lg-person-name">${api.fill(person.name)}</span>`;
      b.addEventListener("click", () => { selected = person.name; render(); });
      bench.appendChild(b);
      personEls[person.name] = b;
    }
    function render() {
      placeEls.forEach((el, pi) => {
        const who = Object.keys(seat).find((n) => seat[n] === pi);
        el.querySelector(".lg-seat").textContent = who ? scene.people.find((p) => p.name === who).icon : "";
        el.classList.toggle("taken", !!who);
      });
      for (const [name, el] of Object.entries(personEls)) {
        el.classList.toggle("selected", selected === name);
        el.classList.toggle("seated", seat[name] !== undefined);
      }
    }
    function sit(pi) {
      if (selected === null) {
        // Tapping a taken seat with nobody selected picks that person up.
        const who = Object.keys(seat).find((n) => seat[n] === pi);
        if (who) { delete seat[who]; selected = who; render(); }
        return;
      }
      const occupant = Object.keys(seat).find((n) => seat[n] === pi);
      if (occupant) delete seat[occupant];
      seat[selected] = pi;
      selected = null;
      render();
      if (Object.keys(seat).length === scene.people.length) {
        checks++;
        const broken = T.check(scene, seat);
        if (!broken) {
          placeEls.forEach((el) => { el.disabled = true; el.classList.add("right"); });
          Object.values(personEls).forEach((el) => { el.disabled = true; });
          api.solved();
        } else {
          const involved = broken.who ? [broken.who] : broken.next;
          involved.forEach((w) => { const el = placeEls[seat[w]]; el.classList.add("shake"); setTimeout(() => el.classList.remove("shake"), 500); });
          api.wrong({ clue: api.fill(broken.say) });
        }
      }
    }
    render();
    return {
      state: () => `seated: ${Object.entries(seat).map(([n, pi]) => `${n} in the ${api.fill(scene.places[pi].name)}`).join(", ") || "nobody"}; ${checks} full attempt(s)`,
      solution: () => { const s = solve(); return s ? Object.entries(s).map(([n, pi]) => `${n}: ${api.fill(scene.places[pi].name)}`).join(", ") : "?"; },
      details: () => `friends: ${scene.people.map((p) => p.name).join(", ")}; boats in a row: ${scene.places.map((p) => api.fill(p.name)).join(", ")}; the note says: "${api.fill(scene.clues)}"`,
    };
    function solve() {
      const names = scene.people.map((p) => p.name), n = names.length;
      const perms = (arr) => arr.length <= 1 ? [arr] : arr.flatMap((v, i) => perms(arr.filter((_, j) => j !== i)).map((rest) => [v, ...rest]));
      for (const perm of perms([...Array(n).keys()])) {
        const s = {}; names.forEach((nm, i) => { s[nm] = perm[i]; });
        if (!T.check(scene, s)) return s;
      }
      return null;
    }
  },
};
