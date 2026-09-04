# Rainier Rescue 🐰

Rainier Rescue: a tap-only story game for a 7-year-old that mixes reading and maths.
A Flemish Giant rabbit has wandered up Mt Rainier with a lonely bear cub, and the
hero (the kid, with the name and avatar she picks) follows the paw prints through
five areas to bring the rabbit home. Every scene is one story beat solved by one
puzzle. Every word is read aloud. Nothing is typed.

Lives at `https://ramaguruprakash.github.io/roboquest/rainier/` and deploys with the
rest of the repo. Locally: serve the repo root and open `/rainier/`.

## What she learns

Reading sentences for meaning, following written directions, ordering a story;
adding two to four numbers, number bonds to 10, subtraction as taking away, and
later tens and ones, skip counting and two-digit adding. Each area has at least one
reading scene, one maths scene, and one that needs both. Finishing an area earns a
karate belt (yellow, orange, green, blue, purple); every scene earns oranges.

## How it works

| File | What it is |
|---|---|
| `index.html` / `style.css` | The names screen, the map, one scene at a time |
| `js/story.js` | All the data: `AREAS`, `SCENES`, belts. Text may use `{hero}`, `{rabbit}`, `{cub}` |
| `js/scenes/*.js` | One puzzle type per file: `signpost`, `beam`, `fill`, `order`, `segments`, `cards` |
| `js/app.js` | The runner: progress, unlocking, read-aloud, oranges, belts, Dronacharya |
| `js/test.js` | `node rainier/js/test.js` checks every scene is solvable and every area mixes skills |
| `../js/guru.js`, `../guru.css` | Dronacharya, shared with RoboQuest (`kind: "quest"`) |

A puzzle module exports `mount(scene, stage, api)` and calls `api.solved()` or
`api.wrong(vars)`; it returns `{ state, solution, details }` so the guru can coach the
exact moment. The runner handles the story text, the companion, rewards and the map.

## Adding a scene

Add an object to `SCENES` in `js/story.js` with `id` (`<area>-<n>`), `area`, `type`,
`skills`, `reward`, the five texts (`before`, `task`, `after`, `wrong`, `hint`) and the
type's own fields (documented at the top of each `scenes/*.js`). Scenes unlock in
order within an area; areas unlock in order. Run `node rainier/js/test.js`.

## Dronacharya

Same proxy as RoboQuest, with a `quest` context kind and a persona addendum for a
7-year-old (shorter, no symbols, finger-counting and sound-it-out strategies). She
signs in once with her own password from `GURU_TOKENS`. Replies are read aloud and
she can hold the 🎤 to talk instead of typing.
