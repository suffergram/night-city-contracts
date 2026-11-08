# Metropolitan hub backdrop

The hub uses three independently scrolling raster layers, keeping street-level
props and entrances at their existing human scale:

| Layer | Asset | Camera factor |
| --- | --- | ---: |
| Distant dense megacity | `environment/metropolis-far-v1.png` | 0.04 |
| Transparent residential/corporate towers | `environment/metropolis-mid-v1.png` | 0.18 |
| Existing nearby street walls | `environment/walls-dry-v2.png` | 0.52 |

Industrial, port and megablock backgrounds retain their existing render paths.
Market generation sets `backdrop` once, with `rng() < 0.5` choosing `metropolis`
and the other half retaining `district`. The choice is reproducible from the seed.
Rendering never rolls again. No rain or wet street artwork is reintroduced.

The two new images were generated with built-in imagegen and stored locally.
The archived `city-v1.png` inspired the dense towers, billboards and skybridges;
its static rain and oversized street-level doorways are not used.

Generation briefs:

- **Far, opaque:** wide detailed realistic painted cyberpunk megacity at night,
  straight-on side elevation from the low levels; immense densely layered towers
  extending beyond the top, amber apartment windows, large cyan/magenta holographic
  advertisements, spires and suspended skybridges, blue-violet atmospheric distance.
  Buildings fill 90% of the frame, almost no empty sky. Buildings continue below
  bottom edge; matching density on left/right for scrolling. No street walls,
  human-scale entrances, ground, characters, rain, wet surfaces, text or HUD.
- **Mid, transparent:** isolated row of immense weathered 15–30 storey residential
  and corporate towers, varied roofline, vertical cyan/magenta ads, warm windows,
  service skybridges, cables, machinery, antennae. Genuine transparent sky and gaps
  around upper silhouettes. Common bottom baseline, buildings continue below frame.
  Detailed painted dark graphite concrete/metal, desaturated blue-violet atmosphere.
  No background city/sky, storefronts, pavement, oversized doors, people, standing
  lamps, rain, puddles, wet shine, readable text or UI.

Review: `node scripts/browser-check.mjs --environment-review` renders the hub and
checks profile equivalence, scrolling, road coverage and ambient animation.
`--level-review` also captures both generated market backdrops.
