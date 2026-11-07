# Character artwork / 0.4

Generated with the built-in `image_gen.imagegen` tool, not the CLI. All four calls requested `transparent_background: true`. No Cyberpunk 2077 game files were imported. The images are original illustrations guided by its street-mercenary setting.

## Saved assets

| File | Purpose |
| --- | --- |
| `mercenary-v1.png` | Initial hero generation; retained as a reference, not loaded by the game |
| `mercenary-clean-v1.png` | Final hero atlas, 1254 × 1254 RGBA, loaded by the game |
| `enemies-v1.png` | Initial enemy generation; retained as a reference, not loaded by the game |
| `enemies-clean-v1.png` | Final enemy atlas, 1254 × 1254 RGBA, loaded by the game |

Requested canvas size was 1536 × 1536; the tool delivered 1254 × 1254. The renderer reads actual dimensions and uses six equal rows and columns (209 × 209 source cells), rather than assuming 256 px cells. Source PNGs are preserved unchanged. Runtime colour variants are rendered into bounded offscreen Canvas caches.

## Frame layout

Version 0.8 adds the articulated ranged-aim atlas `mercenary-aim-rig-v1.png`.
See [ART-0.8.md](../ART-0.8.md) for its generation prompt, frame layout and runtime registration.
Version 0.8.1 adds bent-elbow upper/lower poses in `mercenary-aim-extremes-v2.png`;
see [ART-0.8.1.md](../ART-0.8.1.md).
Version 0.8.2 separates empty hand layers from firearms: `mercenary-aim-body-hands-v1.png`
and `mercenary-aim-hands-extremes-v1.png`. Current composition and prompts:
[ART-0.8.2.md](../ART-0.8.2.md).

Hero, left to right, six frames in each row:

1. Idle / breathing.
2. Running cycle.
3. Jump anticipation, ascent, apex, descent and landing.
4. Forward dodge roll, tuck, rotation and recovery.
5. Katana preparation, windup, slash and recovery.
6. Pistol lift, aim, muzzle flash, recoil, re-aim and lower.

Enemy rows 1–2: gunner. Rows 3–4: katana runner. Rows 5–6: heavy enforcer. Each pair provides twelve frames for idle, run, jump, evade/guard and attacks. Exact runtime mappings are in `src/animation.js`. Block reuses an appropriate authored pose. Version 0.7 adds separate reload, clean airborne-ready and backward katana atlases: `mercenary-utility-v2.png` and `mercenary-longgun-utility-v2.png`. Their frame maps and generation specifications are in [ART-0.7.md](../ART-0.7.md).

## Prompt 1 — Hero generation

```text
Use case: stylized-concept. Asset type: production-ready transparent 2D side-scroller character sprite atlas. Create ONE square 1536x1536 RGBA image arranged in an EXACT uniform 6 columns by 6 rows grid of 256x256 cells, with absolutely NO gutters, NO borders, NO text. Each cell contains one complete isolated animation frame centered at x=128 with feet/bottom anchor y=232, full silhouette and weapon fully inside its own cell, generous transparent padding, identical body scale and camera in every frame. All 36 frames show THE SAME adult male Night City cyberpunk mercenary facing RIGHT in three-quarter SIDE VIEW: handsome tired scarred face, short swept-back black undercut hair, small cyan Kiroshi eye implant, black and dark oxblood-red cropped armored SAMURAI-style biker bomber with raised luminous cyan collar, orange inner lining, layered graphite tactical trousers, thigh pistol holster, heavy sneakers, practical chrome cybernetic forearm, slim curved Japanese katana with clear tsuba guard, wrapped handle and black scabbard at back. Cyberpunk 2077 street-samurai aesthetic. Rich detailed hand-painted raster/realistic illustrated game art, realistic adult human proportions (7.5 heads tall), detailed folds, skin, seams, metal and wear, subtle cool cyan rim light and warm magenta accents, readable silhouette, no vector look, no blocky toy proportions, not pixel art. No scenery, no floor, no cast ground shadow; genuinely transparent background. Pose specification by row, left to right: ROW 1: six idle breathing frames, katana low ready, near-identical grounded stance. ROW 2: SIX DISTINCT sequential RUN CYCLE frames, alternating extended legs and bent passing legs, arms counter-swinging, visible forward lean. ROW 3: SIX sequential JUMP frames: crouch anticipation, takeoff, rising with knees bent, apex tuck, descending, crouched landing, preserve standard body scale. ROW 4: SIX sequential FORWARD DODGE ROLL frames: low crouch, tuck forward, rotate curled 90 degrees, rotate curled upside down, uncoil, recover into low stance; katana sheathed during roll. ROW 5: SIX sequential KATANA STRIKE frames: draw back, windup above shoulder, accelerating slash forward, horizontal extended cutting followthrough, low followthrough, recover. Blade entirely contained in cell. ROW 6: SIX sequential PISTOL SHOOT frames: lift pistol, aim right, bright small muzzle flash while shooting, recoil, re-aim, lower gun. Katana sheathed. IMPORTANT: grid precision, isolated cells, same detailed character identity, no overlapping cells, no panel labels, no watermark. This sheet will be sliced mathematically on equal grid boundaries. Make beautiful coherent production sprite art, not a concept contact sheet.
```

## Prompt 2 — Final hero cutout

Edit target: `mercenary-v1.png`.

```text
Use case: background-extraction. Edit target: the supplied 6x6 cyberpunk mercenary animation sprite atlas. Preserve ALL 36 character drawings, each pose, the exact same 6 by 6 grid registration, sizes and positions. Remove ONLY EVERY straight grid line, divider, gray border, gray background smear, gray shadow silhouette/halo and any non-character background pixels. Leave genuine clean transparent alpha in all empty space, including between legs and next to katana. No gray contour shadow on the outside. Preserve character interior shading and clothing detail, cyan implants, katana and muzzle flash. Do not add a checkerboard, black backdrop, outlines, any grid or cell markers. Keep the 36 unique animation frames at identical positions on the same square canvas. Production game sprite cleanup, clean transparent cutout edges, no other changes.
```

## Prompt 3 — Enemy generation

Style reference: `mercenary-v1.png`.

```text
Use case: stylized-concept. The supplied sheet is a STYLE REFERENCE ONLY: match its beautiful realistic hand-painted cyberpunk raster characters, lighting and game-art detail. Create a NEW square transparent RGBA 1536x1536 sprite atlas of ENEMIES, EXACTLY 6 columns x 6 rows in equal 256 square cells. No gutters, NO cell borders or dividers, absolutely no text, no outlines or gray halos, no backdrop, no cast ground shadows: all empty space actual transparent alpha. Each pose must be fully inside its cell. Same scale, body height around 185 pixels, bottom baseline 232 within each cell, body core horizontally centered at 128. All characters face RIGHT with strong side-view silhouette, realistic adult human proportions. Neatly separated 36 game-ready character sprites, not a concept sheet. Three distinct intimidating Night City cyberpunk mercenaries. ROWS 1 and 2: FEMALE CORPO GUNNER, angular face, short white asymmetrical hair, cybernetic magenta eyes, graphite and midnight-blue tactical armored coat, pistol, black combat pants, chrome leg braces. Row1 six poses: idle with pistol low; running contact stride; running passing stride; running opposite contact stride; steady aim pistol right; pistol firing right with tiny flash. Row2 six poses: jump rising knees bent; jump descending; low evasive sidestep; dodge crouched recovery; pistol recoil; pistol re-aim. ROWS 3 and 4: MALE CYBER-SAMURAI RUNNER, lean agile muscular man, short red mohawk, lower-face respirator, dark plum and crimson leather street armor, katana and scabbard, cybernetic arms. Row3: idle low katana; run extended legs; run passing legs; run opposite stride; katana above-head windup; extended horizontal katana slash right. Row4: jump rising; jump descending; curled forward dodge roll; crouched dodge recovery; low slash followthrough; ready katana stance. ROWS 5 and 6: HEAVY MALE MILITECH-STYLE ENFORCER, much broader armored silhouette but same height, olive graphite bulky segmented powered ballistic plates, full-face helmet with amber optical slit, reinforced exoskeleton forearms and boots, compact heavy pistol holstered. Row5: idle fists ready; heavy run contact; heavy run passing; heavy run opposite stride; big fist windup; powerful close punch right. Row6: heavy jump rising; heavy jump descending; arm guard defensive stance; heavy recovery after punch; aiming heavy pistol right; firing heavy pistol right. Maintain identity within each character's twelve cells. Fine face detail, scratched metal, tactical fabric, seams, magenta and cyan edge lights like Cyberpunk 2077. Isolated clean alpha only, no background and no graphic grid. Every frame same camera and size.
```

## Prompt 4 — Final enemy cutout

Edit target: `enemies-v1.png`.

```text
Use case: background-extraction. Edit target: this exact 6x6 cyberpunk enemy sprite sheet. Remove ALL light gray/white background and ALL cast shadows, gray halos, shadows behind characters. All empty pixels must become genuinely TRANSPARENT ALPHA, not a checkerboard painted into the image and not white/black. Preserve the detailed character pixels, faces, metal, clothes, weapons and muzzle flashes, ALL 36 poses, their exact positions and sizes in the same exact 6 columns by 6 rows grid. Do not redraw, shift, resize or add anything. Isolated production-ready transparent PNG sprite atlas, clean alpha cutout for every character, including negative spaces inside limbs, no gridlines, no outlines, no scenery.
```
