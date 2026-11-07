# Equipment materials / 0.8.3

This change uses runtime masks and leaves all source PNGs unchanged.

`src/material-masks.js` defines normalized source-cell anatomy for idle, running,
backward movement, jumping, rolling and combat poses. Each atlas maps its frames
to these pose descriptions. Trouser masks follow hip/knee/ankle segments; footwear
masks follow ankle/toe segments. The jacket region follows the upper body and ends
at a waist plane that rotates with the pose. This prevents red trouser trim from
being classified as jacket fabric. Source alpha and fabric colour constraints
further restrict these regions.

Protected geometry covers the face, cyberarm in the inventory stance and katana
paths, including sections crossing the trousers. Warm skin colours and bright
metal pixels are excluded. Head gear changes only the small eye-implant region;
cyan collar lighting and metal reflections remain untouched. Arm-only atlas cells
have their own shoulder/sleeve region and never receive leg or foot materials.

`src/raster.js` caches a material-ID mask per source atlas. Jacket midtone
normalisation is calculated only from the jacket mask. Trouser and footwear
tinting blends chroma while preserving luminance instead of multiplying bright
pixels by an arbitrary exposure factor. Cloth folds, boot hardware and rim light
retain their shading.

When adding or changing poses, update the normalized anatomy and protected weapon
paths alongside the art registration. Existing masks are tailored to these atlases.

Validation:

- `tests/materials.test.js`: protected anatomy and blades, raised/upside-down
  footwear, separation of jacket/trouser trim and preservation of highlight values.
- `scripts/browser-check.mjs`: actual rendered pixels of the katana, face,
  cyberarm and collar stay unchanged when their unrelated equipment slots change.
- `artifacts/night-city-clothing-masks.png`: six columns (default, jacket,
  trousers, boots, head, all) across six animation poses.
