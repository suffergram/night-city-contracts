# Мегабашня: архитектурные ассеты v2

## Конструкция

Активная версия использует `towerArchitecture`: 11 этажей, ширина 1420, шаг перекрытий 144. На каждом этаже четыре стыкующихся жилых/сервисных секции по 280 единиц и лестничное ядро шириной 300. Серые, охристые и исходные жилые стены чередуются по фиксированной композиции; на общих этажах есть сервисные секции. Пространство лестничного ядра закрыто техническими стенами.

`tower-atrium-v1.png` используется только как художественный референс, в игровом кадре не рисуется. Нет невидимых этажей поверх иллюстрации и переходов по E вместо лестниц. Стены, перекрытия и лестницы — отдельные растровые ассеты, каждый в своём равномерном масштабе. Парапет и лестница рисуются перед персонажами; рисунок стен — за ними.

У лестницы измерены непрозрачные границы 1587×890 и нормализованные точки нижней/верхней площадки (.087,.935)/(.925,.147). По этим же точкам вычисляются масштаб, длина пробега и десять коллизионных ступеней каждого марша. Марши чередуют направление и проходят через реальные отверстия в верхних площадках. Растровые перекрытия обрезаются по тем же отверстиям, без сжатия отдельных фрагментов. Это одна сетка архитектуры, физики и маршрутов.

## Графика и живость

Есть три жилых варианта, общие сервисы и техническое ядро, отдельный материал бетонного перекрытия/закрытого парапета и бетонный лестничный марш. У жилых секций сохранён масштаб дверей; грязь, тонкие провода, почтовые ящики, плакаты, шторы и трубы являются частью рисунка. Небольшие кондиционеры и бельё закреплены на перекрытиях; огромные отдельные стояки и пучки кабелей не используются.

У стен есть выключенная и освещённая версии. Положительная разница в размеченных лампах и окнах добавляется отдельно с индивидуальными режимами света. Пар и пыль дозированы; нет цветной заливки целого стекла или бетонного блока.

## Проверка результата

Просмотрен собранный кадр в настоящем браузерном рендерере: [tower-rebuild-review.png](../artifacts/tower-rebuild-review.png). Браузер не сообщил исключений. Для всех 10 маршей проверен подъём актёра существующей физикой с соответствующим stairId: все достигли верхней площадки. Полный набор автоматических тестов не запускался. Существующие проверки геометрии обновлены под фиксированную архитектуру с настоящими маршами.

## Новые ассеты и промпты

Использован встроенный `image_gen`, навык imagegen. Прозрачность сохранена. Исходные версии не перезаписаны.

### housing-grey

[tower-housing-grey-v2.png](environment/tower-housing-grey-v2.png)

Edit target: `assets/environment/tower-residential-v1.png`; сохранялись геометрия дверей, окна и рамка.

```text
Edit the supplied TWO-DOOR one-storey wall module for a 2D playable megatower. Preserve EXACT geometry, canvas, transparent silhouette, door sizes/positions, window position, ceiling beam, base level and side pillars. Repaint as a different inhabited residential bay: heavily weathered grey concrete, faded sage and small remaining ochre paint, additional small air conditioning vent, tangled narrow cables attached neatly to wall, small worn resident notices and patches. Doors darker sage with different dents, dirty curtains in existing central window. Rich realistic painted bitmap detail, low saturation and unified natural warm concrete materials like H10 atrium in Cyberpunk 2077. ALL lights and window interior OFF. Do not brighten globally; NO new balconies, floors, foreground pipes, no large objects or structural changes, no people.
```

### housing-ochre

[tower-housing-ochre-v2.png](environment/tower-housing-ochre-v2.png)

Edit target: `assets/environment/tower-residential-v1.png`; сохранялись геометрия дверей, окна и рамка.

```text
Edit the supplied TWO-DOOR one-storey wall module for a 2D playable megatower. Preserve EXACT canvas, geometry, transparent silhouette, two door positions and sizes, central window, ceiling slab and pillars. Create a third lived-in bay: washed-out ochre concrete with large dark damp-age stains (dry surface), peeling paint, old patched posters, small mailbox cluster, thin wire bundles, one folded towel hanging INSIDE the existing central window. Doors charcoal grey. Detailed realistic painted game bitmap, subdued and dirty rather than saturated yellow. ALL lights and windows OFF. No new structures or large foreground objects; no people, no stairs, no railings. Straight orthographic elevation matching the supplied image.
```

### slab

[tower-slab-v2.png](environment/tower-slab-v2.png)

```text
Generate ONE isolated horizontal architectural game asset: the FRONT ELEVATION of a heavy cast-concrete balcony parapet and the floor slab immediately beneath it, as one continuous strip. Inspired by the worn inhabited H10 megatower galleries in Cyberpunk 2077. Very wide 6:1 silhouette, straight-on orthographic, absolutely NO perspective/depth vanishing, no 3D isometric ends. Opaque rectangular material only. The top 60% is a closed waist-high grey-sage concrete parapet with an off-white rounded coping along the TOP. At 60% height an inconspicuous horizontal seam is the WALKING FLOOR HEIGHT behind the parapet. The bottom 40% is the thick load-bearing concrete slab fascia. Weathered concrete aggregate, soot streaks, chipped corners, patch repairs, thin muted ochre numberless paint stripe, occasional very thin electrical conduit attached flush. NO open railings, no dark horizontal transparent slots, no repeated metal bands, no lamps, no text, no pipes protruding. Straight vertical left and right edges designed to join seamlessly. Realistic highly detailed painted bitmap. Neutral low-contrast ambient light, no neon, no cast shadow. Transparent background outside the simple strip.
```

### stairs

[tower-stairs-v2.png](environment/tower-stairs-v2.png)

```text
Generate ONE isolated modular concrete staircase for a side-view 2D platformer in a weathered inhabited cyberpunk megatower. Orthographic SIDE ELEVATION, rises LEFT TO RIGHT. Exactly TEN equal stairs, run 28 game units, rise 16.8 game units: total horizontal run 280, total vertical rise168, ratio 5:3. A heavy rough concrete slab follows beneath the stairs with constant thickness 18. A CLOSED solid concrete parapet runs along the FRONT side, 32 units above the walking treads, hiding their fronts below the coping. One narrow grey coping follows the slope. Bottom landing on LEFT at floor height0, TOP landing on RIGHT at height168. Small flat landings extend 18 units at each end. No extra stair flights or second return, no room wall, no pillars, no ground, no square filled triangle underneath; open transparent space UNDER the diagonal slab. No metal rails. Grey-sage aged concrete, realistic dirty aggregate texture, chipped edges and stains, muted warm palette matching H10 atrium. Entire object in frame on a genuinely transparent background, no shadows, no perspective. The staircase and front parapet are one carefully proportioned asset, with clear upper and lower landings.
```

### Световые версии

- [tower-housing-grey-lit-v2.png](environment/tower-housing-grey-lit-v2.png), edit target — соответствующий новый базовый вариант.
- [tower-housing-ochre-lit-v2.png](environment/tower-housing-ochre-lit-v2.png), edit target — соответствующий новый базовый вариант.

```text
Switch ON the built-in fluorescent lamps and the central curtained room window of this exact residential game wall module. Preserve the exact canvas, silhouette, all doors, frames, cracks, cables and pixel geometry. Only a registered lighting state: warm-white lamps with modest nearby spill on concrete, naturally warm-lit curtains behind the existing glass. Keep metal doors dark. No flat glowing rectangles, no new props, no people, no architecture changes, no exterior bloom or global exposure change. Transparent background retained.
```
