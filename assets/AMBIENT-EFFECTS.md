# Ambient effects

Effects in `src/ambient.js` use absolute game time and stable world coordinates.
They pause with the game, do not consume gameplay RNG, and allocate no persistent
particle simulations. Glow stamps are cached; dust/traffic are generated only for
visible horizontal cells. Effects are behind actors and combat feedback.

- City: small flying traffic between far and middle parallax layers, animated
  scan bands on the new metropolitan billboards, existing independent neon shimmer.
  Scanning uses cached masks of the artwork's actual cyan/red/magenta emission;
  neutral walls and warm windows stay untouched instead of receiving a flat overlay.
- Hub: scan bands on shop signs, existing lamp dust/cones and dry airborne dust.
- Industrial: occasional electrical faults on machinery, vent steam and dry dust.
- Port: pulsing amber container beacons, distant haze and a more visible moving
  foreground mist band, clipped above the ground and rendered behind characters.
- Market: denser normal-blend cooking steam from the pot and bowls, visible warm
  awning bulbs and counter light pools, animated tech
  screens, plus either district or metropolitan background effects.
- Megablock: dust on each floor, maintenance ventilation/faults, scanning door
  indicators and existing wall-light cones. Outdoor traffic is excluded indoors.

No rain, puddles or wet street reflections are added. Electrical faults are small,
brief bursts rather than full-screen flashes; screen overlays are clipped to signs.

`npm test` checks deterministic, bounded traffic/dust and sparse local spark bursts.
`node scripts/browser-check.mjs --environment-review` checks paused lighting,
changing game time, backdrop consistency and stationary dry road coverage.
`--level-review` renders all location families, including both market variants.
