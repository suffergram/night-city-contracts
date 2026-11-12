# Мегабашня — вертикальный жилой атриум

## Текущая версия: согласованные архитектурные ассеты

Активная сборка описана в [MEGATOWER-V2.md](MEGATOWER-V2.md): настоящие бетонные лестничные марши, стыкующиеся стены и отдельные перекрытия/парапеты. Иллюстрация атриума служит только референсом и не является изображением игрового уровня. Ниже сохранён архив первого подхода и исходных промптов.

## Архив предыдущего подхода

## Референсы

- [Krzysztof Olborski — Megabuilding / Cyberpunk 2077](https://krzysztofolborski.artstation.com/projects/WmWPDQ): модульная архитектура и внутренний ствол.
- [Albertus Januardy — Megabuilding 10](https://albertusj.artstation.com/projects/483zkY): внутренние жилые и общие зоны H10.
- [Marcin Stępień — Megabuilding Lighting](https://mstepien.artstation.com/projects/OoB4yg): тёплое локальное освещение в холодном бетонном атриуме.

Это новая адаптация для бокового 2D вида, не извлечённые ресурсы оригинальной игры.

## Планировка и масштаб

Локация `megablock` сохраняет внутренний идентификатор для совместимости, но называется «Мегабашня». Ширина 1120–1320 игровых единиц, 8–10 ярусов с шагом 168–180. Чередуются разорванные жилые галереи и сплошные общие переходы. Основные лестницы меняют сторону от этажа к этажу; параллельно проложены запасные технические лестницы. Подъём завершается лифтом на верхнем ярусе.

Растровые жилые, сервисные и технические модули имеют высоту 132; ширина считается по измеренным непрозрачным границам без растяжения по осям. Двери соразмерны герою. Межэтажные перекрытия и открытые перила рисуются отдельно, чтобы совпадать с коллизией и проёмами лестниц. Старые отдельные квартирные двери и сплошной повторяющийся стеновой задник заменены.

## Свет и живость

Передний план обновлён по атриуму: толстые бетонные перекрытия, закрытые парапеты галерей и лестниц. Они рисуются после персонажей, которые проходят за ними; проёмы стационарных и вертикальных лестниц сохраняются. Бетонная фактура взята из нарисованного жилого модуля и кэшируется, не создавая нового растрового ресурса.

Перед парапетами закреплены кондиционеры, бельё, трубы и кабели. По краям башни проходят крупные стояки высотой почти три этажа, а через 72% ширины атриума провисают большие кабельные пучки. Декор привязан к конструкции, сохраняет пропорции и отсекается за границами видимого кадра. Источник: [tower-foreground-v1.png](environment/tower-foreground-v1.png), встроенный imagegen, 2×2 спрайта с прозрачностью.

Промпт переднего плана:

```text
A 2x2 sprite atlas, exactly FOUR isolated foreground props for a side-view 2D cyberpunk megatower interior matching realistic weathered concrete Cyberpunk 2077 H10 atrium art. All straight-on orthographic side elevation, dark dusty sage/grey/mustard, dry realistic painterly bitmap detail. Equal grid quadrants, transparent background, generous separate padding, no contact between cells, no grid lines. TOP LEFT: one rectangular old air-conditioning condenser with visible circular fan grille, rust and mounting brackets, flat facing viewer. TOP RIGHT: a vertical group of three thick weathered utility pipes with joints and wall clamps, open ends at top and bottom, flat facing viewer. BOTTOM LEFT: a short clothesline with five varied everyday garments/towels hanging naturally, desaturated faded red, ochre, grey and teal fabric, no people or bodies, side-on. BOTTOM RIGHT: a bundle of sagging black insulated cables with connector boxes at the two endpoints, loose hanging curves across a wide horizontal span. No buildings, floors, walls, ground shadows, lamps, neon, UI, text, rain. Opaque prop pixels only, real transparent alpha elsewhere. These will be mounted in front of balcony parapets: believable proportions and natural hanging gravity.
```

Базовые модули имеют выключенный свет. Для каждого создана световая версия. Из пары извлекается положительная RGB-разница внутри размеченных окон, приборов и областей ламп, как у отелей. Свечение, пыль и частицы синхронизированы с теми же режимами. Есть индивидуально работающие/неработающие лампы, мерцание, режим с отключением и запуском, свет комнат, индикаторы, пар вентиляции, слабое движение вентиляционных лопастей. Глубокий атриум прокручивается медленнее переднего плана; в нём виден движущийся огонёк сервисного подъёмника и рассеянный пыльный свет.

Ресурсы загружаются только при посещении мегабашни; её пиксельные световые слои подготавливаются за загрузочным экраном. Другие локации не используют новый задник.

## Создание ассетов

Использован встроенный инструмент `image_gen`, навык imagegen. Исходники сохранены отдельно, прозрачность модулей сохранена.

### atrium

[PNG](environment/tower-atrium-v1.png)

```text
A tall distant BACKGROUND for a 2D side scrolling cutaway game inside a vast inhabited brutalist megatower inspired by Cyberpunk 2077 Megabuilding H10. Portrait 2:3 composition. Deep enclosed internal atrium seen straight towards its far opposite wall, many stacked residential galleries receding in depth with thick weathered concrete beams, mustard yellow numbered panels, sage metal doors, dense balconies, exposed utility risers, hanging cables, giant ventilation plant below and roof skylight far above. Small distant warm apartment windows and teal wayfinding; dark teal-grey shadows, subdued amber haze. The far side should feel at least thirty meters away: NO foreground walkway, no close objects, no people, no outside city skyline. Rich painterly realistic gritty bitmap art, dry concrete, not wet. No UI. This is a backdrop ONLY, not playable foreground. Distribute interest throughout the full height; no focal centered door. Seamless left/right borders preferred, details subtle enough behind play.
```

### residential

[PNG](environment/tower-residential-v1.png)

```text
ONE foreground modular SINGLE STOREY residential corridor wall segment INSIDE a massive brutalist cyberpunk megatower, inspired by H10 in Cyberpunk 2077. Strict straight-on orthographic SIDE VIEW elevation, wide 2.4:1 canvas. Two recessed sage metal apartment doors, each standard human door 2m high, central narrow curtained apartment window, mustard yellow concrete panels and large faded 07 stencil, battered grey concrete uprights, exposed conduits, mail slots, small rent-status reader next to door, compact ceiling strip fixtures. Full floor-to-ceiling ONE storey only. Bottom flat concrete threshold; NO balcony rail in front, NO projecting floor, NO stairs, NO ladder, NO rooftop machinery, no sky, no people. Flush vertical side edges so segments join side by side. ALL lamps, window interiors, signs and readers SWITCHED OFF, clearly dark bulbs/glass. Detailed painterly realistic worn game art matching cyberpunk mercenary sprites. Dry matte concrete, muted amber/sage/graphite palette. Complete isolated rectangular wall module on transparent background with minimal transparent margin.
```

### services

[PNG](environment/tower-services-v1.png)

```text
ONE foreground modular SINGLE STOREY communal service corridor wall segment INSIDE a massive brutalist cyberpunk megatower inspired by Cyberpunk 2077 H10. Strict straight-on orthographic side-view elevation, wide 2.4:1 canvas, same human scale everywhere. One recessed tiny noodle counter with countertop and rice cooker, one closed self-service laundry vitrine with washing machines, a central narrow utility entrance. Integrated concrete frontage under mustard yellow fascia and old dark magenta/teal sign lettering. Small wall lamps and fluorescent ceiling strips, exposed pipes and vents. Full floor-to-ceiling ONE storey only. Flat narrow concrete threshold; NO balcony railing, NO projecting floor, NO stairs/ladders, NO rooftop machinery, no people/vehicles. Flush straight side walls so modules join. All lamps, neon, machines, signs and INTERIOR LIGHTS OFF; unlit textured glass preserves shelves and machines. Detailed gritty realistic painterly game bitmap, dry matte concrete, sage/mustard/graphite. Isolated complete rectangular module with transparent background and minimal margin.
```

### utility

[PNG](environment/tower-utility-v1.png)

```text
ONE foreground modular SINGLE STOREY maintenance and lift-services corridor wall segment inside a massive inhabited brutalist cyberpunk megatower inspired by Cyberpunk 2077 H10. Strict straight-on orthographic side-view elevation, wide 2.4:1 canvas. Huge caged ventilation fan on left, grey sealed electrical cabinets in middle, right a recessed standard human-size technical door with yellow warning paint, small diagnostic screen, vertical insulated pipes and overhead ducts, old mustard concrete numbered panels, small caged wall lamps. Full floor-to-ceiling ONE storey only. Narrow flat bottom threshold; NO balcony railing, NO projecting floor, NO stairs/ladders, NO rooftop machinery, no people. Flush sidewalls for adjacency. All lamps, screens and illuminated signs OFF. Dry weathered concrete, realistic painterly bitmap art, graphite/sage/mustard palette. Isolated complete rectangular module on transparent background, minimal margin.
```

### Световые версии

- [tower-residential-lit-v1.png](environment/tower-residential-lit-v1.png), редактирование соответствующего базового PNG.
- [tower-services-lit-v1.png](environment/tower-services-lit-v1.png), редактирование соответствующего базового PNG.
- [tower-utility-lit-v1.png](environment/tower-utility-lit-v1.png), редактирование соответствующего базового PNG.

Общий промпт для трёх световых версий:

```text
Edit this ONE-STOREY game wall module ONLY to turn on its real built-in lighting. Preserve EXACT canvas, transparent background, opaque silhouette, every frame, door, window and wall detail in the same position. A registered ON state, NOT a redesign. Illuminate lamps naturally with warm-white fluorescent lenses and small pools of light on nearby concrete. If there is a curtained window, light the curtains softly from inside, no flat glowing glass rectangle. If there are noodle/laundry storefronts, light the actual interior with warm ceiling lamps so shelves, cooker, washing machines and depth are visible behind existing glass. Illuminate existing sign LETTERS only in muted teal/magenta; no luminous rectangular signboards, keep yellow stencilled fascia nonluminous. Technical diagnostic screens may be lit cyan. No new exterior objects or people, no added floors, no stairs or railings, no fog. Keep dark/weathered exterior concrete unchanged except local lamp spill. Preserve alpha transparency.
```

Изображения просмотрены вручную, измерены границы непрозрачной части. Автоматические тесты и браузерные проверки не запускались по прежней просьбе пользователя; существующая проверка старых настенных ламп обновлена под новую планировку.
