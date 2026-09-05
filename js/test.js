"use strict";
// Sanity harness: checks every level's reference solution wins the level
// and respects the level's own rules. Run with:  node js/test.js

const Robo = require("./interpreter.js");
const { LEVELS, HANDBOOK } = require("./levels.js");
const { WEB_LEVELS, WEB_HANDBOOK } = require("./weblevels.js");

let failures = 0;

function check(cond, msg) {
  if (!cond) {
    failures++;
    console.log("  ❌ " + msg);
  }
}

for (const level of LEVELS) {
  console.log(`${level.id} — ${level.title}`);
  try {
    // Solution must respect the level's own constraints
    if (level.maxLines) {
      const n = Robo.countCodeLines(level.solution);
      check(n <= level.maxLines, `solution uses ${n} lines, maxLines is ${level.maxLines}`);
    }
    for (const kw of level.mustUse || []) {
      check(new RegExp("\\b" + kw + "\\b").test(level.solution), `solution missing required "${kw}"`);
    }

    // Every world (multi-world levels list several — ONE program must beat them all)
    const worlds = level.worlds || [level.world];
    if (level.worlds) {
      const shapes = new Set(worlds.map((w) => JSON.stringify([w.cols, w.rows, w.gems, w.goal, w.target])));
      check(shapes.size === worlds.length, "multi-world variants are identical — hardcoding would still win");
    }
    const program = Robo.parse(level.solution);
    for (let wi = 0; wi < worlds.length; wi++) {
      const w = worlds[wi];
      const tag = worlds.length > 1 ? `world ${wi + 1}: ` : "";

      // Walls/gems/goal/robot must all be inside the grid and not overlapping walls
      const wallSet = new Set((w.walls || []).map(([x, y]) => x + "," + y));
      const inBounds = (x, y) => x >= 0 && y >= 0 && x < w.cols && y < w.rows;
      check(inBounds(w.robot.x, w.robot.y), tag + "robot out of bounds");
      check(w.goal || w.target, tag + "world has neither a goal nor a target picture");
      if (w.goal) {
        check(inBounds(w.goal.x, w.goal.y), tag + "goal out of bounds");
        check(!wallSet.has(w.goal.x + "," + w.goal.y), tag + "goal is inside a wall");
      }
      for (const [x, y] of w.target || []) {
        check(inBounds(x, y), `${tag}target (${x},${y}) out of bounds`);
        check(!wallSet.has(x + "," + y), `${tag}target (${x},${y}) inside a wall`);
      }
      check(!wallSet.has(w.robot.x + "," + w.robot.y), tag + "robot starts inside a wall");
      for (const [x, y] of w.gems || []) {
        check(inBounds(x, y), `${tag}gem (${x},${y}) out of bounds`);
        check(!wallSet.has(x + "," + y), `${tag}gem (${x},${y}) inside a wall`);
      }
      const gemKeys = new Set((w.gems || []).map(([x, y]) => x + "," + y));
      for (const [x, y] of w.deliveries || []) {
        check(inBounds(x, y), `${tag}delivery (${x},${y}) out of bounds`);
        check(!wallSet.has(x + "," + y), `${tag}delivery (${x},${y}) inside a wall`);
        check(!gemKeys.has(x + "," + y), `${tag}delivery (${x},${y}) sits on a gem`);
      }
      for (const [x, y] of w.walls || []) {
        check(inBounds(x, y), `${tag}wall (${x},${y}) out of bounds`);
      }

      // Run the solution on this world
      const result = Robo.run(program, w);
      check(!result.error, `${tag}run error: ${result.error && result.error.message} (line ${result.error && result.error.lineNo})`);
      if (w.goal) {
        check(
          result.final.x === w.goal.x && result.final.y === w.goal.y,
          `${tag}robot ended at (${result.final.x},${result.final.y}), goal is (${w.goal.x},${w.goal.y})`
        );
      }
      if (!level.gemsOptional) {
        check(result.final.gems.length === 0, `${tag}${result.final.gems.length} gems left uncollected`);
      }
      if (level.requirePack != null) {
        check(result.final.pack.length === level.requirePack,
          `${tag}pack holds ${result.final.pack.length} gems, level requires exactly ${level.requirePack}`);
      }
      // Deliveries: every marked square must get a gem of the right color,
      // and no gem may be set down anywhere else.
      const deliveryMap = new Map((w.deliveries || []).map(([x, y, c]) => [x + "," + y, c || null]));
      const placedMap = new Map(result.final.placed);
      for (const [k, c] of deliveryMap) {
        check(placedMap.has(k), `${tag}delivery at (${k}) never got a gem`);
        if (c) check(placedMap.get(k) === c, `${tag}delivery at (${k}) wanted ${c}, got ${placedMap.get(k)}`);
      }
      for (const k of placedMap.keys()) {
        check(deliveryMap.has(k), `${tag}gem set down on non-delivery square (${k})`);
      }
      if (w.target) {
        const want = w.target.map(([x, y, ch]) => x + "," + y + "=" + (ch || "⭐")).sort().join(";");
        const got = [...result.final.dropped].map(([k, ch]) => k + "=" + ch).sort().join(";");
        check(want === got, `${tag}picture mismatch — wanted [${want}] got [${got}]`);
      }
    }
  } catch (e) {
    failures++;
    console.log("  ❌ threw: " + e.message);
  }
}

// A few interpreter behavior checks (friendly errors, suggestions)
function expectError(code, world, contains, label) {
  try {
    const r = Robo.run(Robo.parse(code), world);
    check(r.error && r.error.message.includes(contains), `${label}: got "${r.error && r.error.message}"`);
  } catch (e) {
    check(e.friendly && e.message.includes(contains), `${label}: got "${e.message}"`);
  }
}
console.log("interpreter checks");
const tinyWorld = { cols: 3, rows: 1, robot: { x: 0, y: 0, dir: "E" }, walls: [], gems: [], goal: { x: 2, y: 0 } };
expectError("moove", tinyWorld, 'Did you mean "move"?', "typo suggestion");
expectError("repeat 3\n  move", tinyWorld, "colon", "missing colon");
expectError("while clear ahead:\n  turn left\n  turn right", tinyWorld, "never ends", "infinite loop guard");
expectError("pickup", tinyWorld, "no gem", "pickup on empty");
expectError("move\nmove\nmove", tinyWorld, "Bonk", "wall crash");
check(Robo.run(Robo.parse("set n = 1 + 2\nmove n"), { ...tinyWorld, cols: 4 }).final.x === 3, "math in expressions");
expectError("drop\ndrop", tinyWorld, "already stamped", "double drop");
expectError("drop AB", tinyWorld, "one character", "multi-char drop");
const artWorld = { cols: 4, rows: 3, robot: { x: 0, y: 0, dir: "E" }, walls: [], gems: [], target: [[3, 2]] };
expectError("goto 1 0", tinyWorld, "art studio", "goto outside art levels");
expectError("goto 9 9", artWorld, "off the board", "goto out of bounds");
expectError("goto 2", artWorld, "column first", "goto with one number");
{
  const r = Robo.run(Robo.parse("goto 3 2\ndrop"), artWorld);
  check(!r.error && new Map(r.final.dropped).get("3,2") === "⭐", "goto teleports Robo in art levels");
}
{
  const r = Robo.run(Robo.parse("drop =\nmove\ndrop"), tinyWorld);
  const d = new Map(r.final.dropped);
  check(!r.error && d.get("0,0") === "=" && d.get("1,0") === "⭐", "drop stamps characters (star by default)");
}

// Backpack mechanics
const packWorld = { cols: 6, rows: 1, robot: { x: 0, y: 0, dir: "E" }, walls: [], gems: [[1, 0, "red"], [2, 0]], deliveries: [[4, 0]], goal: { x: 5, y: 0 } };
expectError("dropgem", packWorld, "backpack is empty", "dropgem with empty pack");
expectError("move\npickup\nmove\ndropgem", packWorld, "already a gem", "dropgem onto a wild gem");
expectError("if has purple gem:\n  move", packWorld, "has red gem", "unknown color in check");
{
  const r = Robo.run(Robo.parse("move\npickup\nmove\npickup\nmove 2\ndropgem"), packWorld);
  const placed = new Map(r.final.placed);
  check(!r.error && r.final.pack.join(",") === "red" && placed.get("4,0") === "plain",
    "pack is last-in-first-out (plain gem pops before red)");
}
{
  const r = Robo.run(Robo.parse("move\npickup\nif has 1 gem:\n  if has red gem:\n    move 4"), packWorld);
  check(!r.error && r.final.x === 5, "has-count and has-color checks");
}

// Spellbook demos: every handbook example must run clean in its demo world
console.log("handbook demos");
for (const page of HANDBOOK) {
  check(page.demo, `handbook "${page.name}" has no demo world`);
  if (!page.demo) continue;
  try {
    const r = Robo.run(Robo.parse(page.example), page.demo);
    check(!r.error, `handbook "${page.name}": demo error — ${r.error && r.error.message}`);
    check(r.steps.length > 0, `handbook "${page.name}": demo does nothing to watch`);
  } catch (e) {
    failures++;
    console.log(`  ❌ handbook "${page.name}" threw: ${e.message}`);
  }
}

// Tag Book pages: every page has its parts, and every example's tags close
// properly (the browser renders the real thing — this catches typos early).
console.log("tag book pages");
{
  const VOID = new Set(["img", "br", "hr", "input"]);
  const names = new Set();
  for (const page of WEB_HANDBOOK) {
    check(!names.has(page.name), `tag book duplicate page "${page.name}"`);
    names.add(page.name);
    for (const field of ["name", "syntax", "explain", "example", "exampleNote"]) {
      check(typeof page[field] === "string" && page[field].length > 0, `tag book "${page.name}": missing ${field}`);
    }
    const stack = [];
    const code = page.example.replace(/<!--[\s\S]*?-->/g, "");
    for (const m of code.matchAll(/<(\/?)([a-z0-9]+)[^>]*>/g)) {
      const [, close, tag] = m;
      if (VOID.has(tag)) continue;
      if (!close) stack.push(tag);
      else check(stack.pop() === tag, `tag book "${page.name}": </${tag}> doesn't match its opener`);
    }
    check(stack.length === 0, `tag book "${page.name}": unclosed <${stack[0]}>`);
    check(!!page.scripts === /onclick=/.test(page.example),
      `tag book "${page.name}": scripts flag must match whether the example uses onclick`);
  }
}

// Web Studio levels: structural sanity here (no DOM in node) — the checks
// themselves are verified against a real browser by the studio smoke script.
console.log("web studio levels");
{
  const ids = new Set();
  for (const lv of WEB_LEVELS) {
    check(!ids.has(lv.id), `web level duplicate id ${lv.id}`);
    ids.add(lv.id);
    for (const field of ["title", "intro", "hint", "starter", "solution"]) {
      check(typeof lv[field] === "string" && lv[field].length > 0, `${lv.id}: missing ${field}`);
    }
    check(Array.isArray(lv.checks) && lv.checks.length > 0, `${lv.id}: no checks`);
    for (const c of lv.checks || []) {
      check(typeof c.find === "string" && typeof c.miss === "string" && typeof c.label === "string",
        `${lv.id}: check missing find/miss/label`);
    }
    check(lv.solution !== lv.starter, `${lv.id}: solution is identical to starter`);
  }
}

// Dronacharya: the plain-English report the guru sends to Claude must describe
// what the kid's program actually did — precisely, with no false alarms.
console.log("guru report");
{
  const Guru = require("./guru.js");
  const byId = (id) => LEVELS.find((l) => l.id === id);
  const rep = (id, code) => Guru.reportRobo(byId(id), code);

  check(rep("seq-1", "") === "The program is empty.", "empty program report");
  check(/WON/.test(rep("seq-1", "move\nmove\nmove")) && /WOULD WIN/.test(rep("seq-1", "move\nmove\nmove")), "winning program is reported as a win");
  check(/column 2, row 1 facing E.*flag is at column 3, row 1/.test(rep("seq-1", "move\nmove")), "not-at-goal report gives Robo's spot and the flag");
  check(/crashed at line 5.*Bonk/.test(rep("seq-1", "move\nmove\nmove\nmove\nmove")), "wall crash report names the line");
  check(/Does not parse — line 1.*colon/.test(rep("loop-1", "repeat 9\n  move")), "parse error report names line and message");
  check(/OVER the limit/.test(rep("loop-1", "move\n".repeat(9))), "line-limit report");
  check(/Missing required word\(s\): while/.test(rep("while-1", "repeat 4:\n  move")), "must-use report");
  {
    const r = rep("while-1", "repeat 4:\n  move");
    check(/Hallway 1: WON/.test(r) && /Hallway 2: not solved/.test(r), "multi-world report shows which worlds pass and fail");
  }
  {
    const r = rep("seq-3", "move\nmove\nmove\nmove");
    check(/2 gem\(s\) left/.test(r) && /walked over a gem/.test(r), "gems-left report notices Robo walked over a gem");
  }
  check(/2 picture square\(s\) still unstamped/.test(rep("draw-1", "drop")), "picture report counts unstamped squares");
  for (const lv of LEVELS) {
    check(/WOULD WIN/.test(Guru.reportRobo(lv, lv.solution)), `${lv.id}: guru report calls the reference solution a win`);
    for (const [i, w] of (lv.worlds || [lv.world]).entries()) {
      check(Guru.describeWorld(w, i, lv).length > 20, `${lv.id}: world ${i + 1} description`);
    }
  }
  const web = Guru.reportWeb(WEB_LEVELS[2], WEB_LEVELS[2].starter, [{ label: "A headline", ok: true }, { label: "Two paragraphs", ok: false }]);
  check(/<h1>: 1 opener\(s\) but 0 closer\(s\)/.test(web) && /✗ Two paragraphs/.test(web), "web report spots the unclosed h1 and failing check");
  const ctx = Guru.buildContext({ kind: "robo", level: byId("loop-1"), code: "move", knownCommands: ["move", "turn"], attempts: 2 });
  check(ctx.level.solution === byId("loop-1").solution && !/<[a-z]/.test(ctx.level.intro), "context carries the solution and strips HTML from the intro");
}

console.log(failures === 0 ? "\n✅ All levels and checks passed" : `\n❌ ${failures} failure(s)`);
process.exit(failures === 0 ? 0 : 1);
