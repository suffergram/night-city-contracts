# Dry layered scenery / 0.6

Generated with built-in `image_gen.imagegen` (not CLI). Final assets are saved in this workspace:

- `assets/environment/skyline-dry-v2.png` — opaque far skyline, camera factor 0.06.
- `assets/environment/district-dry-v2.png` — transparent middle-distance district, factor 0.24.
- `assets/environment/walls-dry-v2.png` — transparent nearby back walls, factor 0.52.
- `assets/environment/props-dry-v2.png` — dry edited 4×3 modular atlas, factor 1 with the playable street.

Source for the edited prop atlas: `assets/environment/props-v1.png`. Old rainy art remains archived and is no longer loaded. No rain particles or actor reflections are rendered. The street tile has a matte dry surface. Facade heights derive from ACTOR_HEIGHT, and aspect ratios are preserved when scaling; doorway openings are calibrated to roughly 1.3–1.4 actor heights. Exact layer positions and scale calibration live in `src/environment.js`.

## Exact generation / edit prompts

### far

```text
Use case: stylized-concept. Asset type: production 2D side-scroller parallax environment raster art. Detailed hand-painted realistic cyberpunk Night City industrial city, blue charcoal dusk, restrained cyan and magenta neon, gritty matte concrete and worn metal matching illustrated mercenary sprites. Strict side-on elevation, no perspective vanishing-point street. Absolutely DRY WEATHER: no rain, no vertical rain streaks, no puddles, no wet highlights, no mirror reflections, no water or glossy asphalt. No characters, no HUD, no border, no watermark. Wide 2048x1024 landscape. Horizontal density at left/right edges should match for repeating scrolling. OPAQUE DISTANT SKYLINE LAYER ONLY. Calm dark blue-violet sky with many distant tall slender megatowers grouped behind a horizon, subtle atmospheric distance but no weather. Tower tops occupy middle third, buildings continue below bottom edge. Small fine windows, dim rooftop beacons, quiet silhouettes. No close buildings, no storefronts, no entrances, no stairs, no street, no pavement and no foreground objects. This layer represents structures hundreds of metres away, with much smaller windows and low contrast. Keep upper half mostly unobstructed clear night sky.
```

### mid

```text
Use case: stylized-concept. Asset type: production 2D side-scroller parallax environment raster art. Detailed hand-painted realistic cyberpunk Night City industrial city, blue charcoal dusk, restrained cyan and magenta neon, gritty matte concrete and worn metal matching illustrated mercenary sprites. Strict side-on elevation, no perspective vanishing-point street. Absolutely DRY WEATHER: no rain, no vertical rain streaks, no puddles, no wet highlights, no mirror reflections, no water or glossy asphalt. No characters, no HUD, no border, no watermark. Wide 2048x1024 landscape. Horizontal density at left/right edges should match for repeating scrolling. TRANSPARENT MIDDLE-DISTANCE LAYER ONLY. Isolated continuous row of apartment blocks and factory backs of 5–8 stories with varied roofline, small regular windows, fire escapes, AC ducts, rooftop water tanks and short cable spans. Only these buildings, actual clean transparent alpha sky around and above them. Buildings sit on common horizontal bottom baseline; masses fill the lower 60% of image, roof antennae reach upper third. Buildings continue cleanly below bottom edge, without visible ground. No skyline behind, no frontmost shops, no large human-scale doors, no pavement or ground strip. Fine windows scaled for buildings tens of metres away. Slight blue atmospheric low contrast.
```

### near

```text
Use case: stylized-concept. Asset type: production 2D side-scroller parallax environment raster art. Detailed hand-painted realistic cyberpunk Night City industrial city, blue charcoal dusk, restrained cyan and magenta neon, gritty matte concrete and worn metal matching illustrated mercenary sprites. Strict side-on elevation, no perspective vanishing-point street. Absolutely DRY WEATHER: no rain, no vertical rain streaks, no puddles, no wet highlights, no mirror reflections, no water or glossy asphalt. No characters, no HUD, no border, no watermark. Wide 2048x1024 landscape. Horizontal density at left/right edges should match for repeating scrolling. TRANSPARENT NEAR BACKGROUND LAYER ONLY. Isolated row of low industrial building BACK WALLS, 2–3 storeys, weathered concrete and brick, vents, narrow maintenance windows, conduits, small restrained neon wall panels and roof piping. Actual clean transparent alpha sky above irregular roofline and gaps between structures. Common horizontal bottom baseline. Fill lower two thirds; no floor. IMPORTANT no oversized entrance or garage or visible doorway, no foreground street, no shop signage, no people, no background towers. Small domestic windows, roof machinery and authentic human-scale details. This is a wall layer behind separate human-scale interactive storefronts, not a full street scene.
```

### dryProps

```text
Use case: precise-object-edit. Edit target: supplied 4x3 transparent modular cyberpunk prop atlas. Preserve its exact 4 columns x3 rows layout, all twelve objects, exact positions, scale, outlines, transparent background, signage and illustrated material detail. Change only weather/material wetness. Replace the wet glossy road strip in bottom-left cell with DRY MATTE dark cracked concrete/asphalt, dry dusty curb and dry drains, no puddles, no colored neon reflections. Remove wet shine, droplets, water streaks and rain from the other props, retaining normal metal highlights and emissive neon signs. Keep the ground strip a complete rectangular tile. No weather particles, no cast shadows, no background, no gridlines. Genuine transparent alpha in every empty area. Dry industrial night scene, same style.
```

