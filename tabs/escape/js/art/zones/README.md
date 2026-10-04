# Stage backdrops — one file per zone

Each zone file exports an object of optional hooks (see the comment in any zone file).
`box = {x0, y0, x1, y1}` is the visible world rectangle (with a small margin); cull to it.
Map size in world px: `game.w * TILE` × `game.h * TILE` (TILE from ../../content.js).
Tile lookup: `game.tiles[ty * game.w + tx]`, solidity via `TILES[name].solid`.
Zone id: `game.levelId`. Palette hints: `game.level.palette` ({fog, tint}).

Hook order per frame: backdrop → map blit → TILE_FX → decals/bulbs → ambient → figures → darkness → glow → screen post.
`paint` runs once per level (or zoom-scale change) into the prerendered level canvas.

Rules: only edit your own zone file. Performance budget: the frame must stay smooth
(cache heavy drawing to offscreen canvases; `paint` is free per frame). Respect
`view.reduced` (no flashing/strobe; slow or freeze motion) and keep flashes < 3/s.
Don't cover the walkable floor with anything that hides hazards, pickups, enemies or the exit.
