/* Stage backdrop for the "midway" zone. Owned by ONE agent; see art/zones/README.md.
   Every hook is optional. Keep this file self-contained (import helpers from ../util.js). */
export default {
  // paint(ctx, game, api): static decor baked once into the level canvas (world px, after tiles/overhangs).
  //   api.lights.push({x,y,r,color,...}) / api.bulbs.push({x,y,color,seed,state}) to add light sources.
  // backdrop(ctx, game, t, view, box): animated, world space, drawn BEHIND the map (fills the void past its edges).
  // ambient(ctx, game, t, view, box): animated, world space, over the floor, under figures and the darkness.
  // glow(ctx, game, t, view, box): animated, world space, AFTER the darkness pass (neon/signage that burns through).
};
