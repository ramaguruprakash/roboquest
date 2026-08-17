# RoboQuest 🤖

A browser game that teaches kids (ages 8–11) how to code. Kids write programs in **Robo**, a
tiny typed language, to steer a robot through grid puzzles — collecting gems 💎 and reaching
the flag 🏁. Each level introduces exactly one new idea:

1. **Instructions** (levels 1–3) — programs run one line at a time: `move`, `turn`, `pickup`
2. **Loops** (4–6) — `repeat 9:` with an indented body
3. **Variables** (7–8) — `set steps = 7`, then use `steps` anywhere a number goes
4. **If / else** (9–10) — `if gem here:` … `else:`
5. **While loops** (11–12) — `while not wall ahead:`
6. **Functions** (13–14) — `define dance:` teaches Robo a new word
7. **Art with code** (15–20) — `drop` stamps a ⭐; win by painting the target picture exactly
   (dotted squares on the grid), from a 3-star line up to a nested-loop square, a
   size-agnostic picture frame drawn with `define` + `while`, and finally a full
   **web-page wireframe** (header, menu, text, button) built with functions + variables

Levels use two teaching devices: **line limits** (a 9-square hallway with a 2-line limit makes
loops the only way through) and **must-use rules** (a level that requires `set` so kids can't
fall back on what they already know).

## Run it

No build step, no dependencies:

```bash
cd learncode
python3 -m http.server 8000
# open http://localhost:8000
```

(Opening `index.html` directly also works.)

Progress (⭐ per level) and each level's code are saved in the browser's localStorage.
Levels unlock in order; "Start over" in the header wipes everything.

## The Robo language

```
move            # walk 1 square (move 3 walks 3)
turn left       # or: turn right
pickup          # grab the gem on this square
drop            # stamp a star on this square (one per square)

set steps = 5   # variables; math with + - * works
repeat steps:   # loop — indent the body by 2 spaces
  move

if gem here:    # conditions: gem here · wall ahead · clear ahead · at goal
  pickup        # prefix with "not" to flip
else:
  move

while not wall ahead:
  move

define dance:   # teach a new word, then call it by name
  turn left
  turn right
dance
```

Errors are friendly and kid-voiced ("Bonk! 🤕 Robo walked into a wall", typo suggestions like
*Did you mean "move"?*). A 500-step budget catches infinite loops.

## Project layout

| File | What it is |
|---|---|
| `index.html` / `style.css` | The app shell and toybox look |
| `js/interpreter.js` | Robo language: parser + interpreter, no dependencies |
| `js/levels.js` | All level data — world grids, intros, hints, rules, reference solutions |
| `js/app.js` | UI: rendering, animation, progress, speech bubble |
| `js/test.js` | `node js/test.js` — verifies every level's solution wins and obeys its own rules |

## Adding a level

Add an entry to `LEVELS` in `js/levels.js`. Coordinates are `x` = column, `y` = row (0 = top-left);
directions are `N E S W`. Win = robot on the goal (if the level has one) **and** zero gems left
**and** the dropped stars exactly match `target` (if the level has one). Art levels use `target`
instead of `goal`. Levels are grouped into table-of-contents chapters by id prefix (see `CHAPTERS`);
the in-app handbook lives in `HANDBOOK`, both in `js/levels.js`. Give the level a `solution`
and run `node js/test.js` — the harness checks the solution wins, fits `maxLines`, uses every
`mustUse` word, and that nothing (robot, goal, gems) is out of bounds or inside a wall.
