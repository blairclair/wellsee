You're one of 8 agents, each redesigning the BACKGROUND of one stage of "Escape the Midway", a canvas horror game (repo blairclair/wellsee, git worktree; live at https://blairclair.github.io/wellsee/tabs/escape/). This is the user's #1 and only priority right now.

The user's request, in their words: "Make the backgrounds for every stage more terrifyingly cheerful carnival-esque. Vibrant and busy and carnival and terrifying."

YOUR STAGE: __ZONE__ (__DESC__). You own exactly ONE file: `tabs/escape/js/art/zones/__ZONE__.js`. The other 7 agents own the other zone files at the same time.

FIRST: `git fetch origin && git rebase origin/main`. Then read `SITE.md` (Questions, Messages, scratchpad rule), `tabs/escape/js/art/zones/README.md` (the hook contract: paint / backdrop / ambient / glow), `tabs/escape/ARCHITECTURE.md`, and your zone's level in `tabs/escape/js/content.js`: its map, legend and palette. Skim `art/tiles.js`, `art/util.js` and the lighting in `art.js` so your decor fits the existing art and survives the darkness pass.

## Goal: a stage that's cheerful and terrifying at once
Vibrant, saturated carnival colour and busy, joyful decoration, made horrifying by what's wrong with it. For example:
- bunting, pennants, balloons, striped awnings, painted signs and banners with slogans gone wrong
- marquee bulbs, rides and Ferris wheels on the skyline, prize stalls, popcorn and ticket litter, confetti
- clown-face murals with too many teeth, smiling cutouts whose eyes follow you, balloons that drift against the wind
- painted "FUN!" signs dripping, a calliope's pipes, mascots with no faces
Make it specific to THIS stage's identity, so each stage reads as a different place.
- **backdrop:** fill the void past the map edges with the carnival beyond: skyline rides, tents and lights, a hill, the sky.
- **paint:** bake static decor into the level, around walls and margins.
- **ambient:** animated motion such as fluttering flags, turning wheels and drifting balloons.
- **glow:** for neon and signage that burns through the darkness. Add lights via `api.lights` / `api.bulbs` so colour actually shows in the dark. Brightness must stay compatible with the horror mood.

## Hard rules
- Edit ONLY your zone file (plus new helper files under `js/art/zones/__ZONE__/` if you need them). Never touch art.js, tiles.js, index.js, content.js or other zone files. If you need a hook or engine change, SendMessage "main" with the exact change, and keep working.
- **Gameplay readability:** never cover or confuse walkable floor, hazards, pickups, enemies or the exit. Keep busy detail on walls, margins and backdrop, with the walkable path legible.
- **Performance:** keep the game smooth. Cache heavy drawing to offscreen canvases; `paint` is free per frame. Measure with `?fps` before and after; report frame time.
- **Accessibility:** respect `view.reduced` (freeze or slow motion, no strobing), keep flashes under 3/s, and keep it legible at 375px.
- Use only your own scratchpad subfolder `<scratchpad>/__ZONE__/` and port __PORT__. Stop any server you start.

## Review
Reach your stage via the game's route, or load it directly by setting up game state in Playwright (the tests in `tabs/escape/tests/` show how). Screenshot it at 1280px and 375px: in play, at the map edges (backdrop) and in the darkness. Judge the screenshots with your Read tool and iterate until it's genuinely vibrant, busy, carnival and terrifying.

## Deploy when done
Run `node tabs/escape/tests/maps.test.mjs` and `engine.test.mjs`, and `tests/play.browser.cjs` against your local server (desktop and phone, no errors). Then `scripts/deploy.sh "escape stage: __ZONE__ backdrop"`. Never force-push. Confirm the live game loads.

Report: what the stage now looks like, frame time before and after, and the deployed commit.
