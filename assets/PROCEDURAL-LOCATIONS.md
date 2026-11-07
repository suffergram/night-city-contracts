# Procedural contract locations

Each entry into a contract gets a fresh 32-bit seed. `generateLevel(depth, seed, kind)`
is deterministic when a seed is supplied; the optional kind is used by the review page.
Difficulty still follows player strength, with the existing enemy-stat and reward curves.

## Four location families

- `industrial`: the outdoor industrial district, irregular technical decks, vents,
  barriers and occasional higher maintenance platforms.
- `port`: cargo stacks with different heights/colours, cranes, distant water and
  ladders between container roofs.
- `market`: different food/electronics stalls, produce crates and roof routes.
  Upper rooms form two-storey trading pavilions, supported by the stalls and steel
  columns extending to the ground; elevated platforms are not loose canopy props.
- `megablock`: 3–5 residential/service tiers, random deck gaps, room modules,
  stair flights with real openings in the upper deck, and alternative ladder routes.

Width, entrance side, geometry, connections, decoration, enemy positions/roles,
cache positions/count and exit placement vary with the seed. Caches no longer have
a fixed position near the end. The generator keeps a continuous lower floor and
jumpable gaps; tall transitions have stairs or ladders. Reward/drop rates remain unchanged.

## Movement and navigation

Space jumps everywhere; W also jumps away from a ladder. Near a ladder W/S ascends/
descends, releasing both holds position, moving sideways releases the ladder, and
Space jumps off with a short reattachment delay. Stair steps can be walked in both
directions. Enemies can follow inter-floor stair/ladder routes and avoid deck edges
while patrolling. They select a route only after the player's supported floor stays
stable briefly, so jumping on the same floor does not trigger ladder pursuit.
Approaching a connection can be cancelled; traversing a stair flight keeps its
direction through the last step, with enough exit clearance for wide enemies.
A short cooldown prevents immediate reversal along the same connection.
Enemy physics accepts stair treads only for the selected flight during traversal;
chasing or patrolling on a floor passes underneath without automatic step-up.
Open stair treads allow both sides' bullets and enemy sight lines through, while
solid floors and cover still stop shots. The stair artwork uses open metal treads,
twin stringers, continuous hand/knee rails and bolted landing attachments.
The camera follows vertically in tall locations; aiming converts
cursor Y into world coordinates, and the exit interaction uses its actual floor.

A small layout map shows decks, ladders, the player and exit without exposing hidden
cache/enemy locations. It has a separate HUD panel below the biomonitor, moving to
its left on short screens to avoid combat prompts and controls. The map is hidden
in the hub. Higher exits remain locked until every enemy is defeated.

## Artwork

`environment/locations-v1.png` was created with built-in `image_gen.imagegen`:
a transparent 4x4 modular atlas. The first three rows supply port/market/interior
props, decks and ladders. Stair treads use the deck texture and match the generated
collision steps; beams and rails follow the actual flight geometry.
Outdoor lamps are anchored to the ground. Megablock has no street poles: compact
wall-mounted strip lights sit above doors on every floor with soft downward glow.
`environment/megablock-interior-v1.png` replaces the exterior-facade backdrop with
an opaque indoor wall: concrete, worn teal lower cladding, cable trays and vents.
Cached corridor bays, structural pilasters, ceiling beams and skirting follow the
floor heights and stay aligned with the room modules as the camera moves.

Interior texture prompt (built-in imagegen, 1536x1024): front orthographic flat
indoor cyberpunk megabuilding corridor wall, weathered concrete upper panels,
desaturated petrol-grey enamel lower cladding, bolted seams, maintenance hatches,
conduit channels, cable trays and ventilation grilles; detailed painted raster,
subdued diffuse light, matching horizontal edges. No exterior facade, windows,
sky, street, standing lamps, doors, people, floors, stairs, rain, text or borders.
The existing hub and dry road remain in use.

## Review

`/scripts/level-preview.html`: choose a family, regenerate, or replay a seed;
horizontal/vertical sliders expose every floor.
`node scripts/browser-check.mjs --level-review` renders all four families and
checks seed variation and the vertical view.

Tests check hundreds of seeded plans for reachable enemies, caches and exits,
plus real stair ascent/descent, ladder holding/climbing, enemy pursuit,
vertical camera movement, and shooting with vertical camera offset.

## Generation prompt

```text
Use case: stylized-concept. NEW production transparent RGBA sprite atlas of modular ENVIRONMENT PROPS for a detailed hand-painted realistic 2D side-scrolling cyberpunk platformer. Square1536x1536, EXACT4columns by4rows, uniform384px cells, no gutters or grid lines, each isolated complete prop fully inside its cell, true transparent background. Strict side view, no tilted isometric scene. Dark industrial graphite metal, weathered paint, warm amber/cyan/magenta accent lights, rich painted raster material detail matching an adult mercenary night-city game. No people, ground slabs, rain, puddles, shadow rectangles or scenery filling the transparent background. No large readable text. Cells, left-to-right:
ROW1 PORT: (1) long closed teal freight shipping container SIDE VIEW, flat horizontal walkable roof, corrugated steel; (2) stack of rugged cargo cases with small orange cargo labels, wide low composition; (3) tall dock gantry crane silhouette with cable and hook, isolated full crane, painted realistic metal; (4) dock bollard with mooring ropes and a short amber beacon post.
ROW2 MARKET: (5) neon-lit street ramen stall, deep red awning, serving counter, hanging pots, cyan/pink tiny signs, no vendor; (6) black-market electronics stall with green/cyan screens, canopy and cluttered counter, no person; (7) low market produce crates and plastic trays with sparse fruit/packaged supplies; (8) narrow weathered fabric canopy suspended between two short metal posts, string lights, overhead wires.
ROW3 MEGABUILDING: (9) single recessed apartment entrance module, scratched metal door, wall panels, a small side-lit number screen, NOT an entire building; (10) industrial maintenance-wall equipment module with pipes, vent, breaker panel and small warning lamps; (11) straight horizontal steel WALKWAY DECK beam, top surface perfectly flat, industrial worn texture, NO railing, NO support legs, modular long thin rectangular shape; (12) vertical service ladder with TWO rails and evenly spaced rungs, complete ladder, NO background wall.
ROW4 STRUCTURE: (13) industrial ventilation/exhaust unit with short curved outlet and small cyan indicator; (14) concrete traffic barrier with worn yellow edge strips; (15) full flight of industrial metal stairs ascending to the RIGHT, side view, thin rail, isolated complete stairs; (16) full flight of industrial stairs ascending to the LEFT, side view, thin rail, isolated complete stairs.
Keep crisp readable silhouettes and consistent painted game-art fidelity across every cell. Every prop has transparent padding and no clipping or spill into adjacent cells. This is a cuttable4x4 atlas, not a city illustration.
```
