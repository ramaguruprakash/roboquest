"use strict";
// Sanity harness: checks every level's reference solution wins the level
// and respects the level's own rules. Run with:  node js/test.js

const Robo = require("./interpreter.js");
const { LEVELS, HANDBOOK } = require("./levels.js");

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
      check(result.final.gems.length === 0, `${tag}${result.final.gems.length} gems left uncollected`);
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

console.log(failures === 0 ? "\n✅ All levels and checks passed" : `\n❌ ${failures} failure(s)`);
process.exit(failures === 0 ? 0 : 1);
