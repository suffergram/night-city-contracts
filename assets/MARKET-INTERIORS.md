# Освещение помещений новых зданий

Восемь световых вариантов созданы встроенным `image_gen` с навыком imagegen. Исходные фасады не заменены: световой слой извлекается из пары исходник / освещённый вариант. Геометрия и базовый рисунок остаются у исходника.

- Исходник: [market-building-housing-a-v1.png](environment/market-building-housing-a-v1.png); световая версия: [market-building-housing-a-interior-v1.png](environment/market-building-housing-a-interior-v1.png).
- Исходник: [market-building-housing-b-v1.png](environment/market-building-housing-b-v1.png); световая версия: [market-building-housing-b-interior-v1.png](environment/market-building-housing-b-interior-v1.png).
- Исходник: [market-building-minimarket-a-v1.png](environment/market-building-minimarket-a-v1.png); световая версия: [market-building-minimarket-a-interior-v1.png](environment/market-building-minimarket-a-interior-v1.png).
- Исходник: [market-building-minimarket-b-v1.png](environment/market-building-minimarket-b-v1.png); световая версия: [market-building-minimarket-b-interior-v1.png](environment/market-building-minimarket-b-interior-v1.png).
- Исходник: [market-building-repair-a-v1.png](environment/market-building-repair-a-v1.png); световая версия: [market-building-repair-a-interior-v1.png](environment/market-building-repair-a-interior-v1.png).
- Исходник: [market-building-repair-b-v1.png](environment/market-building-repair-b-v1.png); световая версия: [market-building-repair-b-interior-v1.png](environment/market-building-repair-b-interior-v1.png).
- Исходник: [market-building-laundry-a-v1.png](environment/market-building-laundry-a-v1.png); световая версия: [market-building-laundry-a-interior-v1.png](environment/market-building-laundry-a-interior-v1.png).
- Исходник: [market-building-laundry-b-v1.png](environment/market-building-laundry-b-v1.png); световая версия: [market-building-laundry-b-interior-v1.png](environment/market-building-laundry-b-interior-v1.png).

## Общий промпт для каждого редактирования

Каждому вызову передан соответствующий исходный PNG как единственный edit target, transparent_background=true.

```text
Edit the supplied game sprite ONLY to switch on believable INTERIOR ROOM LIGHTING behind its existing glass windows. Keep exactly the same image canvas, transparent background, building silhouette, perspective, dimensions, every door/window/frame/curtain/railing/sign and exterior texture. This is a registered lighting state for an existing 2D game, NOT a redesign. Illuminate existing ground-floor shop interiors naturally: visible warm-white ceiling lamps casting soft light onto existing shelves, goods or washing machines, light falling off into room depth, glass reflections and mullions retained. In upstairs windows illuminate existing rooms or curtains from behind with soft warm domestic light, preserving all existing partitions. Interior light should be clearly visible at small game scale, amber/warm-white rather than flat saturated colour. NO flat luminous rectangles; no uniform glass tint; no opaque glowing windows. Exterior concrete must retain original exposure and weathering. Keep exterior lamps, neon and signboards OFF and unchanged: this edit is ONLY interiors. Do not add objects outside, no people, no background, no extra floors, no fog, no bloom outside the building, no cast floor shadow. Preserve alpha transparency.
```

## Подключение

Вариативность задаётся при генерации рынка отдельно каждому экземпляру здания и отеля: сохраняются `lightSeed` и `lightVariant`. Повторные фасады чередуют схемы всех, одного, нуля и нескольких освещённых окон; сами окна выбираются по отдельному детерминированному RNG. Светильники и вывески чередуют постоянное свечение, мягкое/сильное мерцание, мигание и отключённое состояние. Их фазы индивидуальны. Конфигурация кэшируется и не меняется от движения камеры, паузы или прогрева кэшей. Режимы предпросмотра «Всё включено/выключено» сохраняют приоритет.

`withInteriorLight` в `src/sprite-lighting.js` регистрирует непрозрачные границы светового варианта по исходному фасаду и один раз выделяет положительную RGB-разницу внутри размеченных окон. Исходные пиксели стен и масштаб не меняются. Световые области кэшируются и рисуются через тот же `drawSpriteEmission`, что и освещение отелей, в режиме `lighter`.

`windows` в `src/building-atmosphere.js` описывает полные области стекла. Витрины освещены постоянно; часть верхних окон остаётся тёмной, остальные медленно включаются и выключаются. Предпросмотр auto/off/on поддерживается. Процедурная цветная заливка окон удалена. Вывески, уличные лампы, пар и техника используют свои отдельные эффекты.

Изображения просмотрены вручную. Автоматические тесты и браузерные проверки не запускались по просьбе пользователя.
