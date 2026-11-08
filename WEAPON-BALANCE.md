# Weapon balance

Saved item power remains unchanged. Damage is derived per weapon; character,
inventory and merchant panels display the resulting damage with current bonuses.
Armour and reward/drop rates are unchanged. Contract threat uses the original
equipment-power scale so this rebalance does not raise existing saves' threat.

| Starter weapon | Damage | Interval | Hard range (world px) | Full damage until |
| --- | ---: | ---: | ---: | ---: |
| Katana | 30 per hit | 0.38 s | 84 centre-to-centre | melee |
| Pistol | 20 per bullet | 0.32 s | 480 | 280 |
| Rifle | 4 per bullet | 0.13 s | 560 | 320 |
| Shotgun | 10 per pellet × 5 | 0.90 s | 250 | 90 |

These are starting weapons with their existing different item powers. At equal
item power, pistol damage is still higher than rifle damage, and katana melee DPS
exceeds rifle DPS before spread, magazines and reloads. Shotgun is strongest when
all five pellets connect nearby. Damage falls linearly after the full-damage range,
to 55% for pistol, 45% for rifle and 5% for shotgun, then projectiles expire.
Existing armour and skills apply after distance falloff at the actual hit point.

Rifle spread grows quadratically from 0.008 to 0.248 radians of total spread as
heat rises. Each shot adds 0.22 heat (maximum 1); cooling starts after a 0.22 s
pause and removes 3.5 heat per second. A full-heat rifle is accurate again after
about 0.51 s without firing. Switching weapons does not reset heat; reloading and
time spent using another weapon allow normal cooling. Short bursts remain useful.
The fire-rate perk reduces all firearms' intervals by the same proportion.

Katana animation lasts 0.26 s. Contact normally occurs after 0.095 s; backward
attacks keep their later authored contact phase, scaled to the faster animation.
The six original attack poses remain synchronized when movement changes.

Every projectile has an exact travel-distance budget. Swept collision is clipped
to that budget even on a long update, preventing hits beyond maximum range.
Player projectiles also stop at the current viewport boundary in world coordinates
(including vertical camera offset), so unseen targets beyond the screen are not
hit. Enemy bullets have a 680 px budget. Aim guides stop at weapon range.

Cursor aim is continuous. Existing authored arm poses still change with elevation,
while the weapon rotates through intermediate angles. Bullet direction is computed
from the physical muzzle to the cursor, before applying firearm spread, so the
artwork's pose sectors do not restrict firing angles.

Run `npm test` for equal-power balance, heat recovery, distance damage, exact range,
camera-bound clipping, actual shotgun shots, melee reach, skills and save coverage.
