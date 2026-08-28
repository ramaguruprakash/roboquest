"use strict";

// Level data for RoboQuest. Each level teaches ONE new idea.
// World coordinates: x = column (0 = left), y = row (0 = top).
// Directions: N, E, S, W.
// Win = Robo stands on the flag 🏁 AND every gem 💎 is picked up.

// Arenas are the big quest books; each holds several chapters.
const ARENAS = [
  { n: 1, title: "Arena 1 — Robo's First Quest", blurb: "Learn every spell in the book." },
  { n: 2, title: "Arena 2 — The Puzzle Kingdom", blurb: "No new spells — bigger adventures for the spells you already know!" },
  { n: 3, title: "Arena 3 — Robo's Backpack", blurb: "Magic numbers, and a backpack that remembers every gem — in order!" },
];

// Chapters group levels in the table of contents, matched by level id prefix.
const CHAPTERS = [
  { prefix: "seq",   title: "Instructions",  emoji: "👣", blurb: "Robo does exactly what you say, one line at a time." },
  { prefix: "loop",  title: "Loops",         emoji: "🔁", blurb: "Say it once, do it many times." },
  { prefix: "if",    title: "If / Else",     emoji: "🔍", blurb: "Let Robo check and decide by itself." },
  { prefix: "while", title: "While Loops",   emoji: "🌀", blurb: "Keep going until something changes." },
  { prefix: "fn",    title: "Functions",     emoji: "🎓", blurb: "Teach Robo brand-new words." },
  { prefix: "draw",  title: "Art with Code", emoji: "🎨", blurb: "Programs that draw pictures!" },
  { prefix: "maze",  title: "The Maze Caves",    emoji: "🧭", blurb: "A few tiny lines that can escape ANY cave.", arena: 2 },
  { prefix: "nest",  title: "Loop in a Loop",    emoji: "➿", blurb: "Patterns made of patterns.", arena: 2 },
  { prefix: "golf",  title: "The Shrink Ray",    emoji: "⚡", blurb: "Huge puzzles, teeny-tiny programs.", arena: 2 },
  { prefix: "trick", title: "Tricks & Traps",    emoji: "😈", blurb: "Look before you code — these levels play tricks!", arena: 2 },
  { prefix: "grand", title: "The Grand Dungeons", emoji: "🐉", blurb: "Everything you know, all at once.", arena: 2 },
  { prefix: "var",   title: "Magic Numbers",  emoji: "🔢", blurb: "A box that holds a number — and the number can change!", arena: 3 },
  { prefix: "pack",  title: "The Backpack",   emoji: "🎒", blurb: "Gems line up in your pack, in order. Last in, first out!", arena: 3 },
  { prefix: "color", title: "Rainbow Magic",  emoji: "🌈", blurb: "Colored gems — and a backpack that can answer questions.", arena: 3 },
];

// Handbook pages: every command with a kid-voice explanation and a worked example.
// `cmd` ties the page to the level that introduces it (for unlock-aware display).
// `demo` is a tiny world — the spellbook runs `example` in it with the REAL
// interpreter and animates the steps, so demos can never lie about the language.
const HANDBOOK = [
  {
    name: "move",
    cmd: "move",
    syntax: "move",
    explain:
      "Robo walks 1 square in the direction it's facing. Add a number to walk further: \"move 3\" walks 3 squares. Careful — if a wall is in the way, Robo bonks into it and the program stops!",
    example: "move\nmove 3",
    exampleNote: "Robo walks 1 square, then 3 more. 4 squares in total.",
    demo: { cols: 6, rows: 1, robot: { x: 0, y: 0, dir: "E" } },
  },
  {
    name: "turn",
    cmd: "turn",
    syntax: "turn left · turn right",
    explain:
      "Robo spins in place a quarter turn — it doesn't move to a new square. The little arrow on Robo always shows which way it's facing. Two turns the same way = facing backwards!",
    example: "move\nturn right\nmove",
    exampleNote: "Walk, turn, walk — Robo goes around a corner.",
    demo: { cols: 3, rows: 2, robot: { x: 0, y: 0, dir: "E" } },
  },
  {
    name: "pickup",
    cmd: "pickup",
    syntax: "pickup",
    explain:
      "Grabs the gem 💎 on the square Robo is standing on. If there's no gem there, Robo gets confused and the program stops — so make sure you're on a gem (or check first with \"if gem here:\").",
    example: "move\npickup",
    exampleNote: "Walk onto the gem's square, then grab it.",
    demo: { cols: 3, rows: 1, robot: { x: 0, y: 0, dir: "E" }, gems: [[1, 0]] },
  },
  {
    name: "drop",
    cmd: "drop",
    syntax: "drop · drop A",
    explain:
      "Robo stamps the square it's standing on. Plain \"drop\" stamps a star ⭐. Give it a character to stamp that instead: \"drop A\" stamps an A, \"drop =\" stamps =. Only one stamp fits per square — stamping the same spot twice stops the program. In art levels, match the faded hints exactly (and stamp nowhere else!) to finish the picture.",
    example: "drop\nmove\ndrop A",
    exampleNote: "A star, then the letter A on the next square.",
    demo: { cols: 3, rows: 1, robot: { x: 0, y: 0, dir: "E" } },
  },
  {
    name: "goto",
    cmd: "goto",
    syntax: "goto 4 2",
    explain:
      "The art studio's magic crane! It lifts Robo up and sets it down at column 4, row 2 — count squares from 0, starting at the top-left corner. Columns go left-to-right, rows go top-to-bottom. Perfect for jumping to the next part of your drawing. (No cranes in the caves — in adventure levels Robo has to walk!)",
    example: "drop\ngoto 4 2\ndrop",
    exampleNote: "A star at the start, then the crane carries Robo to column 4, row 2 for the next one.",
    demo: { cols: 6, rows: 3, robot: { x: 0, y: 0, dir: "E" }, target: [[0, 0], [4, 2]] },
  },
  {
    name: "repeat",
    cmd: "repeat",
    syntax: "repeat 4:",
    explain:
      "Does the lines under it 4 times (or any number you pick). The lines that get repeated must be pushed in by 2 spaces — that's how Robo knows which lines belong to the loop. Loops can even go inside other loops!",
    example: "repeat 4:\n  move\n  pickup",
    exampleNote: "Move-and-grab, four times in a row — 2 lines instead of 8!",
    demo: { cols: 5, rows: 1, robot: { x: 0, y: 0, dir: "E" }, gems: [[1, 0], [2, 0], [3, 0], [4, 0]] },
  },
  {
    name: "if / else",
    cmd: "if",
    syntax: "if gem here:",
    explain:
      "Robo checks something, and only does the lines under it if it's true. Add \"else:\" right below for what to do otherwise. This is how Robo makes decisions on its own!",
    example: "repeat 4:\n  if wall ahead:\n    turn right\n  else:\n    move",
    exampleNote: "At a wall Robo turns; otherwise it walks. Four decisions, all made by Robo!",
    demo: { cols: 3, rows: 3, robot: { x: 0, y: 0, dir: "E" } },
  },
  {
    name: "while",
    cmd: "while",
    syntax: "while not wall ahead:",
    explain:
      "Like repeat, but instead of counting, Robo keeps doing the lines as long as the check is true. Perfect when you don't know how many times — \"walk until you hit the wall\" works in any size room!",
    example: "while not wall ahead:\n  move",
    exampleNote: "Robo walks any distance and stops right before the wall.",
    demo: { cols: 6, rows: 1, robot: { x: 0, y: 0, dir: "E" } },
  },
  {
    name: "define",
    cmd: "define",
    syntax: "define dance:",
    explain:
      "Teaches Robo a brand-new word! Put the moves under it (pushed in 2 spaces). Nothing happens yet when Robo learns it — but then you can write the new word on its own line, as many times as you like.",
    example: "define dance:\n  turn left\n  turn right\ndance\ndance",
    exampleNote: "Robo learns \"dance\", then dances twice.",
    demo: { cols: 3, rows: 1, robot: { x: 1, y: 0, dir: "N" } },
  },
  {
    name: "set",
    cmd: "set",
    syntax: "set n = 3",
    explain:
      "Makes a magic number box! \"set n = 3\" puts 3 in a box called n. Now n works anywhere a number goes: \"move n\", \"repeat n:\". The best trick: \"set n = n + 1\" makes the number GROW each time — that's how you make stairs that get bigger, or count things you can't see!",
    example: "set n = 2\nmove n\nset n = n + 1\nmove n",
    exampleNote: "Robo walks 2 squares… then n grows to 3, and Robo walks 3 more!",
    demo: { cols: 6, rows: 1, robot: { x: 0, y: 0, dir: "E" } },
  },
  {
    name: "dropgem",
    cmd: "dropgem",
    syntax: "dropgem",
    explain:
      "Takes the LAST gem out of Robo's backpack 🎒 and sets it on the square Robo is standing on. The backpack is a stack: the last gem you picked up is the first one that comes out! Drop gems on the marked squares (a hungry penguin, an altar…) — an empty backpack, or a square that already has a gem, stops the program.",
    example: "move\npickup\nmove 2\ndropgem",
    exampleNote: "Grab a gem, carry it 2 squares, and set it down where it's needed.",
    demo: { cols: 5, rows: 1, robot: { x: 0, y: 0, dir: "E" }, gems: [[1, 0]], deliveries: [[3, 0]] },
  },
  {
    name: "backpack checks",
    cmd: "dropgem",
    syntax: "has 3 gems · has red gem",
    explain:
      "Robo can peek inside its own backpack! \"has 3 gems\" is true when the pack holds exactly 3. \"has red gem\" is true when a red one is in there (works for red, blue, green and yellow). Put them after \"if\" or \"while\" — and \"not\" flips them, like every check.",
    example: "move\npickup\nif has red gem:\n  move 2",
    exampleNote: "Robo grabs a red gem, checks its pack — and marches on!",
    demo: { cols: 5, rows: 1, robot: { x: 0, y: 0, dir: "E" }, gems: [[1, 0, "red"]] },
  },
  {
    name: "Robo's checks",
    cmd: "if",
    syntax: "gem here · wall ahead · clear ahead · at goal",
    explain:
      "These go after \"if\" and \"while\". Robo can check: is there a gem on my square? Is there a wall (or the edge of the world) right in front of me? Is the way ahead clear? Am I standing on the flag? Put \"not\" in front of any check to flip it.",
    example: "while not at goal:\n  if clear ahead:\n    move\n  else:\n    turn left",
    exampleNote: "Keep going toward the flag, turning whenever the way is blocked.",
    demo: { cols: 3, rows: 2, robot: { x: 0, y: 0, dir: "E" }, walls: [[2, 0]], goal: { x: 2, y: 1 } },
  },
];

const COMMAND_DOCS = {
  move:   { syntax: "move",                  desc: "Walk 1 square forward. \"move 3\" walks 3 squares." },
  turn:   { syntax: "turn left · turn right", desc: "Turn to face a new direction." },
  pickup: { syntax: "pickup",                desc: "Pick up the gem 💎 on Robo's square." },
  drop:   { syntax: "drop · drop A",         desc: "Stamp Robo's square: a star ⭐, or any character — \"drop A\" stamps an A. One per square!" },
  goto:   { syntax: "goto 4 2",              desc: "The studio crane lifts Robo to column 4, row 2 — count from 0, top-left! Art levels only." },
  dropgem: { syntax: "dropgem",              desc: "Take the LAST gem out of the backpack 🎒 and set it on Robo's square." },
  set:    { syntax: "set n = 3",             desc: "Make a number box called n. Use it anywhere a number goes — \"set n = n + 1\" makes it grow!" },
  repeat: { syntax: "repeat 4:",             desc: "Do the indented lines under it 4 times." },
  if:     { syntax: "if gem here:",          desc: "Only do the lines under it when it's true. Add \"else:\" for otherwise." },
  while:  { syntax: "while not wall ahead:", desc: "Keep doing the lines under it as long as it's true." },
  define: { syntax: "define dance:",         desc: "Teach Robo a new word! Later, write \"dance\" on its own line to do it." },
};

const CHECKS_NOTE =
  "Things Robo can check: <b>gem here</b> · <b>wall ahead</b> · <b>clear ahead</b> · <b>at goal</b>. Put <b>not</b> in front to flip it.";

const PACK_CHECKS_NOTE =
  "Backpack checks: <b>has 3 gems</b> (exactly that many) · <b>has red gem</b> (red, blue, green or yellow).";

// Helper for drawing levels: a horizontal run of cells from x1 to x2 on row y.
// Optional ch: the character to stamp there (default: a star).
function hrow(x1, x2, y, ch) {
  const cells = [];
  for (let x = x1; x <= x2; x++) cells.push(ch ? [x, y, ch] : [x, y]);
  return cells;
}

// Helper for maze levels: a straight run of cells from (x1,y1) to (x2,y2)
// (horizontal or vertical, either direction).
function seg(x1, y1, x2, y2) {
  const cells = [];
  const dx = Math.sign(x2 - x1), dy = Math.sign(y2 - y1);
  let x = x1, y = y1;
  cells.push([x, y]);
  while (x !== x2 || y !== y2) {
    x += dx;
    y += dy;
    cells.push([x, y]);
  }
  return cells;
}

// Helper for maze levels: walls everywhere EXCEPT the open corridor cells —
// carving a cave out of solid rock.
function caveWalls(cols, rows, open) {
  const openSet = new Set(open.map(([x, y]) => x + "," + y));
  const walls = [];
  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      if (!openSet.has(x + "," + y)) walls.push([x, y]);
    }
  }
  return walls;
}

// Helper for drawing levels: all border cells of a cols × rows grid.
function perimeter(cols, rows) {
  const cells = [];
  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      if (x === 0 || y === 0 || x === cols - 1 || y === rows - 1) cells.push([x, y]);
    }
  }
  return cells;
}

const LEVELS = [
  // ---------- SEQUENCING ----------
  {
    id: "seq-1",
    title: "First Steps",
    concept: "Instructions",
    conceptEmoji: "👣",
    newCommands: ["move"],
    intro:
      "Meet <b>Robo</b> 🤖! Robo only does exactly what your program says, one line at a time. " +
      "Write <b>move</b> on its own line to make Robo walk one square forward. " +
      "Get Robo to the flag 🏁!",
    hint: "Robo is 3 squares away from the flag. How many times should you write \"move\"?",
    world: {
      cols: 5, rows: 3,
      robot: { x: 0, y: 1, dir: "E" },
      walls: [], gems: [],
      goal: { x: 3, y: 1 },
    },
    solution: "move\nmove\nmove",
  },
  {
    id: "seq-2",
    title: "Turn the Corner",
    concept: "Instructions",
    conceptEmoji: "👣",
    newCommands: ["turn"],
    intro:
      "Robo can't walk sideways — it has to <b>turn</b> first! " +
      "Use <b>turn right</b> or <b>turn left</b> to change the way Robo is facing. " +
      "The little arrow on Robo shows which way it's looking.",
    hint: "Walk to the corner first, then turn right, then keep walking.",
    world: {
      cols: 4, rows: 3,
      robot: { x: 0, y: 0, dir: "E" },
      walls: [], gems: [],
      goal: { x: 3, y: 2 },
    },
    solution: "move\nmove\nmove\nturn right\nmove\nmove",
  },
  {
    id: "seq-3",
    title: "Treasure Trail",
    concept: "Instructions",
    conceptEmoji: "👣",
    newCommands: ["pickup"],
    intro:
      "Gems! 💎 Robo must pick up <b>every</b> gem before reaching the flag. " +
      "Walk onto a gem's square, then write <b>pickup</b> to grab it.",
    hint: "move onto the first gem, pickup, keep going to the next gem, pickup, then walk to the flag.",
    world: {
      cols: 6, rows: 3,
      robot: { x: 0, y: 1, dir: "E" },
      walls: [],
      gems: [[1, 1], [3, 1]],
      goal: { x: 4, y: 1 },
    },
    solution: "move\npickup\nmove\nmove\npickup\nmove",
  },

  // ---------- LOOPS ----------
  {
    id: "loop-1",
    title: "The Long Road",
    concept: "Loops",
    conceptEmoji: "🔁",
    newCommands: ["repeat"],
    intro:
      "That flag is 9 squares away. You <b>could</b> write it the hard way…" +
      "<div class='code-compare'>" +
      "<div class='code-col bad'><span class='code-label'>😫 the hard way</span>" +
      "<code>move<br>move<br>move<br>move<br>move<br>move<br>move<br>move<br>move</code></div>" +
      "<div class='code-col good'><span class='code-label'>😎 the loop way</span>" +
      "<code>repeat 9:<br>&nbsp;&nbsp;move</code></div>" +
      "</div>" +
      "Both do exactly the same thing — but the loop is 2 lines instead of 9! " +
      "The lines you push in with <b>2 spaces</b> are the ones that get repeated. " +
      "Now imagine the flag was <b>100</b> squares away… 😅",
    hint: "You only need 2 lines: a \"repeat 9:\" line, and a \"move\" line pushed in with 2 spaces.",
    world: {
      cols: 10, rows: 3,
      robot: { x: 0, y: 1, dir: "E" },
      walls: [], gems: [],
      goal: { x: 9, y: 1 },
    },
    maxLines: 2,
    solution: "repeat 9:\n  move",
  },
  {
    id: "loop-2",
    title: "The Staircase",
    concept: "Loops",
    conceptEmoji: "🔁",
    newCommands: [],
    intro:
      "Loops can repeat <b>more than one line</b>. Every line pushed in under <b>repeat</b> " +
      "happens each time around. This staircase repeats the same little climb 3 times — " +
      "figure out the pattern for ONE stair, then loop it!",
    hint: "One stair is: move, turn left, move, turn right. Put those 4 lines inside a repeat 3:",
    world: {
      cols: 5, rows: 4,
      robot: { x: 0, y: 3, dir: "E" },
      walls: [
        [2, 3], [3, 3], [4, 3], [3, 2], [4, 2], [4, 1],
        [0, 2], [0, 1], [1, 1], [0, 0], [1, 0], [2, 0], [4, 0],
      ],
      gems: [],
      goal: { x: 3, y: 0 },
    },
    maxLines: 6,
    solution: "repeat 3:\n  move\n  turn left\n  move\n  turn right",
  },
  {
    id: "loop-3",
    title: "Gem Gobbler",
    concept: "Loops",
    conceptEmoji: "🔁",
    newCommands: [],
    intro:
      "A whole row of gems! Each step is the same: walk forward, grab the gem. " +
      "When you spot a pattern that happens over and over — that's a loop waiting to happen.",
    hint: "Each time around the loop: move, then pickup. How many gems are there?",
    world: {
      cols: 8, rows: 3,
      robot: { x: 0, y: 1, dir: "E" },
      walls: [],
      gems: [[1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1]],
      goal: { x: 6, y: 1 },
    },
    maxLines: 4,
    solution: "repeat 6:\n  move\n  pickup",
  },

  // ---------- LOOPS: SIDE QUESTS (optional practice) ----------
  {
    id: "loop-p1",
    title: "The Mirror Cave",
    concept: "Side quest",
    conceptEmoji: "🌟",
    practice: true,
    newCommands: [],
    intro:
      "Robo wandered into the <b>Mirror Cave</b>, where everything is flipped! 🪞 " +
      "A staircase again — but this one goes down the <i>other</i> way. " +
      "Can your loop turn <b>left</b> where it used to turn right?",
    hint: "Just like the staircase — but flipped: repeat 4: move, turn left, move, turn right.",
    world: {
      cols: 5, rows: 5,
      robot: { x: 4, y: 0, dir: "W" },
      walls: [], gems: [],
      goal: { x: 0, y: 4 },
    },
    maxLines: 6,
    mustUse: ["repeat"],
    solution: "repeat 4:\n  move\n  turn left\n  move\n  turn right",
  },
  {
    id: "loop-p2",
    title: "The Sneaky Squirrel",
    concept: "Side quest",
    conceptEmoji: "🌟",
    practice: true,
    newCommands: [],
    intro:
      "A sneaky squirrel 🐿️ buried a gem every <b>3 squares</b> down the path — " +
      "and scampered off! Only 3 lines allowed, so make every line count. " +
      "Psst: <code>move 3</code> is one line…",
    hint: "One trip = walk 3, dig up a gem. Four gems, four trips: repeat 4: move 3, pickup.",
    world: {
      cols: 13, rows: 3,
      robot: { x: 0, y: 1, dir: "E" },
      walls: [],
      gems: [[3, 1], [6, 1], [9, 1], [12, 1]],
      goal: { x: 12, y: 1 },
    },
    maxLines: 3,
    mustUse: ["repeat"],
    solution: "repeat 4:\n  move 3\n  pickup",
  },
  {
    id: "loop-p3",
    title: "Apple Picking",
    concept: "Side quest",
    conceptEmoji: "🌟",
    practice: true,
    newCommands: [],
    intro:
      "Harvest day! 🍎 Three tall trees, one shiny apple at the top of each. " +
      "For every tree it's the same dance: climb up, grab the apple, climb back down, " +
      "walk to the next tree. One loop can pick the whole orchard!",
    hint:
      "Each time around: move 3 (climb), pickup, turn right twice (face down), move 3, " +
      "then turn left, move 2, turn left to face the next tree.",
    world: {
      cols: 7, rows: 4,
      robot: { x: 0, y: 3, dir: "N" },
      walls: [],
      gems: [[0, 0], [2, 0], [4, 0]],
      goal: { x: 6, y: 3 },
    },
    maxLines: 9,
    mustUse: ["repeat"],
    solution:
      "repeat 3:\n  move 3\n  pickup\n  turn right\n  turn right\n  move 3\n  turn left\n  move 2\n  turn left",
  },

  // ---------- IF / ELSE ----------
  {
    id: "if-1",
    title: "Gem Detective",
    concept: "If",
    conceptEmoji: "🔍",
    newCommands: ["if"],
    intro:
      "Some squares have gems, some don't — and <b>pickup</b> on an empty square makes Robo grumpy! " +
      "With <b>if</b>, Robo checks first:<br><code>if gem here:<br>&nbsp;&nbsp;pickup</code><br>" +
      "The pickup only happens when there really is a gem. " + CHECKS_NOTE,
    hint: "Loop 6 times. Each time: move, then \"if gem here:\" with pickup indented under it.",
    world: {
      cols: 8, rows: 3,
      robot: { x: 0, y: 1, dir: "E" },
      walls: [],
      gems: [[2, 1], [4, 1], [5, 1]],
      goal: { x: 6, y: 1 },
    },
    maxLines: 5,
    mustUse: ["if"],
    solution: "repeat 6:\n  move\n  if gem here:\n    pickup",
  },
  {
    id: "if-2",
    title: "Around the Island",
    concept: "If / Else",
    conceptEmoji: "🔍",
    newCommands: [],
    intro:
      "<b>else:</b> means \"otherwise\". Robo can make a decision every single step:<br>" +
      "<code>if wall ahead:<br>&nbsp;&nbsp;turn right<br>else:<br>&nbsp;&nbsp;move</code><br>" +
      "One tiny rule, repeated — and Robo finds its own way around the island!",
    hint: "repeat 12 times: if wall ahead, turn right — else, move. Robo bounces around the edge all by itself!",
    world: {
      cols: 5, rows: 4,
      robot: { x: 0, y: 0, dir: "E" },
      walls: [[1, 1], [2, 1], [3, 1], [1, 2], [2, 2], [3, 2]],
      gems: [],
      goal: { x: 1, y: 3 },
    },
    maxLines: 6,
    mustUse: ["if", "else"],
    solution: "repeat 12:\n  if wall ahead:\n    turn right\n  else:\n    move",
  },

  // ---------- WHILE ----------
  {
    id: "while-1",
    title: "How Far Is Far?",
    concept: "While loops",
    conceptEmoji: "🌀",
    newCommands: ["while"],
    worldLabel: "Hallway",
    intro:
      "Robo must cross <b>three hallways</b> — and they're all different lengths! " +
      "Click the tabs above the board to peek. 👀 " +
      "Write <b>ONE</b> program that works in every hallway — counting squares won't save you this time. " +
      "New power: <b>while</b> keeps going as long as something is true:<br>" +
      "<code>while not wall ahead:<br>&nbsp;&nbsp;move</code><br>" +
      "Robo walks and walks and stops right before the wall — no counting needed!",
    hint: "Just 2 lines: while not wall ahead: … move. The same 2 lines cross ANY hallway.",
    worlds: [
      { cols: 5,  rows: 3, robot: { x: 0, y: 1, dir: "E" }, walls: [], gems: [], goal: { x: 4,  y: 1 } },
      { cols: 9,  rows: 3, robot: { x: 0, y: 1, dir: "E" }, walls: [], gems: [], goal: { x: 8,  y: 1 } },
      { cols: 12, rows: 3, robot: { x: 0, y: 1, dir: "E" }, walls: [], gems: [], goal: { x: 11, y: 1 } },
    ],
    maxLines: 2,
    mustUse: ["while"],
    solution: "while not wall ahead:\n  move",
  },
  {
    id: "while-2",
    title: "The Gem Cave",
    concept: "While loops",
    conceptEmoji: "🌀",
    newCommands: [],
    worldLabel: "Cave",
    intro:
      "Two caves this time — different lengths, gems hiding in different spots. " +
      "One program must clear them <b>both</b>! Put your powers together: a <b>while</b> loop " +
      "to walk the cave, and an <b>if</b> inside it to grab gems only where they sparkle. ✨",
    hint: "while not wall ahead: move, then \"if gem here:\" pickup — the if goes INSIDE the while.",
    worlds: [
      {
        cols: 8, rows: 3,
        robot: { x: 0, y: 1, dir: "E" },
        walls: [],
        gems: [[2, 1], [6, 1]],
        goal: { x: 7, y: 1 },
      },
      {
        cols: 11, rows: 3,
        robot: { x: 0, y: 1, dir: "E" },
        walls: [],
        gems: [[1, 1], [4, 1], [8, 1]],
        goal: { x: 10, y: 1 },
      },
    ],
    maxLines: 4,
    mustUse: ["while", "if"],
    solution: "while not wall ahead:\n  move\n  if gem here:\n    pickup",
  },

  // ---------- FUNCTIONS ----------
  {
    id: "fn-1",
    title: "Teach Robo a Trick",
    concept: "Functions",
    conceptEmoji: "🎓",
    newCommands: ["define"],
    intro:
      "You can teach Robo <b>new words</b>! " +
      "<code>define side:</code> with lines under it makes a brand-new command called <b>side</b>. " +
      "Write <b>side</b> anywhere and Robo does the whole trick. " +
      "Walk the square, grab the corner gems, and come back home!",
    hint: "define side: (repeat 3: move, then pickup). Then do: repeat 3: side + turn right. Then repeat 3: move to get home.",
    world: {
      cols: 4, rows: 4,
      robot: { x: 0, y: 0, dir: "E" },
      walls: [],
      gems: [[3, 0], [3, 3], [0, 3]],
      goal: { x: 0, y: 0 },
    },
    maxLines: 10,
    mustUse: ["define"],
    solution:
      "define side:\n  repeat 3:\n    move\n  pickup\nrepeat 3:\n  side\n  turn right\nrepeat 3:\n  move",
  },
  {
    id: "fn-2",
    title: "The Grand Cave",
    concept: "Everything!",
    conceptEmoji: "🏆",
    newCommands: [],
    worldLabel: "Cave",
    intro:
      "The final challenge! Two whole cave systems, each with two long tunnels and gems everywhere — " +
      "and the tunnels are all different lengths. Teach Robo one smart trick with <b>define</b>, " +
      "then use it for both tunnels — and win in <b>both caves</b> with one program. " +
      "Use everything you've learned — you've got this! 💪",
    hint: "define walk: (while not wall ahead: move + if gem here: pickup). Then: walk, turn right, walk.",
    worlds: [
      {
        cols: 7, rows: 6,
        robot: { x: 0, y: 0, dir: "E" },
        walls: [],
        gems: [[2, 0], [5, 0], [6, 2], [6, 4]],
        goal: { x: 6, y: 5 },
      },
      {
        cols: 9, rows: 4,
        robot: { x: 0, y: 0, dir: "E" },
        walls: [],
        gems: [[3, 0], [7, 0], [8, 2]],
        goal: { x: 8, y: 3 },
      },
    ],
    maxLines: 8,
    mustUse: ["define", "while"],
    solution:
      "define walk:\n  while not wall ahead:\n    move\n    if gem here:\n      pickup\nwalk\nturn right\nwalk",
  },

  // ---------- ART WITH CODE ----------
  {
    id: "draw-1",
    title: "Star Stamp",
    concept: "Drawing",
    conceptEmoji: "🎨",
    newCommands: ["drop"],
    intro:
      "New power: <b>drop</b> puts a star ⭐ on Robo's square! " +
      "Art levels work differently: there's no flag. The dotted squares show the picture — " +
      "fill <b>every</b> dotted square with a star (and none anywhere else!) to win. " +
      "Start simple: a line of 3 stars.",
    hint: "Drop a star where you stand, walk one square, drop again… drop, move, drop, move, drop.",
    world: {
      cols: 5, rows: 3,
      robot: { x: 1, y: 1, dir: "E" },
      walls: [], gems: [],
      target: [[1, 1], [2, 1], [3, 1]],
    },
    solution: "drop\nmove\ndrop\nmove\ndrop",
  },
  {
    id: "draw-2",
    title: "The Long Line",
    concept: "Drawing",
    conceptEmoji: "🎨",
    newCommands: [],
    intro:
      "An 8-star line — way too long to stamp by hand! " +
      "Spot the pattern: <b>drop</b>, then <b>move</b>, over and over. That's a loop!",
    hint: "repeat 8: with drop and move inside. Drop FIRST, then move — or Robo walks past the first square!",
    world: {
      cols: 10, rows: 3,
      robot: { x: 0, y: 1, dir: "E" },
      walls: [], gems: [],
      target: [[0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1]],
    },
    maxLines: 3,
    solution: "repeat 8:\n  drop\n  move",
  },
  {
    id: "draw-3",
    title: "Dotted Line",
    concept: "Drawing",
    conceptEmoji: "🎨",
    newCommands: [],
    intro:
      "A dotted line: star, gap, star, gap… ✨ " +
      "The pattern repeats every <b>two</b> squares now. What goes inside the loop this time?",
    hint: "Each time around: drop, move, move (two moves = skip a square). Five stars means repeat 5.",
    world: {
      cols: 11, rows: 3,
      robot: { x: 0, y: 1, dir: "E" },
      walls: [], gems: [],
      target: [[0, 1], [2, 1], [4, 1], [6, 1], [8, 1]],
    },
    maxLines: 4,
    solution: "repeat 5:\n  drop\n  move\n  move",
  },
  {
    id: "draw-4",
    title: "The Square",
    concept: "Drawing",
    conceptEmoji: "🎨",
    newCommands: [],
    intro:
      "Draw the whole square outline! Here's the trick: a square is one side drawn <b>4 times</b> " +
      "with a turn after each. And one side is drop + move done 4 times. " +
      "A loop <b>inside</b> a loop — you're ready for it. 🤯",
    hint: "repeat 4: → inside it, repeat 4: (drop, move) → then turn right. The corners work themselves out!",
    world: {
      cols: 5, rows: 5,
      robot: { x: 0, y: 0, dir: "E" },
      walls: [], gems: [],
      target: perimeter(5, 5),
    },
    maxLines: 6,
    mustUse: ["repeat"],
    solution: "repeat 4:\n  repeat 4:\n    drop\n    move\n  turn right",
  },
  {
    id: "draw-5",
    title: "The Grand Frame",
    concept: "Drawing",
    conceptEmoji: "🎨",
    newCommands: [],
    worldLabel: "Board",
    intro:
      "Frame <b>two boards</b> — a small one and a big one — with the <b>same program</b>! " +
      "Teach Robo to draw one edge with <b>while</b> (keep stamping until the wall), " +
      "then use your new word 4 times. Watch your code frame a board of ANY size. 🖼️<br><br>" +
      "Fun fact: this is exactly how a real <b>web page</b> starts — with its outer frame. " +
      "In the final level, you design the whole page!",
    hint: "define edge: (while not wall ahead: drop + move). Then repeat 4: edge + turn right.",
    worlds: [
      {
        cols: 5, rows: 4,
        robot: { x: 0, y: 0, dir: "E" },
        walls: [], gems: [],
        target: perimeter(5, 4),
      },
      {
        cols: 8, rows: 6,
        robot: { x: 0, y: 0, dir: "E" },
        walls: [], gems: [],
        target: perimeter(8, 6),
      },
    ],
    maxLines: 7,
    mustUse: ["define", "while"],
    solution: "define edge:\n  while not wall ahead:\n    drop\n    move\nrepeat 4:\n  edge\n  turn right",
  },
  {
    id: "draw-6",
    title: "The Magic Crane",
    concept: "Coordinates",
    conceptEmoji: "🏗️",
    newCommands: ["goto"],
    intro:
      "The art studio has a <b>magic crane</b>! <code>goto 6 0</code> lifts Robo and sets it down " +
      "at <b>column 6, row 0</b> — count squares from <b>0</b>, starting at the top-left corner. " +
      "Columns go left-to-right ➡️, rows go top-to-bottom ⬇️. " +
      "No more long walks between drawings! Stamp a star on all <b>four corners</b> of the board.",
    hint:
      "Robo already starts on the first corner — drop! Then: goto 6 0, drop, goto 6 4, drop, goto 0 4, drop. " +
      "Column first, then row — and remember, counting starts at 0!",
    world: {
      cols: 7, rows: 5,
      robot: { x: 0, y: 0, dir: "E" },
      walls: [], gems: [],
      target: [[0, 0], [6, 0], [6, 4], [0, 4]],
    },
    maxLines: 8,
    mustUse: ["goto"],
    solution: "drop\ngoto 6 0\ndrop\ngoto 6 4\ndrop\ngoto 0 4\ndrop",
  },
  {
    id: "draw-7",
    title: "Polka Dots",
    concept: "Coordinates",
    conceptEmoji: "🏗️",
    newCommands: [],
    intro:
      "A wallpaper of polka dots — three dotted rows, and the middle one is <b>shifted over</b>! " +
      "Here's the pro move: teach Robo to draw ONE dotted row with <b>define</b>, " +
      "then use the <b>crane</b> to jump to the start of each row. " +
      "Draw once, stamp everywhere. That's how real patterns are made!",
    hint:
      "define dotrow: (repeat 2: drop, move, move — then one last drop). " +
      "Robo starts at the first row, so: dotrow, goto 1 2, dotrow, goto 0 4, dotrow.",
    world: {
      cols: 7, rows: 5,
      robot: { x: 0, y: 0, dir: "E" },
      walls: [], gems: [],
      target: [
        [0, 0], [2, 0], [4, 0],
        [1, 2], [3, 2], [5, 2],
        [0, 4], [2, 4], [4, 4],
      ],
    },
    maxLines: 12,
    mustUse: ["define", "goto"],
    solution:
      "define dotrow:\n" +
      "  repeat 2:\n" +
      "    drop\n" +
      "    move\n" +
      "    move\n" +
      "  drop\n" +
      "dotrow\n" +
      "goto 1 2\n" +
      "dotrow\n" +
      "goto 0 4\n" +
      "dotrow",
  },
  {
    id: "draw-8",
    title: "The Web Page",
    concept: "Drawing",
    conceptEmoji: "🎨",
    newCommands: [],
    intro:
      "The final masterpiece: design a <b>web page</b>! Real web designers start exactly like this — " +
      "a sketch called a <i>wireframe</i>. One last trick: <b>drop</b> can stamp any character — " +
      "<code>drop =</code> stamps a <b>=</b>, <code>drop [</code> stamps a <b>[</b>. " +
      "Your page needs a <b>header</b>, a <b>menu</b>, a <b>line of text</b> — and <b>two buttons</b> " +
      "that look exactly the same. Draw a button twice? Never! Teach Robo <i>once</i>, " +
      "then let the crane carry it between them. " +
      "You're not just solving a puzzle anymore — you're building. 🧑‍💻",
    hint:
      "Teach Robo \"button\": drop [, move, drop +, move, drop ]. Each bar is a loop of (drop =, move) " +
      "plus one last drop =. Use goto 0 2, goto 0 4, goto 0 6 to jump between the bars — " +
      "and finish with: button, goto 6 6, button.",
    world: {
      cols: 9, rows: 7,
      robot: { x: 0, y: 0, dir: "E" },
      walls: [], gems: [],
      target: [
        ...hrow(0, 8, 0, "="), // header bar
        ...hrow(0, 4, 2, "="), // menu
        ...hrow(0, 6, 4, "="), // a line of text
        [0, 6, "["], [1, 6, "+"], [2, 6, "]"], // left button
        [6, 6, "["], [7, 6, "+"], [8, 6, "]"], // right button
      ],
    },
    maxLines: 26,
    mustUse: ["define", "goto"],
    solution:
      "define button:\n" +
      "  drop [\n" +
      "  move\n" +
      "  drop +\n" +
      "  move\n" +
      "  drop ]\n" +
      "repeat 8:\n" +
      "  drop =\n" +
      "  move\n" +
      "drop =\n" +
      "goto 0 2\n" +
      "repeat 4:\n" +
      "  drop =\n" +
      "  move\n" +
      "drop =\n" +
      "goto 0 4\n" +
      "repeat 6:\n" +
      "  drop =\n" +
      "  move\n" +
      "drop =\n" +
      "goto 0 6\n" +
      "button\n" +
      "goto 6 6\n" +
      "button",
  },

  // ═══════════════ ARENA 2: THE PUZZLE KINGDOM ═══════════════
  // No new commands anywhere in this arena — every level is a bigger,
  // trickier adventure for the spells the kid already knows.

  // ---------- THE MAZE CAVES ----------
  {
    id: "maze-1",
    title: "The Spiral Cave",
    concept: "Maze magic",
    conceptEmoji: "🧭",
    newCommands: [],
    intro:
      "🏟️ Welcome to <b>ARENA 2</b>! No new spells here — you already know them ALL. " +
      "These puzzles are bigger, twistier, and way more fun.<br><br>" +
      "First up: a real <b>maze</b>! Here's the explorer's secret — you don't need to know the way. " +
      "Give Robo one tiny rule: <i>if you can walk, walk; if you're blocked, turn.</i> " +
      "Then sit back and watch Robo find the way <b>all by itself</b>. 🤯",
    hint:
      "Five tiny lines: while not at goal: → if clear ahead: → move → else: → turn right. " +
      "That's it. Trust the rule!",
    world: {
      cols: 9, rows: 7,
      robot: { x: 0, y: 0, dir: "E" },
      walls: caveWalls(9, 7, [
        ...seg(0, 0, 8, 0), ...seg(8, 1, 8, 6), ...seg(7, 6, 2, 6),
        ...seg(2, 5, 2, 2), ...seg(3, 2, 6, 2), ...seg(6, 3, 6, 4),
      ]),
      gems: [],
      goal: { x: 6, y: 4 },
    },
    maxLines: 5,
    mustUse: ["while", "if"],
    solution: "while not at goal:\n  if clear ahead:\n    move\n  else:\n    turn right",
  },
  {
    id: "maze-2",
    title: "The Shifting Caves",
    concept: "Maze magic",
    conceptEmoji: "🧭",
    newCommands: [],
    worldLabel: "Cave",
    intro:
      "Uh oh — this cave keeps <b>changing shape</b>! Two caves, different twists, " +
      "gems sparkling in different spots. Your maze rule from last time still works — " +
      "one program cracks them <b>both</b>. Just teach it to grab gems along the way. 💎",
    hint:
      "Same rule as The Spiral Cave, plus a gem check FIRST inside the while: " +
      "if gem here: pickup. Then: if clear ahead: move, else: turn right.",
    worlds: [
      {
        cols: 7, rows: 5,
        robot: { x: 0, y: 0, dir: "E" },
        walls: caveWalls(7, 5, [
          ...seg(0, 0, 6, 0), ...seg(6, 1, 6, 4), ...seg(5, 4, 1, 4),
          ...seg(1, 3, 1, 2), ...seg(2, 2, 4, 2),
        ]),
        gems: [[3, 0], [6, 3], [2, 4]],
        goal: { x: 4, y: 2 },
      },
      {
        cols: 9, rows: 6,
        robot: { x: 0, y: 0, dir: "E" },
        walls: caveWalls(9, 6, [
          ...seg(0, 0, 8, 0), ...seg(8, 1, 8, 5), ...seg(7, 5, 1, 5),
          ...seg(1, 4, 1, 2), ...seg(2, 2, 5, 2),
        ]),
        gems: [[5, 0], [8, 2], [4, 5], [1, 3]],
        goal: { x: 5, y: 2 },
      },
    ],
    maxLines: 7,
    mustUse: ["while", "if"],
    solution:
      "while not at goal:\n  if gem here:\n    pickup\n  if clear ahead:\n    move\n  else:\n    turn right",
  },
  {
    id: "maze-3",
    title: "The Mirror Maze",
    concept: "Maze magic",
    conceptEmoji: "🧭",
    newCommands: [],
    worldLabel: "Mirror",
    intro:
      "A maze from the Mirror Realm 🪞 — every corridor bends the <b>other</b> way! " +
      "If Robo keeps turning right, it just bonks in circles. " +
      "You understand the rule now… so which one tiny word do you change?",
    hint: "It's your maze rule — but at a dead end, Robo should turn LEFT.",
    worlds: [
      {
        cols: 7, rows: 5,
        robot: { x: 6, y: 0, dir: "W" },
        walls: caveWalls(7, 5, [
          ...seg(6, 0, 0, 0), ...seg(0, 1, 0, 4), ...seg(1, 4, 5, 4),
          ...seg(5, 3, 5, 2),
        ]),
        gems: [[2, 0], [0, 2], [3, 4]],
        goal: { x: 5, y: 2 },
      },
      {
        cols: 9, rows: 6,
        robot: { x: 8, y: 0, dir: "W" },
        walls: caveWalls(9, 6, [
          ...seg(8, 0, 0, 0), ...seg(0, 1, 0, 5), ...seg(1, 5, 7, 5),
          ...seg(7, 4, 7, 2),
        ]),
        gems: [[4, 0], [0, 3], [6, 5], [7, 4]],
        goal: { x: 7, y: 2 },
      },
    ],
    maxLines: 7,
    mustUse: ["while", "if"],
    solution:
      "while not at goal:\n  if gem here:\n    pickup\n  if clear ahead:\n    move\n  else:\n    turn left",
  },

  // ---------- MAZE SIDE QUEST ----------
  {
    id: "maze-p1",
    title: "The Whirlpool",
    concept: "Side quest",
    conceptEmoji: "🌟",
    practice: true,
    newCommands: [],
    intro:
      "The biggest maze in the kingdom — a giant whirlpool of stone! 🌀 " +
      "It looks impossible… but you know a rule that eats mazes like this for breakfast. " +
      "Tiny program, ENORMOUS maze. Enjoy the show. 🍿",
    hint: "The Mirror Maze rule — this whirlpool swirls to the left too. Grab gems as you spiral!",
    world: {
      cols: 11, rows: 9,
      robot: { x: 10, y: 0, dir: "W" },
      walls: caveWalls(11, 9, [
        ...seg(10, 0, 0, 0), ...seg(0, 1, 0, 8), ...seg(1, 8, 10, 8),
        ...seg(10, 7, 10, 2), ...seg(9, 2, 2, 2), ...seg(2, 3, 2, 6),
        ...seg(3, 6, 8, 6), ...seg(8, 5, 8, 4),
      ]),
      gems: [[5, 0], [0, 4], [6, 8], [10, 3], [4, 2]],
      goal: { x: 8, y: 4 },
    },
    maxLines: 7,
    mustUse: ["while"],
    solution:
      "while not at goal:\n  if gem here:\n    pickup\n  if clear ahead:\n    move\n  else:\n    turn left",
  },

  // ---------- LOOP IN A LOOP ----------
  {
    id: "nest-1",
    title: "The Royal Rounds",
    concept: "Loop in a loop",
    conceptEmoji: "➿",
    newCommands: [],
    worldLabel: "Round",
    intro:
      "The King needs a guard! 💂 March all the way around the castle walls and collect " +
      "every gem the dragons dropped — they land in different spots every night, so check every square. " +
      "Here's the big idea: a loop <b>inside</b> a loop. The outside loop does the 4 sides, " +
      "the inside loop does the 7 steps of one side.",
    hint:
      "repeat 4: → repeat 7: (move, then if gem here: pickup) → then turn right. " +
      "Robo marches a full square and ends right where it started!",
    worlds: [
      {
        cols: 8, rows: 8,
        robot: { x: 0, y: 0, dir: "E" },
        walls: [
          [2, 2], [3, 2], [4, 2], [5, 2],
          [2, 3], [3, 3], [4, 3], [5, 3],
          [2, 4], [3, 4], [4, 4], [5, 4],
          [2, 5], [3, 5], [4, 5], [5, 5],
        ],
        gems: [[3, 0], [7, 4], [5, 7], [0, 3]],
        goal: { x: 0, y: 0 },
      },
      {
        cols: 8, rows: 8,
        robot: { x: 0, y: 0, dir: "E" },
        walls: [
          [2, 2], [3, 2], [4, 2], [5, 2],
          [2, 3], [3, 3], [4, 3], [5, 3],
          [2, 4], [3, 4], [4, 4], [5, 4],
          [2, 5], [3, 5], [4, 5], [5, 5],
        ],
        gems: [[5, 0], [7, 1], [7, 6], [2, 7], [0, 5], [0, 1]],
        goal: { x: 0, y: 0 },
      },
    ],
    maxLines: 6,
    mustUse: ["repeat", "if"],
    solution:
      "repeat 4:\n  repeat 7:\n    move\n    if gem here:\n      pickup\n  turn right",
  },
  {
    id: "nest-2",
    title: "Mow the Lawn",
    concept: "Loop in a loop",
    conceptEmoji: "➿",
    newCommands: [],
    intro:
      "The royal lawn grew <b>gem-grass</b> overnight — 20 gems! 🌱💎 " +
      "Mow it like a real lawnmower: all the way across, step down, and come back the other way. " +
      "Going right and coming back left are different… but <i>two rows together</i> make one pattern " +
      "that repeats. Find that two-row pattern and loop it!",
    hint:
      "One time around the big loop mows TWO rows: repeat 4: (pickup, move), pickup, turn right, " +
      "move, turn right, repeat 4: (pickup, move), pickup, turn left, move, turn left. " +
      "Wrap all of that in repeat 2:",
    world: {
      cols: 5, rows: 5,
      robot: { x: 0, y: 0, dir: "E" },
      walls: [],
      gems: [...hrow(0, 4, 0), ...hrow(0, 4, 1), ...hrow(0, 4, 2), ...hrow(0, 4, 3)],
      goal: { x: 0, y: 4 },
    },
    maxLines: 16,
    mustUse: ["repeat"],
    solution:
      "repeat 2:\n" +
      "  repeat 4:\n    pickup\n    move\n" +
      "  pickup\n  turn right\n  move\n  turn right\n" +
      "  repeat 4:\n    pickup\n    move\n" +
      "  pickup\n  turn left\n  move\n  turn left",
  },
  {
    id: "nest-3",
    title: "Stairway to the Sky",
    concept: "Loop in a loop",
    conceptEmoji: "➿",
    newCommands: [],
    intro:
      "Remember the little staircase? ☁️ Meet its GIANT cousin! " +
      "Each stair is <b>3 squares long</b> with a gem on every step. " +
      "One stair = a little loop (move and grab, 3 times, then climb up). " +
      "The whole stairway = a loop of stairs. A loop <b>inside</b> a loop — you know this dance!",
    hint:
      "repeat 4: → inside it: repeat 3: (move, pickup) → then turn left, move, turn right. " +
      "Seven lines to climb to the sky.",
    world: {
      cols: 13, rows: 7,
      robot: { x: 0, y: 5, dir: "E" },
      walls: [
        [0, 6], [1, 6], [2, 6], [3, 6],
        [4, 5], [5, 5], [6, 5], [4, 6], [5, 6], [6, 6],
        [7, 4], [8, 4], [9, 4], [7, 5], [8, 5], [9, 5], [7, 6], [8, 6], [9, 6],
        [10, 3], [11, 3], [12, 3], [10, 4], [11, 4], [12, 4],
        [10, 5], [11, 5], [12, 5], [10, 6], [11, 6], [12, 6],
      ],
      gems: [
        [1, 5], [2, 5], [3, 5],
        [4, 4], [5, 4], [6, 4],
        [7, 3], [8, 3], [9, 3],
        [10, 2], [11, 2], [12, 2],
      ],
      goal: { x: 12, y: 1 },
    },
    maxLines: 7,
    mustUse: ["repeat"],
    solution:
      "repeat 4:\n  repeat 3:\n    move\n    pickup\n  turn left\n  move\n  turn right",
  },

  // ---------- LOOP-IN-A-LOOP SIDE QUEST ----------
  {
    id: "nest-p1",
    title: "The Checkerboard",
    concept: "Side quest",
    conceptEmoji: "🌟",
    practice: true,
    newCommands: [],
    intro:
      "The castle needs a new floor — a fancy <b>checkerboard</b>! ⬜⬛ " +
      "Long rows and short rows take turns, and the short rows are shifted over by one. " +
      "Teach Robo a word for each kind of row, then let the crane hop between them. " +
      "(Psst: <code>move 2</code> skips a square in one line.)",
    hint:
      "define row: drop, then repeat 3: (move 2, drop). define shortrow: drop, then repeat 2: (move 2, drop). " +
      "Then: row, goto 1 1, shortrow, goto 0 2, row, goto 1 3, shortrow, goto 0 4, row.",
    world: {
      cols: 7, rows: 5,
      robot: { x: 0, y: 0, dir: "E" },
      walls: [], gems: [],
      target: [
        [0, 0], [2, 0], [4, 0], [6, 0],
        [1, 1], [3, 1], [5, 1],
        [0, 2], [2, 2], [4, 2], [6, 2],
        [1, 3], [3, 3], [5, 3],
        [0, 4], [2, 4], [4, 4], [6, 4],
      ],
    },
    maxLines: 20,
    mustUse: ["define", "goto"],
    solution:
      "define row:\n  drop\n  repeat 3:\n    move 2\n    drop\n" +
      "define shortrow:\n  drop\n  repeat 2:\n    move 2\n    drop\n" +
      "row\ngoto 1 1\nshortrow\ngoto 0 2\nrow\ngoto 1 3\nshortrow\ngoto 0 4\nrow",
  },

  // ---------- THE SHRINK RAY (code golf) ----------
  {
    id: "golf-1",
    title: "One-Line Wonder",
    concept: "Code golf",
    conceptEmoji: "⚡",
    newCommands: [],
    intro:
      "⚡ ZAP! The Shrink Ray hit your editor — only <b>ONE line</b> fits now! " +
      "The flag is 12 whole squares away. One line?! Impossible!<br><br>" +
      "…unless a single line can walk further than one square. 🤫 " +
      "(The spellbook's <b>move</b> page knows the secret.)",
    hint: "\"move\" can take a number: move 12 walks 12 squares. That's the whole program!",
    world: {
      cols: 13, rows: 3,
      robot: { x: 0, y: 1, dir: "E" },
      walls: [], gems: [],
      goal: { x: 12, y: 1 },
    },
    maxLines: 1,
    solution: "move 12",
  },
  {
    id: "golf-2",
    title: "The Gem Skipper",
    concept: "Code golf",
    conceptEmoji: "⚡",
    newCommands: [],
    intro:
      "The Shrink Ray strikes again — <b>3 lines</b> this time! " +
      "A gem every 4 squares, all the way down the road. " +
      "Put your two shrink-powers together: a loop, and a <b>move</b> that jumps far. 💨",
    hint: "Each trip is the same: move 4, then pickup. Three gems, so: repeat 3: (move 4, pickup).",
    world: {
      cols: 13, rows: 3,
      robot: { x: 0, y: 1, dir: "E" },
      walls: [],
      gems: [[4, 1], [8, 1], [12, 1]],
      goal: { x: 12, y: 1 },
    },
    maxLines: 3,
    mustUse: ["repeat"],
    solution: "repeat 3:\n  move 4\n  pickup",
  },
  {
    id: "golf-3",
    title: "The Four Corners",
    concept: "Code golf",
    conceptEmoji: "⚡",
    newCommands: [],
    intro:
      "The final Shrink Ray challenge: tour the WHOLE kingdom — a gem in every corner — " +
      "in just <b>4 lines</b>. 👑 One gem is even hiding under Robo's feet right now… " +
      "don't panic! If your loop goes all the way around, it comes home and grabs it last. 😉",
    hint: "One side of the kingdom = move 6, pickup, turn right. Do that 4 times with a repeat.",
    world: {
      cols: 7, rows: 7,
      robot: { x: 0, y: 0, dir: "E" },
      walls: [[2, 2], [3, 2], [4, 2], [2, 3], [3, 3], [4, 3], [2, 4], [3, 4], [4, 4]],
      gems: [[6, 0], [6, 6], [0, 6], [0, 0]],
      goal: { x: 0, y: 0 },
    },
    maxLines: 4,
    mustUse: ["repeat"],
    solution: "repeat 4:\n  move 6\n  pickup\n  turn right",
  },

  // ---------- TRICKS & TRAPS ----------
  {
    id: "trick-1",
    title: "The Gem Beneath You",
    concept: "Tricks",
    conceptEmoji: "😈",
    newCommands: [],
    intro:
      "A nice easy gem trail — you've done a hundred of these! Right?… <i>Right?</i> 🤔 " +
      "Robo says something feels extra sparkly today. " +
      "Count the gems <b>carefully</b> before you write a single line.",
    hint: "Look at the square Robo STARTS on. Pick that gem up before you take a single step!",
    world: {
      cols: 8, rows: 3,
      robot: { x: 0, y: 1, dir: "E" },
      walls: [],
      gems: [[0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1]],
      goal: { x: 6, y: 1 },
    },
    maxLines: 6,
    failMsg: {
      gems: "Huh? I still hear sparkling somewhere… 💎 Look VERY closely at the square where I started. 🤭",
    },
    solution: "pickup\nrepeat 5:\n  move\n  pickup\nmove",
  },
  {
    id: "trick-2",
    title: "The Backwards Flag",
    concept: "Tricks",
    conceptEmoji: "😈",
    newCommands: [],
    intro:
      "Robo marched proudly into the arena… and the flag is <b>BEHIND</b> it. 😱 " +
      "Along with all the gems. Whoops. " +
      "Robo can't walk backwards — but two turns the same way spin it right around!",
    hint: "turn right, turn right — now Robo faces the flag. Then: repeat 6: (move, pickup), and finish with move 2.",
    world: {
      cols: 9, rows: 3,
      robot: { x: 8, y: 1, dir: "E" },
      walls: [],
      gems: [[2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1]],
      goal: { x: 0, y: 1 },
    },
    maxLines: 6,
    solution: "turn right\nturn right\nrepeat 6:\n  move\n  pickup\nmove 2",
  },
  {
    id: "trick-3",
    title: "The Liar's Road",
    concept: "Tricks",
    conceptEmoji: "😈",
    newCommands: [],
    intro:
      "Trust me: it's just a straight road to the flag. Easiest level in the arena. " +
      "Definitely no surprises at all whatsoever. 😇<br><br>" +
      "<small>(A programmer's most important trick: don't trust the description — read the <b>board</b>.)</small>",
    hint:
      "…okay FINE, there's a wall in the middle of the road. 🙄 And a gem hiding behind it! " +
      "Hop around: move 5, turn left, move, turn right, move 2, turn right, move, pickup, turn left, move 4.",
    world: {
      cols: 12, rows: 3,
      robot: { x: 0, y: 1, dir: "E" },
      walls: [[6, 1]],
      gems: [[7, 1]],
      goal: { x: 11, y: 1 },
    },
    maxLines: 10,
    solution:
      "move 5\nturn left\nmove\nturn right\nmove 2\nturn right\nmove\npickup\nturn left\nmove 4",
  },

  // ---------- TRICKS SIDE QUEST ----------
  {
    id: "trick-p1",
    title: "Robo's Day Off",
    concept: "Side quest",
    conceptEmoji: "🌟",
    practice: true,
    newCommands: [],
    intro:
      "Robo is SO tired after all those dungeons. 🥱 And look — it's already standing on the flag! " +
      "Win this level <b>without walking a single square</b>. " +
      "One line. Shortest level in the kingdom. Don't overthink it. 😴",
    hint: "You just need ONE instruction that doesn't move Robo off its square. A little spin, maybe?",
    world: {
      cols: 5, rows: 3,
      robot: { x: 2, y: 1, dir: "E" },
      walls: [], gems: [],
      goal: { x: 2, y: 1 },
    },
    maxLines: 1,
    failMsg: {
      goal: "I WAS standing on the flag when we started… why did I walk away? 🥱 Try an instruction that stays put.",
    },
    solution: "turn left",
  },

  // ---------- THE GRAND DUNGEONS ----------
  {
    id: "grand-1",
    title: "The Mountain Range",
    concept: "Grand quest",
    conceptEmoji: "🐉",
    newCommands: [],
    intro:
      "Two mountains, a gem on each peak. 🏔️💎 Here's the master-coder move: " +
      "teach Robo <b>up</b> (one step up the slope) and <b>down</b> (one step down) — " +
      "then teach it <b>mountain</b> <i>using those words inside it</i>! " +
      "Words built out of words… that's how every real program in the world is made. " +
      "Then just write: mountain, mountain. ⛰️⛰️",
    hint:
      "define up: (move, turn left, move, turn right). define down: (move, turn right, move, turn left). " +
      "define mountain: (repeat 3: up, then pickup, then repeat 3: down). Then call mountain twice!",
    world: {
      cols: 13, rows: 7,
      robot: { x: 0, y: 6, dir: "E" },
      walls: [
        [2, 6], [3, 6], [4, 6], [5, 6], [3, 5], [4, 5],
        [8, 6], [9, 6], [10, 6], [11, 6], [9, 5], [10, 5],
      ],
      gems: [[3, 3], [9, 3]],
      goal: { x: 12, y: 6 },
    },
    maxLines: 20,
    mustUse: ["define"],
    solution:
      "define up:\n  move\n  turn left\n  move\n  turn right\n" +
      "define down:\n  move\n  turn right\n  move\n  turn left\n" +
      "define mountain:\n  repeat 3:\n    up\n  pickup\n  repeat 3:\n    down\n" +
      "mountain\nmountain",
  },
  {
    id: "grand-2",
    title: "The Castle Builder",
    concept: "Grand quest",
    conceptEmoji: "🐉",
    newCommands: [],
    intro:
      "Design the kingdom's new castle! 🏰 Two tall towers with pointy roofs (<code>A</code> on top, " +
      "<code>H</code> bricks below), a strong wall of <code>=</code> between them, and a little gate: " +
      "<code>[n]</code>. Build a tower <b>once</b> with define, then let the crane carry Robo " +
      "to build the second one. You're the royal architect now. 📐",
    hint:
      "Robo starts at the top-left facing DOWN. define tower: drop A, then repeat 4: (move, drop H). " +
      "Then: tower, goto 8 0, tower, goto 1 4, turn left — and stamp the wall: = = [ n ] = =.",
    world: {
      cols: 9, rows: 5,
      robot: { x: 0, y: 0, dir: "S" },
      walls: [], gems: [],
      target: [
        [0, 0, "A"], [0, 1, "H"], [0, 2, "H"], [0, 3, "H"], [0, 4, "H"],
        [8, 0, "A"], [8, 1, "H"], [8, 2, "H"], [8, 3, "H"], [8, 4, "H"],
        [1, 4, "="], [2, 4, "="], [3, 4, "["], [4, 4, "n"], [5, 4, "]"], [6, 4, "="], [7, 4, "="],
      ],
    },
    maxLines: 25,
    mustUse: ["define", "goto"],
    solution:
      "define tower:\n  drop A\n  repeat 4:\n    move\n    drop H\n" +
      "tower\ngoto 8 0\ntower\ngoto 1 4\nturn left\n" +
      "drop =\nmove\ndrop =\nmove\ndrop [\nmove\ndrop n\nmove\ndrop ]\nmove\ndrop =\nmove\ndrop =",
  },
  {
    id: "grand-3",
    title: "The Three Dungeons",
    concept: "BOSS",
    conceptEmoji: "🐉",
    newCommands: [],
    worldLabel: "Dungeon",
    intro:
      "👾 <b>THE BOSS.</b> Three dungeons Robo has never seen — twisting corridors, " +
      "treasure rooms, dead ends. ONE program must conquer them all.<br><br>" +
      "Real explorers know the trick: put your <b>right hand on the wall</b> and never let go — " +
      "you'll walk the whole dungeon and find everything. For Robo that means: every step, " +
      "first try turning right; if that's blocked, spin left until the way is clear; then move. " +
      "Grab every gem. Reach every flag. Become a legend. 🐉",
    hint:
      "while not at goal: → if gem here: pickup → then: turn right → while wall ahead: turn left → move. " +
      "Watch Robo hug the right-hand wall through every twist!",
    worlds: [
      {
        cols: 7, rows: 5,
        robot: { x: 0, y: 2, dir: "E" },
        walls: caveWalls(7, 5, [
          ...seg(0, 2, 6, 2), ...seg(2, 1, 2, 0), ...seg(4, 3, 4, 4),
        ]),
        gems: [[3, 2], [4, 4], [6, 2]],
        goal: { x: 2, y: 0 },
      },
      {
        cols: 6, rows: 5,
        robot: { x: 0, y: 0, dir: "E" },
        walls: caveWalls(6, 5, [
          ...seg(0, 0, 4, 0), [2, 1], ...seg(4, 1, 4, 3), ...seg(3, 3, 0, 3),
        ]),
        gems: [[2, 1], [4, 2], [2, 3]],
        goal: { x: 0, y: 3 },
      },
      {
        cols: 8, rows: 6,
        robot: { x: 0, y: 0, dir: "E" },
        walls: caveWalls(8, 6, [
          ...seg(0, 0, 7, 0), ...seg(7, 1, 7, 4), ...seg(6, 4, 1, 4), [3, 3],
        ]),
        gems: [[5, 0], [7, 2], [6, 4], [3, 3]],
        goal: { x: 1, y: 4 },
      },
    ],
    maxLines: 8,
    mustUse: ["while"],
    solution:
      "while not at goal:\n  if gem here:\n    pickup\n  turn right\n  while wall ahead:\n    turn left\n  move",
  },

  // ═══════════════ ARENA 3: ROBO'S BACKPACK ═══════════════
  // Variables (set) and the backpack — an ordered list the kid can SEE.
  // New spells: set, dropgem, and the checks "has 3 gems" / "has red gem".

  // ---------- MAGIC NUMBERS ----------
  {
    id: "var-1",
    title: "The Growing Staircase",
    concept: "Magic numbers",
    conceptEmoji: "🔢",
    newCommands: ["set"],
    showPack: true,
    intro:
      "🏟️ Welcome to <b>ARENA 3</b>! New magic: a <b>number box</b>. " +
      "<code>set n = 1</code> puts 1 in a box called n — and <code>move n</code> walks that many squares. " +
      "The superpower: <code>set n = n + 1</code> makes the number <b>grow</b>!<br><br>" +
      "These stairs get longer as they climb: 1, then 2, then 3, then 4. " +
      "No fixed number can walk them all… but a growing one can. 🤯",
    hint:
      "set n = 1, then repeat 4: (move n, turn left, move, turn right, set n = n + 1). " +
      "Each time around, n grows — and so does the stair!",
    world: {
      cols: 11, rows: 7,
      robot: { x: 0, y: 6, dir: "E" },
      walls: [
        [2, 6], [3, 6], [4, 5], [4, 6], [5, 5], [5, 6], [6, 5], [6, 6],
        [7, 4], [7, 5], [7, 6], [8, 4], [8, 5], [8, 6], [9, 4], [9, 5], [9, 6],
        [10, 4], [10, 5], [10, 6],
      ],
      gems: [],
      goal: { x: 10, y: 2 },
    },
    maxLines: 7,
    mustUse: ["set"],
    solution:
      "set n = 1\nrepeat 4:\n  move n\n  turn left\n  move\n  turn right\n  set n = n + 1",
  },
  {
    id: "var-2",
    title: "The Spiral",
    concept: "Magic numbers",
    conceptEmoji: "🔢",
    newCommands: [],
    showPack: true,
    intro:
      "The most magical drawing in the book: a <b>spiral</b>! 🌀 " +
      "Each arm of the spiral is one star longer than the last: 1, 2, 3, 4, 5. " +
      "A loop draws one arm and turns — a growing number makes each arm longer. " +
      "Five lines of stars from a number that won't sit still!",
    hint:
      "set n = 1, then repeat 5: (repeat n: drop + move, then turn right, then set n = n + 1). " +
      "A loop INSIDE a loop, with a growing number. You've got all three powers!",
    world: {
      cols: 7, rows: 7,
      robot: { x: 3, y: 3, dir: "N" },
      walls: [], gems: [],
      target: [
        [3, 3],
        [3, 2], [4, 2],
        [5, 2], [5, 3], [5, 4],
        [5, 5], [4, 5], [3, 5], [2, 5],
        [1, 5], [1, 4], [1, 3], [1, 2], [1, 1],
      ],
    },
    maxLines: 7,
    mustUse: ["set", "repeat"],
    solution:
      "set n = 1\nrepeat 5:\n  repeat n:\n    drop\n    move\n  turn right\n  set n = n + 1",
  },
  {
    id: "var-3",
    title: "The Gem-Powered Rocket",
    concept: "Magic numbers",
    conceptEmoji: "🔢",
    newCommands: [],
    showPack: true,
    worldLabel: "Launchpad",
    intro:
      "Robo's rocket runs on gems — <b>1 gem = 1 square of flying</b>! 🚀 " +
      "But each launchpad has a different number of gems lying around… " +
      "Count them as you collect: start a box at 0, and <code>set fuel = fuel + 1</code> " +
      "for every gem. At the wall, turn left and fly up exactly <code>fuel</code> squares!",
    hint:
      "set fuel = 0, then while not wall ahead: (move, if gem here: pickup + set fuel = fuel + 1). " +
      "Then: turn left, move fuel. The counting does the thinking!",
    worlds: [
      {
        cols: 8, rows: 6,
        robot: { x: 0, y: 5, dir: "E" },
        walls: [],
        gems: [[2, 5], [4, 5], [6, 5]],
        goal: { x: 7, y: 2 },
      },
      {
        cols: 8, rows: 6,
        robot: { x: 0, y: 5, dir: "E" },
        walls: [],
        gems: [[1, 5], [2, 5], [4, 5], [5, 5], [6, 5]],
        goal: { x: 7, y: 0 },
      },
    ],
    maxLines: 8,
    mustUse: ["set", "while"],
    solution:
      "set fuel = 0\nwhile not wall ahead:\n  move\n  if gem here:\n    pickup\n    set fuel = fuel + 1\nturn left\nmove fuel",
  },

  // ---------- MAGIC NUMBERS SIDE QUEST ----------
  {
    id: "var-p1",
    title: "The Ski Slope",
    concept: "Side quest",
    conceptEmoji: "🌟",
    practice: true,
    newCommands: [],
    showPack: true,
    intro:
      "Wheee! ⛷️ This slope is the Growing Staircase's downhill cousin — " +
      "each run gets SHORTER: 4, then 3, then 2, then 1. " +
      "Numbers can shrink too, you know…",
    hint: "Just like the staircase, but: set n = 4 to start, and set n = n - 1 to shrink. Turn right and drop down after each run.",
    world: {
      cols: 11, rows: 5,
      robot: { x: 0, y: 0, dir: "E" },
      walls: [], gems: [],
      goal: { x: 10, y: 4 },
    },
    maxLines: 7,
    mustUse: ["set"],
    solution:
      "set n = 4\nrepeat 4:\n  move n\n  turn right\n  move\n  turn left\n  set n = n - 1",
  },

  // ---------- THE BACKPACK ----------
  {
    id: "pack-1",
    title: "The Backpack",
    concept: "The backpack",
    conceptEmoji: "🎒",
    newCommands: [],
    showPack: true,
    intro:
      "Robo got a <b>BACKPACK</b>! 🎒 From now on, gems don't vanish when you grab them — " +
      "they line up under the board, <b>in the order you picked them up</b>. " +
      "Grab the red, yellow and blue gems and watch your pack fill up. " +
      "Remember the order… it's going to matter. 😏",
    hint: "move onto each gem and pickup — watch the backpack under the board as you go. Then walk to the flag.",
    world: {
      cols: 7, rows: 3,
      robot: { x: 0, y: 1, dir: "E" },
      walls: [],
      gems: [[1, 1, "red"], [3, 1, "yellow"], [5, 1, "blue"]],
      goal: { x: 6, y: 1 },
    },
    maxLines: 5,
    solution: "repeat 3:\n  move\n  pickup\n  move",
  },
  {
    id: "pack-2",
    title: "Hungry Penguins",
    concept: "The backpack",
    conceptEmoji: "🎒",
    newCommands: ["dropgem"],
    showPack: true,
    deliverEmoji: "🐧",
    intro:
      "Three very hungry penguins! 🐧🐧🐧 New spell: <b>dropgem</b> takes the <b>last</b> gem " +
      "out of your backpack and sets it down on Robo's square. " +
      "Fill your pack with the gems, then feed every penguin on the way to the flag!",
    hint: "Grab all 3 gems first (repeat 3: move, pickup). Then each penguin is 2 squares apart: repeat 3: (move 2, dropgem). One more move to the flag!",
    world: {
      cols: 11, rows: 3,
      robot: { x: 0, y: 1, dir: "E" },
      walls: [],
      gems: [[1, 1], [2, 1], [3, 1]],
      deliveries: [[5, 1], [7, 1], [9, 1]],
      goal: { x: 10, y: 1 },
    },
    maxLines: 7,
    mustUse: ["dropgem"],
    solution: "repeat 3:\n  move\n  pickup\nrepeat 3:\n  move 2\n  dropgem\nmove",
  },
  {
    id: "pack-3",
    title: "Penguin Party",
    concept: "The backpack",
    conceptEmoji: "🎒",
    newCommands: [],
    showPack: true,
    deliverEmoji: "🐧",
    intro:
      "A whole penguin party — and the fish market is right next door! 🐧🎉 " +
      "Gem, penguin, gem, penguin… in and out of the backpack it goes. " +
      "Spot the rhythm, and one little loop feeds everyone.",
    hint: "The rhythm is: move, pickup, move, dropgem — four penguins, so repeat 4. Then one last move to the flag.",
    world: {
      cols: 10, rows: 3,
      robot: { x: 0, y: 1, dir: "E" },
      walls: [],
      gems: [[1, 1], [3, 1], [5, 1], [7, 1]],
      deliveries: [[2, 1], [4, 1], [6, 1], [8, 1]],
      goal: { x: 9, y: 1 },
    },
    maxLines: 6,
    mustUse: ["repeat", "dropgem"],
    solution: "repeat 4:\n  move\n  pickup\n  move\n  dropgem\nmove",
  },
  {
    id: "pack-4",
    title: "Exactly Three",
    concept: "The backpack",
    conceptEmoji: "🎒",
    newCommands: [],
    showPack: true,
    worldLabel: "Bridge",
    intro:
      "A troll guards the bridge — and it HATES greedy robots. 🧌 " +
      "It only lets Robo cross carrying <b>exactly 3 gems</b>. Not 2. Not 4. THREE.<br><br>" +
      "New check: <code>has 3 gems</code> is true when the backpack holds exactly 3. " +
      "The road is covered in gems… can Robo resist grabbing them all? 😅",
    hint:
      "Two whiles! First: while not has 3 gems: (move, if gem here: pickup). " +
      "Then walk the rest without grabbing: while not wall ahead: move.",
    worlds: [
      {
        cols: 11, rows: 3,
        robot: { x: 0, y: 1, dir: "E" },
        walls: [],
        gems: [[1, 1], [2, 1], [4, 1], [6, 1], [7, 1], [9, 1]],
        goal: { x: 10, y: 1 },
      },
      {
        cols: 11, rows: 3,
        robot: { x: 0, y: 1, dir: "E" },
        walls: [],
        gems: [[2, 1], [3, 1], [5, 1], [6, 1], [8, 1]],
        goal: { x: 10, y: 1 },
      },
    ],
    maxLines: 6,
    mustUse: ["while"],
    gemsOptional: true,
    requirePack: 3,
    failMsg: {
      pack: "The troll counts my gems and shakes its head… it wants EXACTLY 3 in my backpack! 🧌",
    },
    solution:
      "while not has 3 gems:\n  move\n  if gem here:\n    pickup\nwhile not wall ahead:\n  move",
  },

  // ---------- RAINBOW MAGIC ----------
  {
    id: "color-1",
    title: "The Upside-Down Rainbow",
    concept: "Rainbow magic",
    conceptEmoji: "🌈",
    newCommands: [],
    showPack: true,
    intro:
      "Here's the backpack's big secret: it's a <b>stack</b> — the LAST gem in is the FIRST gem out! 🎒 " +
      "Collect red, yellow, blue… and dropgem gives them back <b>blue, yellow, red</b>. " +
      "Lucky for you, these rainbow altars are lined up upside-down. " +
      "Watch the pack as you go — you'll SEE the order flip!",
    hint:
      "Grab all 3 (repeat 3: move, pickup). Then: move 3 to the first altar, dropgem — " +
      "then repeat 2: (move 2, dropgem). Finish with move 2. The colors sort themselves!",
    world: {
      cols: 13, rows: 3,
      robot: { x: 0, y: 1, dir: "E" },
      walls: [],
      gems: [[1, 1, "red"], [2, 1, "yellow"], [3, 1, "blue"]],
      deliveries: [[6, 1, "blue"], [8, 1, "yellow"], [10, 1, "red"]],
      goal: { x: 12, y: 1 },
    },
    maxLines: 9,
    mustUse: ["dropgem"],
    solution:
      "repeat 3:\n  move\n  pickup\nmove 3\ndropgem\nrepeat 2:\n  move 2\n  dropgem\nmove 2",
  },
  {
    id: "color-2",
    title: "The Color Door",
    concept: "Rainbow magic",
    conceptEmoji: "🌈",
    newCommands: [],
    showPack: true,
    worldLabel: "Vault",
    intro:
      "Two vault doors: the ruby vault above ⬆️, the sapphire vault below ⬇️. " +
      "New check: <code>has red gem</code> — Robo peeks in its own backpack! " +
      "Collect the gems in the tunnel… then let the <b>backpack decide</b> which way to turn. " +
      "One program, and Robo picks the right vault in BOTH worlds. 🧠",
    hint:
      "repeat 4: (move, if gem here: pickup). Then: if has red gem: turn left, else: turn right. Then move 2.",
    worlds: [
      {
        cols: 6, rows: 5,
        robot: { x: 0, y: 2, dir: "E" },
        walls: caveWalls(6, 5, [...seg(0, 2, 4, 2), ...seg(4, 1, 4, 0), ...seg(4, 3, 4, 4)]),
        gems: [[1, 2, "red"], [3, 2, "blue"]],
        goal: { x: 4, y: 0 },
      },
      {
        cols: 6, rows: 5,
        robot: { x: 0, y: 2, dir: "E" },
        walls: caveWalls(6, 5, [...seg(0, 2, 4, 2), ...seg(4, 1, 4, 0), ...seg(4, 3, 4, 4)]),
        gems: [[1, 2, "blue"], [3, 2, "blue"]],
        goal: { x: 4, y: 4 },
      },
    ],
    maxLines: 9,
    mustUse: ["if", "else"],
    solution:
      "repeat 4:\n  move\n  if gem here:\n    pickup\nif has red gem:\n  turn left\nelse:\n  turn right\nmove 2",
  },
  {
    id: "color-3",
    title: "The Dragon Family",
    concept: "BOSS",
    conceptEmoji: "🐉",
    newCommands: [],
    showPack: true,
    worldLabel: "Lair",
    intro:
      "👾 <b>THE BOSS.</b> A family of dragons waits at the bottom of the lair — " +
      "and each one only eats gems of its <b>favorite color</b> (check their cushions!). " +
      "Two lairs, different lengths, ONE program: sweep the tunnel for gems, " +
      "turn at the wall, and feed every dragon on the way down. " +
      "The backpack's last-in-first-out magic lines the colors up perfectly… if you trust it. 🐉💎",
    hint:
      "while not wall ahead: (move, if gem here: pickup). Then turn right, and: repeat 3: (move, dropgem). One more move to the flag!",
    worlds: [
      {
        cols: 8, rows: 6,
        robot: { x: 0, y: 1, dir: "E" },
        walls: caveWalls(8, 6, [...seg(0, 1, 7, 1), ...seg(7, 2, 7, 5)]),
        gems: [[2, 1, "red"], [5, 1, "yellow"], [7, 1, "blue"]],
        deliveries: [[7, 2, "blue"], [7, 3, "yellow"], [7, 4, "red"]],
        goal: { x: 7, y: 5 },
      },
      {
        cols: 11, rows: 7,
        robot: { x: 0, y: 1, dir: "E" },
        walls: caveWalls(11, 7, [...seg(0, 1, 10, 1), ...seg(10, 2, 10, 5)]),
        gems: [[3, 1, "red"], [6, 1, "yellow"], [9, 1, "blue"]],
        deliveries: [[10, 2, "blue"], [10, 3, "yellow"], [10, 4, "red"]],
        goal: { x: 10, y: 5 },
      },
    ],
    maxLines: 9,
    mustUse: ["while", "dropgem"],
    solution:
      "while not wall ahead:\n  move\n  if gem here:\n    pickup\nturn right\nrepeat 3:\n  move\n  dropgem\nmove",
  },

  // ---------- RAINBOW MAGIC SIDE QUEST ----------
  {
    id: "color-p1",
    title: "The Stubborn Altars",
    concept: "Side quest",
    conceptEmoji: "🌟",
    practice: true,
    newCommands: [],
    showPack: true,
    intro:
      "Uh oh. These altars want red, yellow, blue — in the SAME order as the gems on the road. " +
      "But the backpack gives them back <i>flipped</i>! 🔄 " +
      "The gems can't move… but nobody said you have to grab them front-to-back. " +
      "The trickiest side quest in the kingdom. 🧠✨",
    hint:
      "Walk PAST the gems first (move 3 puts you on the blue one). Turn around, and collect them backwards: blue, yellow, red. " +
      "Now the flip works FOR you — turn around again and deliver!",
    world: {
      cols: 10, rows: 3,
      robot: { x: 0, y: 1, dir: "E" },
      walls: [],
      gems: [[1, 1, "red"], [2, 1, "yellow"], [3, 1, "blue"]],
      deliveries: [[5, 1, "red"], [6, 1, "yellow"], [7, 1, "blue"]],
      goal: { x: 9, y: 1 },
    },
    maxLines: 16,
    mustUse: ["dropgem"],
    failMsg: {
      deliver: "The altars refuse the wrong colors! Remember: LAST in, FIRST out. Maybe grab the gems in a different order? 🔄",
    },
    solution:
      "move 3\nturn left\nturn left\npickup\nrepeat 2:\n  move\n  pickup\n" +
      "turn left\nturn left\nmove 4\ndropgem\nrepeat 2:\n  move\n  dropgem\nmove 2",
  },
];

if (typeof module !== "undefined") module.exports = { LEVELS, COMMAND_DOCS, CHECKS_NOTE, PACK_CHECKS_NOTE, CHAPTERS, ARENAS, HANDBOOK };
