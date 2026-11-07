# Dry street and ambient lighting

New raster asset: `environment/asphalt-dry-v1.png`, generated with the built-in
`image_gen.imagegen` tool. The original props atlas is retained; its road cell is no
longer rendered. No manholes, grates or painted road marks are baked into the new material.

## Road

The texture is sampled at its native aspect ratio into shallow street strips.
Mirrored edge pairs meet at identical source texels. Two cached material layers,
with widths 1024 and1493 world units, break up obvious repetition; their combined
pattern spans far more than a normal level. Filling is anchored in world space,
with a thin collision-edge highlight and a darker foreground gradient.
The surface remains matte and dry; coloured illumination is drawn at runtime.

## Atmosphere

- Existing neon cores are selectively dimmed with cached emission masks. Most lights
  shimmer gently; faulty red/pink signs have brief independent outages.
- Small radial light stamps supply glow around the actual lamp/sign locations.
- Warm lamp cones and ground light pools illuminate drifting dust. Six motes orbit each
  visible lamp, using deterministic trajectories rather than per-frame randomness.
- Industrial ventilation props emit a few low-opacity moving steam wisps.
- Wall lights move with their parallax layer, while foreground lights follow world props.
- Effects use game time, so pausing also freezes lighting, dust and steam.

Masks, light stamps, filtered backdrop layers and road surfaces are cached.
Only visible props/layer tiles receive effects. No weather or wet-road effects are added.

## Review

`/scripts/environment-preview.html` shows hub/industrial scenes with pause and camera controls.
`node scripts/browser-check.mjs --environment-review` checks changing illumination,
stable asphalt, deterministic pause and road coverage at tile boundaries and negative
camera positions. Captures:
`artifacts/night-city-environment-hub.png` and `artifacts/night-city-environment-sector.png`.

## Generation prompt

```text
Use case: stylized-concept. Game environment material texture for a detailed painted 2D cyberpunk side-scrolling street. Create one wide horizontal rectangular material plate, 1536x1024 requested. It must consist ENTIRELY of dry dark graphite asphalt: fine realistic aggregate, very subtle dusty wear, tiny restrained scuffs and low-contrast mottling, softly painted raster detail matching a cinematic industrial night-city platformer. Flat even neutral lighting, matte surface, no baked neon reflections or directional light; colour around deep blue charcoal with slight muted warm gray variation. Visually quiet, uniform texture across the entire canvas, so it can be stretched into the shallow foreground street strip in a side-view game. Seamlessly tileable left to right with matching edge tone and grain. NO identifiable repeated objects: no manholes, drain grates, pipes, plates, bricks, curbs, kerbs, road markings, painted lines, symbols, debris, graffiti, large cracks, panels or patches. NO puddles, wetness, rain, reflective shine or mirrors. No horizon, buildings, character, sidewalk, borders, vignette or shadows. Just a clean continuous detailed DRY asphalt material from edge to edge. Opaque background.
```
