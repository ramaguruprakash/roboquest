"use strict";
// Sanity harness: checks every level's reference solution wins the level
// and respects the level's own rules. Run with:  node js/test.js

const Robo = require("./interpreter.js");
const { LEVELS } = require("./levels.js");

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

    // Walls/gems/goal/robot must all be inside the grid and not overlapping walls
    const w = level.world;
    const wallSet = new Set((w.walls || []).map(([x, y]) => x + "," + y));
    const inBounds = (x, y) => x >= 0 && y >= 0 && x < w.cols && y < w.rows;
    check(inBounds(w.robot.x, w.robot.y), "robot out of bounds");
    check(w.goal || w.target, "level has neither a goal nor a target picture");
    if (w.goal) {
      check(inBounds(w.goal.x, w.goal.y), "goal out of bounds");
      check(!wallSet.has(w.goal.x + "," + w.goal.y), "goal is inside a wall");
    }
    for (const [x, y] of w.target || []) {
      check(inBounds(x, y), `target (${x},${y}) out of bounds`);
      check(!wallSet.has(x + "," + y), `target (${x},${y}) inside a wall`);
    }
    check(!wallSet.has(w.robot.x + "," + w.robot.y), "robot starts inside a wall");
    for (const [x, y] of w.gems || []) {
      check(inBounds(x, y), `gem (${x},${y}) out of bounds`);
      check(!wallSet.has(x + "," + y), `gem (${x},${y}) inside a wall`);
    }
    for (const [x, y] of w.walls || []) {
      check(inBounds(x, y), `wall (${x},${y}) out of bounds`);
    }

    // Run the solution
    const program = Robo.parse(level.solution);
    const result = Robo.run(program, w);
    check(!result.error, `run error: ${result.error && result.error.message} (line ${result.error && result.error.lineNo})`);
    if (w.goal) {
      check(
        result.final.x === w.goal.x && result.final.y === w.goal.y,
        `robot ended at (${result.final.x},${result.final.y}), goal is (${w.goal.x},${w.goal.y})`
      );
    }
    check(result.final.gems.length === 0, `${result.final.gems.length} gems left uncollected`);
    if (w.target) {
      const want = w.target.map(([x, y]) => x + "," + y).sort().join(";");
      const got = [...result.final.dropped].sort().join(";");
      check(want === got, `picture mismatch — wanted [${want}] got [${got}]`);
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

console.log(failures === 0 ? "\n✅ All levels and checks passed" : `\n❌ ${failures} failure(s)`);
process.exit(failures === 0 ? 0 : 1);
