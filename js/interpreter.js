"use strict";

// Robo — a tiny programming language for kids.
//
// Statements:
//   move            move 3
//   turn left       turn right
//   pickup
//   set name = 5    set n = n + 1
//   repeat 4:           (indented block below)
//   if gem here:        (optional  else:  block)
//   while not wall ahead:
//   define dance:       (then call it by writing:  dance)
//
// Conditions: gem here · wall ahead · clear ahead · at goal   (prefix with "not")

const Robo = (() => {
  const KEYWORDS = ["move", "turn", "pickup", "drop", "repeat", "set", "if", "else", "while", "define"];

  function friendly(msg, lineNo) {
    const e = new Error(msg);
    e.lineNo = lineNo;
    e.friendly = true;
    return e;
  }

  function levenshtein(a, b) {
    const m = a.length, n = b.length;
    const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
    for (let j = 0; j <= n; j++) d[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        d[i][j] = Math.min(
          d[i - 1][j] + 1,
          d[i][j - 1] + 1,
          d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
        );
      }
    }
    return d[m][n];
  }

  function suggest(word, extra) {
    const cands = [...KEYWORDS, "left", "right", ...(extra || [])];
    let best = null, bestDist = 3; // only suggest close matches
    for (const c of cands) {
      const dist = levenshtein(word.toLowerCase(), c);
      if (dist < bestDist) { bestDist = dist; best = c; }
    }
    return best;
  }

  // ---------- Parsing ----------

  function parse(code) {
    const lines = [];
    code.split("\n").forEach((raw, i) => {
      const noTabs = raw.replace(/\t/g, "  ");
      const noComment = noTabs.replace(/#.*$/, "");
      if (!noComment.trim()) return;
      lines.push({
        indent: noComment.match(/^ */)[0].length,
        text: noComment.trim(),
        lineNo: i + 1,
      });
    });
    const p = { lines, i: 0 };
    if (lines.length && lines[0].indent !== 0) {
      throw friendly("The first line shouldn't have spaces in front of it.", lines[0].lineNo);
    }
    const body = parseBlock(p, 0);
    if (p.i < p.lines.length) {
      throw friendly("The spacing (indent) at the start of this line confused me.", p.lines[p.i].lineNo);
    }
    return body;
  }

  function parseBlock(p, indent) {
    const stmts = [];
    while (p.i < p.lines.length) {
      const ln = p.lines[p.i];
      if (ln.indent < indent) break;
      if (ln.indent > indent) {
        throw friendly("This line has too many spaces at the start.", ln.lineNo);
      }
      stmts.push(parseStatement(p, indent));
    }
    return stmts;
  }

  function parseChildBlock(p, parentIndent, ln, what) {
    if (p.i >= p.lines.length || p.lines[p.i].indent <= parentIndent) {
      throw friendly(`After "${what}" I need at least one line under it, pushed in by 2 spaces.`, ln.lineNo);
    }
    return parseBlock(p, p.lines[p.i].indent);
  }

  function parseStatement(p, indent) {
    const ln = p.lines[p.i];
    const text = ln.text;
    const lineNo = ln.lineNo;
    p.i++;
    let m;

    if (text === "move") return { type: "move", count: null, lineNo };
    if ((m = text.match(/^move\s+(.+)$/))) {
      return { type: "move", count: parseExpr(m[1], lineNo), lineNo };
    }
    if (text === "turn left") return { type: "turn", dir: -1, lineNo };
    if (text === "turn right") return { type: "turn", dir: 1, lineNo };
    if (/^turn\b/.test(text)) throw friendly('Say "turn left" or "turn right".', lineNo);
    if (text === "pickup") return { type: "pickup", lineNo };
    if (text === "drop") return { type: "drop", lineNo };
    if (/^drop\b/.test(text)) throw friendly('Just write "drop" on its own line — Robo drops one star right where it stands.', lineNo);
    if ((m = text.match(/^set\s+([A-Za-z_]\w*)\s*=\s*(.+)$/))) {
      return { type: "set", name: m[1], expr: parseExpr(m[2], lineNo), lineNo };
    }
    if (/^set\b/.test(text)) throw friendly("To make a variable, write it like:  set steps = 5", lineNo);
    if ((m = text.match(/^repeat\s+(.+?)\s*:$/))) {
      return { type: "repeat", count: parseExpr(m[1], lineNo), body: parseChildBlock(p, indent, ln, "repeat"), lineNo };
    }
    if (/^repeat\b/.test(text)) throw friendly("Write it like:  repeat 3:  (don't forget the colon!)", lineNo);
    if ((m = text.match(/^if\s+(.+?)\s*:$/))) {
      const stmt = {
        type: "if",
        cond: parseCond(m[1], lineNo),
        body: parseChildBlock(p, indent, ln, "if"),
        elseBody: null,
        lineNo,
      };
      if (p.i < p.lines.length && p.lines[p.i].indent === indent && p.lines[p.i].text === "else:") {
        const elseLn = p.lines[p.i];
        p.i++;
        stmt.elseBody = parseChildBlock(p, indent, elseLn, "else");
      }
      return stmt;
    }
    if (/^if\b/.test(text)) throw friendly("Write it like:  if gem here:  (don't forget the colon!)", lineNo);
    if (text === "else:" || /^else\b/.test(text)) {
      throw friendly('"else:" needs an "if" right above it, with the same spacing.', lineNo);
    }
    if ((m = text.match(/^while\s+(.+?)\s*:$/))) {
      return { type: "while", cond: parseCond(m[1], lineNo), body: parseChildBlock(p, indent, ln, "while"), lineNo };
    }
    if (/^while\b/.test(text)) throw friendly("Write it like:  while not wall ahead:", lineNo);
    if ((m = text.match(/^define\s+([A-Za-z_]\w*)\s*:$/))) {
      return { type: "define", name: m[1], body: parseChildBlock(p, indent, ln, "define"), lineNo };
    }
    if (/^define\b/.test(text)) throw friendly("Write it like:  define dance:  (then indent the moves under it)", lineNo);
    if ((m = text.match(/^([A-Za-z_]\w*)$/))) {
      return { type: "call", name: m[1], lineNo };
    }

    const word = text.split(/\s+/)[0];
    const s = suggest(word);
    throw friendly(`I don't know "${word}".` + (s ? ` Did you mean "${s}"?` : ""), lineNo);
  }

  function parseExpr(src, lineNo) {
    const tokens = src.match(/\d+|[A-Za-z_]\w*|\S/g) || [];
    let pos = 0;
    function term() {
      const t = tokens[pos++];
      if (t === undefined) throw friendly("This math is missing a number at the end.", lineNo);
      if (/^\d+$/.test(t)) return { type: "num", value: parseInt(t, 10) };
      if (/^[A-Za-z_]\w*$/.test(t)) return { type: "var", name: t };
      throw friendly(`I don't understand "${t}" in this math.`, lineNo);
    }
    let node = term();
    while (pos < tokens.length) {
      const op = tokens[pos];
      if (op === "+" || op === "-" || op === "*") {
        pos++;
        node = { type: "op", op, left: node, right: term() };
      } else {
        throw friendly(`I don't understand "${op}" here. I know +, - and *.`, lineNo);
      }
    }
    return node;
  }

  const CONDITIONS = {
    "gem here": "gemHere",
    "wall ahead": "wallAhead",
    "clear ahead": "clearAhead",
    "at goal": "atGoal",
  };

  function parseCond(src, lineNo) {
    let s = src.trim();
    let neg = false;
    while (s.startsWith("not ")) {
      neg = !neg;
      s = s.slice(4).trim();
    }
    if (!(s in CONDITIONS)) {
      throw friendly(
        `Robo can check "gem here", "wall ahead", "clear ahead" or "at goal" — not "${s}".`,
        lineNo
      );
    }
    return { kind: CONDITIONS[s], neg };
  }

  // ---------- Running ----------

  const DIRS = ["N", "E", "S", "W"];
  const DELTA = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
  const MAX_STEPS = 500;

  function run(program, world) {
    const state = {
      x: world.robot.x,
      y: world.robot.y,
      dir: world.robot.dir,
      gems: new Set((world.gems || []).map((g) => g[0] + "," + g[1])),
      dropped: new Set(),
    };
    const walls = new Set((world.walls || []).map((w) => w[0] + "," + w[1]));
    const steps = [];
    const vars = {};
    const funcs = {};
    let ops = 0;

    function snap(action, lineNo, extra) {
      steps.push(Object.assign(
        { action, lineNo, x: state.x, y: state.y, dir: state.dir, gems: [...state.gems], dropped: [...state.dropped] },
        extra || {}
      ));
    }
    function budget(lineNo) {
      if (++ops > MAX_STEPS) {
        throw friendly("Whew! Robo did 500 things and got tired. 😴 Is there a loop that never ends?", lineNo);
      }
    }
    function blocked(x, y) {
      return x < 0 || y < 0 || x >= world.cols || y >= world.rows || walls.has(x + "," + y);
    }
    function aheadCell() {
      const d = DELTA[state.dir];
      return [state.x + d[0], state.y + d[1]];
    }
    function evalExpr(node, lineNo) {
      switch (node.type) {
        case "num": return node.value;
        case "var": {
          if (!(node.name in vars)) {
            const s = suggest(node.name, Object.keys(vars));
            throw friendly(
              `I don't know a variable called "${node.name}".` +
                (s && s !== node.name ? ` Did you mean "${s}"?` : ` Make it first with:  set ${node.name} = 3`),
              lineNo
            );
          }
          return vars[node.name];
        }
        case "op": {
          const l = evalExpr(node.left, lineNo);
          const r = evalExpr(node.right, lineNo);
          return node.op === "+" ? l + r : node.op === "-" ? l - r : l * r;
        }
      }
    }
    function evalCond(c) {
      let v;
      if (c.kind === "gemHere") {
        v = state.gems.has(state.x + "," + state.y);
      } else if (c.kind === "wallAhead") {
        const [ax, ay] = aheadCell();
        v = blocked(ax, ay);
      } else if (c.kind === "clearAhead") {
        const [ax, ay] = aheadCell();
        v = !blocked(ax, ay);
      } else {
        v = !!world.goal && state.x === world.goal.x && state.y === world.goal.y;
      }
      return c.neg ? !v : v;
    }

    function exec(stmts) {
      for (const st of stmts) {
        budget(st.lineNo);
        switch (st.type) {
          case "move": {
            const n = st.count ? evalExpr(st.count, st.lineNo) : 1;
            if (n < 0) throw friendly("Robo can't move a negative number of squares!", st.lineNo);
            for (let k = 0; k < n; k++) {
              budget(st.lineNo);
              const [ax, ay] = aheadCell();
              if (blocked(ax, ay)) {
                snap("crash", st.lineNo);
                throw friendly("Bonk! 🤕 Robo walked into a wall.", st.lineNo);
              }
              state.x = ax;
              state.y = ay;
              snap("move", st.lineNo);
            }
            break;
          }
          case "turn": {
            const i = DIRS.indexOf(state.dir);
            state.dir = DIRS[(i + st.dir + 4) % 4];
            snap("turn", st.lineNo);
            break;
          }
          case "pickup": {
            const key = state.x + "," + state.y;
            if (!state.gems.has(key)) {
              throw friendly("There's no gem here to pick up! Try moving to a 💎 first.", st.lineNo);
            }
            state.gems.delete(key);
            snap("pickup", st.lineNo);
            break;
          }
          case "drop": {
            const key = state.x + "," + state.y;
            if (state.dropped.has(key)) {
              throw friendly("There's already a star here! Robo can only drop one ⭐ per square.", st.lineNo);
            }
            state.dropped.add(key);
            snap("drop", st.lineNo);
            break;
          }
          case "set": {
            vars[st.name] = evalExpr(st.expr, st.lineNo);
            snap("set", st.lineNo, { say: st.name + " = " + vars[st.name] });
            break;
          }
          case "repeat": {
            const n = evalExpr(st.count, st.lineNo);
            if (n > 200) throw friendly("That's a LOT of repeats! Try 200 or fewer.", st.lineNo);
            for (let k = 0; k < n; k++) exec(st.body);
            break;
          }
          case "if": {
            if (evalCond(st.cond)) exec(st.body);
            else if (st.elseBody) exec(st.elseBody);
            break;
          }
          case "while": {
            while (evalCond(st.cond)) {
              budget(st.lineNo);
              exec(st.body);
            }
            break;
          }
          case "define": {
            funcs[st.name] = st.body;
            break;
          }
          case "call": {
            if (!funcs[st.name]) {
              const s = suggest(st.name, Object.keys(funcs));
              throw friendly(
                `I don't know how to "${st.name}".` +
                  (s ? ` Did you mean "${s}"?` : ` Teach me first with:  define ${st.name}:`),
                st.lineNo
              );
            }
            exec(funcs[st.name]);
            break;
          }
        }
      }
    }

    let error = null;
    try {
      exec(program);
    } catch (e) {
      if (!e.friendly) throw e;
      error = { message: e.message, lineNo: e.lineNo };
    }
    return {
      steps,
      error,
      final: { x: state.x, y: state.y, dir: state.dir, gems: [...state.gems], dropped: [...state.dropped] },
    };
  }

  // Count "real" code lines (ignores blanks and comments) — used for level line limits.
  function countCodeLines(code) {
    return code
      .split("\n")
      .map((l) => l.replace(/#.*$/, "").trim())
      .filter((l) => l.length > 0).length;
  }

  return { parse, run, countCodeLines };
})();

if (typeof module !== "undefined") module.exports = Robo;
