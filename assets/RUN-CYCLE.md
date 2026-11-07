# Whole-frame forward run redraw

Final assets:
- `characters/mercenary-run-redraw-v2.png`: row 3, frames 12–17, whole katana figures.
- `characters/mercenary-aim-run-redraw-v2.png`: row 3, first four armless run poses, unchanged.
- `characters/mercenary-aim-run-redraw-v3.png`: row 3, sixth armless run pose.
- `characters/mercenary-aim-run-contact-v4.png`: standalone fifth armless run pose.

Built-in `image_gen.imagegen` edited `mercenary-actions-v1.png` directly. Its successful
third-row gait is the anatomical reference. The initial attempts to edit the old hero
and aim atlases repeated the old poses and were discarded. Only the selected edits
are used in the game. Original atlases remain unchanged.

The fifth pose was redrawn separately to make the near/right thigh connect to the
folded recovery leg, while the far/left leg supports the body. It is packed as a
whole image into an otherwise empty atlas slot at load time. Poses 1–4 continue to
load from v2; pose 6 loads from v3. No new generated versions of poses 1–4 are used.
The standalone image is uniformly reduced to93% about the pelvis/ground anchor to
match the neighbouring figures, and its shoulder socket follows the packed pose.

The running renderer draws ONE whole sprite from head through pelvis to shoes.
There are no waist crops, pasted leg layers, body shifts, gradients or transferred
knee patches. The armless body retains the existing independently aimed hands and
fixed-size firearm artwork. Six source phases share the movement clock, so firing
and weapon changes preserve the step. Backward, airborne and other actions use
their original whole-body artwork.

The empty rightmost10% of each new atlas source cell is excluded from drawing to discard
stray sword tips spilling in from the next cell. This does not resize the figure.

`src/aim.js` registers the shoulder sockets of the six new armless bodies. Equipment
materials use existing pose-aware masks; source body parts are not rearranged.
`node scripts/browser-check.mjs --run-review` produces
`artifacts/night-city-source-run-comparison.png`: successful reference / current
aimed run / current katana, six phases in both directions. Pixel comparison verifies
that the rendered lower body is the selected whole-body image; it does not establish
subjective animation quality.

## Final katana prompt

```text
Edit this supplied 6x6 transparent sprite atlas. The THIRD ROW (six running pistol figures) is the master animation. Its six pelvis-and-leg drawings are already CORRECT and MUST STAY EXACTLY THE SAME six different drawings, in the same columns, with absolutely no changes to hips, thighs, leg overlaps, leg shading, knees, shoes or lower-body silhouettes.
Make TWO new complete-character rows:
1. In THIRD ROW, change only the arms, hands and held pistol of each running figure: replace the pistol pose with natural running arms, the near chrome hand holding a slim Japanese katana trailing diagonally down and back to the LEFT, like a cyberpunk street samurai. Redraw the connected jacket/shoulders/arms cleanly in the original detailed painted style, keep the ORIGINAL THIRD-ROW HEADS, TORSOS AND ESPECIALLY PELVIS AND LEGS unchanged. No slash effects, no fire, no pistol, no glowing trails.
2. Replace FOURTH ROW with six exact copies of the corresponding THIRD-ROW ORIGINAL RUNNING FIGURES, same heads, torso lean, hip/leg poses, source scale and positions, BUT remove BOTH arms, all hands, held pistol and muzzle flashes. Repaint the now-visible torso/shoulders continuously so each figure is one clean seamless full body from head through waist to shoes. This row is for a game that attaches arms separately. It must have EXACTLY the ORIGINAL THIRD-ROW running leg sequence, NOT the original fourth-row backward leg sequence.
Do not generate new leg anatomy. Preserve those six successful ORIGINAL THIRD-ROW lower bodies including their original shading and distinct thigh/hip occlusion. No waist splice, no detached fragments, no diagnostic colours. Keep all other rows as supplied. Exact 6-column 6-row square grid, original sizes and cell registration, all figures facing RIGHT, fully within cells. Original red bomber jacket/cyan collar/chrome forearm/graphite trousers/boots and adult mercenary face. True transparent background.
```

## Final armless-body prompt

```text
Precise edit of this supplied transparent 6x6 sprite atlas. In ONLY THE THIRD ROW, remove BOTH ARMS, ALL HANDS, PISTOLS AND MUZZLE FLASHES from each of the six FORWARD-RUNNING figures. Reconstruct the small jacket/chest/shoulder areas exposed by the removed arms so these six figures are complete seamless armless bodies. Keep head, torso lean, jacket hem, pelvis, and EVERY PIXEL OF BOTH LEGS AND SHOES in this THIRD ROW exactly as supplied. The third-row six running poses and their original anatomical leg overlaps are correct; do NOT change them, do not redraw them into another gait, do not borrow legs from row four. No new poses. No moving the figures. The only modifications are removal of arms and guns and clean reconstruction of their previously covered torso areas. Preserve exact overall body size, position and source 6x6 grid. All heads face RIGHT. Original detailed painted cyberpunk mercenary in dark red bomber, cyan collar, graphite trousers, heavy boots. No detached fragments. Leave all other rows untouched. True transparent RGBA background, no coloured halo or effects.
```


## Fifth-frame correction prompt (built-in image_gen)

```text
Create ONE corrected square transparent sprite FRAME, not an atlas. Use the supplied atlas as character/style reference. The reference is a 6x6 sheet; we need a replacement for THIRD ROW, FIFTH COLUMN (armless forward run, mid-support). The existing fifth column has the WRONG thigh occlusion. The FOURTH COLUMN of THIRD ROW shows which thigh belongs to the back/right leg correctly; use that anatomical attachment as your reference, advancing it into mid-support.
ONE figure, facing RIGHT, same red bomber/cyan collar/undercut/graphite tactical trousers/boots, NO ARMS OR HANDS OR WEAPONS. Head, torso and pelvis drawn together seamlessly. Human realistic painted game sprite.
EXACT REQUIRED LEGS: LEFT leg is FAR and SUPPORTING on the ground, reaching down/front RIGHT. Its knee is in front around image x.58 y.74 and sole x.64 y.97; this leg's upper thigh emerges from the HIDDEN far side of the pelvis, and is OCCLUDED at its root by the right buttock/thigh. RIGHT leg is NEAR and FOLDED BACK toward LEFT, heel up behind the body around x.19 y.76. The right leg's full OUTSIDE THIGH is visible on the FOREGROUND surface from near/right hip around x.44 y.54 diagonally BACK/LEFT to knee x.29 y.69; then shin folds BACK/UP to the left heel. The raised/bent recovery leg BEHIND the body is the near leg, NOT the forward supporting leg. Draw the right-side thigh holster/pouch on that BACK/LEFT foreground thigh so the complete hip->thigh->knee connection is visibly correct. The foreground right thigh must pass IN FRONT OF the root of the far supporting left thigh at the crotch. Do not draw the supporting front thigh as the large outer foreground thigh. This is actual anatomical depth and pelvis geometry, not a recolour.
Keep the body scale/registration of one original cell: square frame, head centre x.64 y.15, hips x.44 y.54, ground sole baseline y.98, full character contained inside square, no cast shadow or effects. Dynamic running, far supporting knee bent under load, near heel recovering high behind. Copy the reference's detail and materials rather than making a new outfit. Truly transparent RGBA background. Output only this ONE corrected complete armless character, no grid, text or labels.
```

## Sixth-frame correction prompt (built-in image_gen)

```text
Precise local sprite edit. The provided image is a 6x6 sprite atlas. Edit ONLY TWO CELLS: THIRD ROW, FIFTH COLUMN and THIRD ROW, SIXTH COLUMN (zero-based frames 16 and 17). Keep the first four third-row cells and every other cell unchanged.
These two armless forward-run poses have their anatomical legs reversed. Fix actual hip/thigh connections and occlusion, not colours or kneepad labels.
Third row column 5: the FAR/LEFT leg is the forward ground-support leg. It must emerge from BEHIND the pelvis and be partly occluded by the NEAR/RIGHT thigh. The NEAR/RIGHT leg is folded back LEFT with its heel recovering upward behind the body, its whole visible outside thigh attached to the near/right side of the pelvis. The near thigh/side holster must travel with that BACKWARD recovering right leg, not remain on the forward support thigh.
Third row column 6: the NEAR/RIGHT thigh drives FORWARD to the RIGHT with a raised knee, clearly in front of the pelvis and far leg; the FAR/LEFT leg trails down/back LEFT in toe-off. The near/right hip, thigh panels and side holster must connect to that raised forward right knee. Do not keep the near/right thigh pointing backward while calling the forward leg right.
Redraw both legs and the small pelvis transition in these TWO cells as real coherent anatomy, with appropriate overlap where thighs cross. Keep original six-frame run's dynamic bent-knee running, matching realistic limb lengths, graphite trousers, seam details and boots. Preserve heads, torso/jacket, shoulder sockets, lack of arms, source scale and original foot baseline. No arms, weapons, effects, diagnostic colours or waist splice. All full sprites face RIGHT. Same exact 6x6 square grid, no gutters or labels, true transparent RGBA background.
```
