"use strict";
// Sanity harness for the quest: every scene's data must be solvable and obey its
// own type's rules, and every area must mix reading and maths.
// Run with:  node rainier/js/test.js

const path = require("path");
const { BELTS, AREAS, SCENES } = require("./story.js");

// The puzzle modules register on window; give them one.
global.window = {};
for (const f of ["signpost", "beam", "fill", "order", "segments", "cards", "boards", "listen", "note"]) require(path.join(__dirname, "scenes", f + ".js"));
const TYPES = global.window.SCENE_TYPES;

let failures = 0;
function check(cond, msg) {
  if (!cond) { failures++; console.log("  ❌ " + msg); }
}

const ALLOWED_VARS = new Set(["hero", "rabbit", "cub", "tapped", "landed", "guess", "total", "over", "position", "cubColor", "word", "standing"]);
function vars(text) {
  return [...String(text || "").matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
}
function subsetSums(nums, target) {
  for (let mask = 1; mask < (1 << nums.length); mask++) {
    let s = 0;
    for (let i = 0; i < nums.length; i++) if (mask & (1 << i)) s += nums[i];
    if (s === target) return true;
  }
  return false;
}

console.log("areas");
const areaIds = new Set();
for (const a of AREAS) {
  check(!areaIds.has(a.id), `duplicate area id ${a.id}`);
  areaIds.add(a.id);
  check(BELTS.includes(a.belt), `${a.id}: unknown belt ${a.belt}`);
  check(a.companion && a.companion.emoji, `${a.id}: needs a companion`);
  check(a.clue && a.title && a.blurb, `${a.id}: needs title, blurb, clue`);
}

console.log("scenes");
const ids = new Set();
for (const s of SCENES) {
  console.log(`  ${s.id} — ${s.title}`);
  check(!ids.has(s.id), `${s.id}: duplicate id`);
  ids.add(s.id);
  check(s.id.startsWith(s.area + "-"), `${s.id}: id should start with its area "${s.area}-"`);
  check(areaIds.has(s.area), `${s.id}: unknown area ${s.area}`);
  check(TYPES[s.type], `${s.id}: no puzzle module for type "${s.type}"`);
  check(Array.isArray(s.skills) && s.skills.length && s.skills.every((k) => k === "reading" || k === "maths"), `${s.id}: skills must be reading and/or maths`);
  check(s.reward > 0, `${s.id}: reward must be positive`);
  for (const f of ["before", "task", "after", "wrong", "hint"]) {
    check(typeof s[f] === "string" && s[f].length > 5, `${s.id}: missing text "${f}"`);
    for (const v of vars(s[f])) check(ALLOWED_VARS.has(v), `${s.id}: unknown placeholder {${v}} in ${f}`);
  }

  switch (s.type) {
    case "signpost": {
      check(s.signs && s.signs.length >= 2, `${s.id}: needs at least 2 signs`);
      check(s.signs.filter((x) => x.correct).length === 1, `${s.id}: exactly one sign must be correct`);
      const texts = s.signs.map((x) => x.text);
      check(new Set(texts).size === texts.length, `${s.id}: signs must differ`);
      break;
    }
    case "beam": {
      check(Array.isArray(s.hops) && s.hops.length, `${s.id}: needs hops`);
      const landing = s.hops.reduce((a, b) => a + b, s.start);
      check(s.start >= 0 && s.start <= s.length, `${s.id}: start off the beam`);
      check(landing >= 0 && landing <= s.length, `${s.id}: lands on ${landing}, beam is 0..${s.length}`);
      let at = s.start;
      for (const h of s.hops) { at += h; check(at >= 0 && at <= s.length, `${s.id}: a hop leaves the beam at ${at}`); }
      check(s.length <= 20, `${s.id}: beam longer than 20 will not fit on screen`);
      break;
    }
    case "fill": {
      check(s.choices && s.choices.length >= 3, `${s.id}: needs at least 3 cards`);
      check(s.choices.every((c) => c.n > 0 && c.icon && c.label), `${s.id}: every card needs n, icon, label`);
      const needed = s.choices.filter((c) => c.need);
      if (needed.length) {
        check(needed.reduce((a, c) => a + c.n, 0) === s.target, `${s.id}: the needed cards must add up to target ${s.target}`);
      } else {
        check(subsetSums(s.choices.map((c) => c.n), s.target), `${s.id}: no cards add up to ${s.target}`);
      }
      check(s.choices.every((c) => c.n <= s.target), `${s.id}: a single card is bigger than the target`);
      break;
    }
    case "order": {
      check(s.cards && s.cards.length >= 3 && s.cards.length <= 6, `${s.id}: 3 to 6 cards`);
      check(s.cards.every((c) => c.icon && c.text), `${s.id}: every card needs icon and text`);
      break;
    }
    case "segments": {
      check(s.total >= 4 && s.total <= 12, `${s.id}: total should be 4..12`);
      check(s.eat > 0 && s.eat < s.total, `${s.id}: eat must be between 1 and total-1`);
      break;
    }
    case "boards": {
      check(s.total >= 4 && s.total <= 16, `${s.id}: total should be 4..16`);
      check(s.chop > 0 && s.chop < s.total, `${s.id}: chop must be between 1 and total-1`);
      break;
    }
    case "listen": {
      check(s.words && s.words.length >= 3 && s.words.length <= 6, `${s.id}: 3 to 6 words`);
      check(s.words.includes(s.answer), `${s.id}: answer "${s.answer}" must be one of the words`);
      check(new Set(s.words).size === s.words.length, `${s.id}: words must differ`);
      break;
    }
    case "note": {
      check(typeof s.note === "string" && s.note.length > 10, `${s.id}: needs a note`);
      check(s.objects && s.objects.length >= 3, `${s.id}: needs at least 3 objects`);
      check(Number.isInteger(s.answer) && s.objects[s.answer], `${s.id}: answer must index an object`);
      const keys = s.objects.map((o) => JSON.stringify([o.icon, o.n, o.label]));
      check(new Set(keys).size === keys.length, `${s.id}: objects must differ`);
      for (const o of s.objects) for (const v of vars(o.label)) check(ALLOWED_VARS.has(v), `${s.id}: unknown placeholder {${v}} in object label`);
      break;
    }
    case "cards": {
      check(s.target > 0 && s.target <= 20, `${s.id}: target 1..20`);
      const tv = s.tokenValue;
      check(tv === undefined || tv > 0 || (Array.isArray(tv) && tv.every((v) => v > 0)), `${s.id}: tokenValue must be positive or a list of positives`);
      break;
    }
    default:
      break;
  }
}

console.log("area mix");
for (const a of AREAS) {
  const list = SCENES.filter((s) => s.area === a.id);
  if (!list.length) { console.log(`  ${a.id}: no scenes yet`); continue; }
  const has = (k) => list.some((s) => s.skills.includes(k));
  check(has("reading"), `${a.id}: needs at least one reading scene`);
  check(has("maths"), `${a.id}: needs at least one maths scene`);
  check(list.some((s) => s.skills.length === 2), `${a.id}: needs at least one scene that needs both reading and maths`);
  const types = new Set(list.map((s) => s.type));
  check(types.size >= 3, `${a.id}: only ${types.size} puzzle type(s) — vary the scenes`);
}

console.log(failures ? `\n❌ ${failures} problem(s)` : "\n✅ Every scene checks out");
process.exit(failures ? 1 : 0);
