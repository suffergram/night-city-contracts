# Location detail sprites

The market now places dense groups of 2–3 neighboring shops, either touching
(60% of internal joins) or with 4–16px gaps, separated by irregular 75–185px passages. Groups favor a shared
trade, but can mix vendors. Each contract includes food, electronics and clothing;
neighboring shops never repeat the exact same storefront. Touching joins use
the structural wall anchors, letting projecting canopies/merchandise overlap.
Old individual upper-door modules are replaced by complete two-storey concrete
hotels with balconies; see `MARKET-HOTELS.md` for assets and prompts.

`environment/market-stalls-v1.png` adds nine complete, transparent storefronts:
three food shops (tea/noodles, grill, deli), three technology shops (repair,
cyberware, second-hand electronics), and three clothing shops (tailor, tactical
clothes, streetwear). The imagegen prompt requested dry, detailed painted
cyberpunk art with compact, medium and wide silhouettes, distinct awnings and
merchandise, no people or background. Rows follow those categories; columns have
unequal widths to fit the artwork. `src/market-stalls.js` shares cell boundaries
and measured opaque dimensions between layout and renderer. All shops use a
single uniform scale; width variation comes from different drawings. Existing
food/electronics storefronts remain in the selection, giving eleven total styles.
Clothing racks attach to clothing shops, parcels to electronics vendors, and
cooking props to food shops. The deli does not emit cooking steam.

Two local transparent 4×4 raster atlases add 32 new prop silhouettes:

- `environment/city-life-v1.png`: bench, vending machine, recycling bins, direction
  sign; clothing rack, spice cart, grill, menu board; laundry, mailboxes, janitor
  trolley, chair/plant; noticeboard, bicycle, air purifier, courier parcels.
- `environment/worksite-details-v1.png`: valves, generator, tool cabinet, cable
  drum; forklift, cargo pallet, dock ropes/buoys, refuelling pump; breaker box,
  hose reel, cones/barrier, pressure tank; anchor/chain reel, dock fenders,
  port information board, cargo trolley.

Both were generated with built-in imagegen as detailed, dry, painted cyberpunk
game art. Each prompt specified sixteen isolated complete props in uniform cells,
front/side elevation, no floor/background, no people, rain or baked effects.
The industrial atlas received a background-extraction edit preserving its 4×4
layout and objects while removing the generated light backdrop and floor shadows.
The final runtime files have true alpha transparency (verified in the browser).

`src/dressing.js` defines calibrated dimensions, themed pools and an independent
seeded placement stream. Core layouts, enemy positions, rewards and collision
geometry are not rerolled or modified by decorative placement. Wide floor props
get a placement attempt before repeats; each theme chooses from seven or eight
appropriate silhouettes. Some props may be omitted when space is too tight.

Outdoor floor props stand only on the ground, never on containers, stall roofs or
technical platforms. Inside megablock, actual corridor decks also count as floors.
Wall fixtures appear only against solid megablock walls, with their bottoms 18–42
world pixels above the floor; mailboxes and noticeboards are within human reach.
Outdoor wall props without a proper wall are omitted rather than floated against
the parallax facade or given improvised tall stands. Placement avoids stairs,
ladders, doorway/portal clearance, spawn areas, wall lights and caches.

`src/detail-sizes.js` records opaque artwork dimensions measured at alpha > 160.
Both axes use one uniform scale factor; the sprite's opaque bottom sits on the
floor. Isolated translucent pixels do not define the contact line: a sufficiently
solid row anchors each base, with a one-pixel overlap over the ground/roof lip.
Transparent padding is trimmed at the same threshold, with a small contact
shadow beneath floor props. Cached material variants gently darken/desaturate the
new sprites to match the scene while retaining emissive cyan/magenta details.
The nearest facade overlaps the road edge by three pixels to eliminate the gap.

The same no-stretch rule applies to the older location/prop atlases through
`src/scenery-sizes.js` and the shared fitting renderer. Market stalls and freight
containers and hotel facades are generated from their native art ratios.
Deck beams and ladders repeat cropped texture segments at a uniform
scale to cover different lengths.

Produce no longer fills every gap in the market. At most two identically sized
produce stacks attach directly to food stalls, separated from other repeats and
checked against routes/interactions. Grill and spice-cart details likewise attach
to food stalls; electronics-only stretches do not receive random food merchandise.

Hub details use a fixed layout seed; contract dressing varies with the contract
seed. Visible props are culled horizontally. Atlas cells are trimmed/cached once,
and hub preview layouts are cached per world. Actors render in front of details;
decorative equipment does not act as an obstacle or a new climbable surface.

Tests cover 140 generated locations, distinct pools, floor-only placement, original
artwork proportions, reachable wall fixtures and reproducible hub dressing. Browser level/environment
reviews check the new atlases and render each location family.
