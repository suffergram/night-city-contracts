# Independent firearm scale and consistent sleeves / 0.8.2

Built-in `image_gen.imagegen` edits with `transparent_background: true`.
Final project assets:

- `characters/mercenary-aim-body-hands-v1.png`: edit of `mercenary-aim-rig-v1.png`.
- `characters/mercenary-aim-hands-extremes-v1.png`: edit of `mercenary-aim-extremes-v2.png`.

Sources are retained unchanged as RGBA PNGs. Accessories were removed from the hand layers,
keeping the body poses and shoulder/hand registration. The existing 6×6 mappings remain active.

## Composition

The locomotion body, weapon and hands are three separate layers. All aim angles use the same
firearm cutout from `characters/weapons-v1.png`. `AIM_GUNS` in `src/aim.js` fixes weapon width,
aspect ratio, grip and barrel anchors per weapon, independently of sleeve size. The firearm
is positioned at the hand grip, rotated to the aim angle, then overlapped by the hand layer.
The visible muzzle and projectile origin share the firearm transform.

## Materials

Cloth tinting uses a shared jacket midtone and per-cell source-exposure normalisation.
The default jacket is also normalised; it no longer retains unrelated source-atlas colours.
Painted folds, highlights and texture remain visible. Arm cells never receive helmet, leg
or boot materials. Weapon cutouts bypass clothing recolouring entirely.

## Validation

`tests/aim.test.js` covers invariant firearm dimensions across all angles, weapon slots,
facing directions, airborne movement and recoil. Browser checks compare body/sleeve
midtone samples, verify arm independence from head/leg/foot gear and check real input.

Review captures:

- `../artifacts/night-city-equipment-aim.png`: three jacket colours at seven aim angles.
- `../artifacts/night-city-aim-gallery.png`: all angles and movement contexts.

## Final prompts (verbatim)

### Ordinary body and empty hands

```text
Use case: precise-object-edit. This is a technical 2D videogame sprite-layer separation task, no action scene. Rows1-4 show character bodies: preserve those24 cells unchanged. Only rows5-6 show modular jacket sleeves, mechanical forearms and gloved hands: make these12 hands empty while retaining their finger poses. Omit all held accessories from these hand cells, including the prop's handle, tubes, stock, magazine and trigger parts, leaving transparent empty space around the hands. Retain ONLY the existing fully clothed shoulder caps, sleeves, mechanical forearms and intact hands as isolated reusable animation components. No exposed tissue, no injuries, no extra elements. CRITICAL: preserve exact input square canvas, six columns by six rows, all existing jacket/hand pixel positions, anatomical poses, scale and registration. No resizing, shifting, rotating, restyling or changing clothing colors. Preserve actual transparent RGBA background and detailed painted materials. No grid lines, text, shadows or background. This layer will be combined with separately rendered accessories by the game.
```

### Bent-elbow empty hands

```text
Use case: precise-object-edit. This is a technical 2D videogame sprite-layer separation task, no action scene. All36 cells show modular jacket sleeves, mechanical forearms and gloved hands. Make every hand empty while preserving its curled finger pose. Omit all held accessories from these hand cells, including the prop's handle, tubes, stock, magazine and trigger parts, leaving transparent empty space around the hands. Retain ONLY the existing fully clothed shoulder caps, sleeves, mechanical forearms and intact hands as isolated reusable animation components. No exposed tissue, no injuries, no extra elements. CRITICAL: preserve exact input square canvas, six columns by six rows, all existing jacket/hand pixel positions, anatomical poses, scale and registration. No resizing, shifting, rotating, restyling or changing clothing colors. Preserve actual transparent RGBA background and detailed painted materials. No grid lines, text, shadows or background. This layer will be combined with separately rendered accessories by the game.
```

