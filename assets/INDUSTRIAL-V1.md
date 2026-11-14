# Промзона Уотсона: промышленные корпуса v1

## Сборка локации

Старые отдельные платформы и вентиляционные блоки заменены модульной застройкой: машинный цех, грузовой склад, насосно-компрессорная станция, энергетический/диспетчерский корпус. Генерация по seed: ширина 3000–4200, перемешанные типы корпусов, группы со стыкующимися стенами и сервисные дворы. Обычно 3–6 корпусов. Архитектура описана в src/industrial.js, генерация в src/level-layout.js.

У каждого здания доступны галерея и крыша. Положение поверхностей измерено относительно обрезанных непрозрачных границ спрайта, лестницы закреплены на краевых колоннах. Размеры изображений сохраняются равномерным масштабом. Рабочая высота корпусов 240–255, служебные двери близки к человеческому масштабу (герой около 60).

Светильники привязаны к нарисованным корпусам, используют существующие постоянные/мерцающие режимы. Есть локальные световые ореолы, пыль около ламп, сигнальные огни на крышах, пар из вентиляции, редкие искры внутри цеха. Уличные столбы в новой промзоне не создаются.

Два отдельных фоновых слоя: дальний заводской силуэт и средний план из цехов/труб/силосов. Параллакс .055/.22, фасады на первом плане движутся вместе с миром. Средний слой имеет мягкое перекрытие повторов, чтобы скрыть вертикальный стык.

Наземные технические детали размещаются только в свободных дворах, автомобиль выхода — вне корпусов. Ассеты промзоны загружаются только для этой локации. Превью окружения показывает контрольные фигуры на новых галереях и крышах.

## Ассеты

Четыре фасада и два фоновых слоя, новые PNG в assets/environment/industrial-*-v1.png. Встроенный image_gen, навык imagegen, старые файлы не перезаписывались. Референс материала фасадов: tower-utility-v1.png.

Обрезанные размеры фасадов:
- workshop: 1850×827, gallery .550, roof .117;
- warehouse: 1837×826, gallery .489, roof .130;
- plant: 1846×823, gallery .518, roof .090;
- control: 1850×830, gallery .570, roof .120.

## Проверка

Просмотрены три участка собранной локации в браузере; исключений JavaScript нет. Снимки в игнорируемом artifacts/industrial-{left,middle,right}-review.png.

Прошли 3 целевые проверки генерации/проходимости/корпусов и 13 проверок окружения. Дополнительно на 100 seed проверены отсутствие пересечений наземных деталей со зданиями, лестницами, выходом и тайниками (не менее трёх деталей на карту). Полный набор тестов не запускался.

## Промпты

### workshop

Production raster architecture sprite for a 2D side-view cyberpunk industrial district. Reference ONLY for muted dirty graphite/sage concrete, aged steel and restrained ochre warnings. Strict FRONT ORTHOGRAPHIC elevation, flat facade plane, no isometric view, no visible side wall, no vanishing point. One complete connected industrial building, roughly 2.2 times wider than tall, rectangular facade with flat bottom and flat usable roof edge. Two human-scale storeys, lower service door about 34 percent of facade height. A continuous narrow steel service gallery spans facade at EXACTLY half facade height with low thin railing and visible support brackets; this is playable. No vertical or diagonal ladders or stairs baked in, they will be added in game. Gallery at half-height and roof are continuous horizontal surfaces. High detail realistic painted worn materials, dry soot, rust, grease stains, fine bolts, sensible connected pipes. ALL external lamps and fluorescent tubes switched OFF, interiors allowed dim warm ambient light. No people, no ground plane, no rain, no puddles, no background, genuinely transparent alpha outside object with no grey haze. Complete object with only 3 percent empty margins. SUBJECT: old machine workshop with two wide ground-level open roller shutter bays, visible lathes and welding benches inside, a narrow human service door, upper strip windows, overhead exhaust duct, roof fans and low extractor cowls. Recessed worn teal machine-shop identification panel, not bright neon. Strong industrial production identity, not a shop or apartment.

Оригинал: C:\Users\petru\.codex\generated_images\01a1b4f3-3922-71e3-b366-eed59fa34cdf\exec-4093350d-6115-48b9-a2f4-ada7ebead74c.png

### warehouse

Production raster architecture sprite for a 2D side-view cyberpunk industrial district. Reference ONLY for muted dirty graphite/sage concrete, aged steel and restrained ochre warnings. Strict FRONT ORTHOGRAPHIC elevation, flat facade plane, no isometric view, no visible side wall, no vanishing point. One complete connected industrial building, roughly 2.2 times wider than tall, rectangular facade with flat bottom and flat usable roof edge. Two human-scale storeys, lower service door about 34 percent of facade height. A continuous narrow steel service gallery spans facade at EXACTLY half facade height with low thin railing and visible support brackets; this is playable. No vertical or diagonal ladders or stairs baked in, they will be added in game. Gallery at half-height and roof are continuous horizontal surfaces. High detail realistic painted worn materials, dry soot, rust, grease stains, fine bolts, sensible connected pipes. ALL external lamps and fluorescent tubes switched OFF, interiors allowed dim warm ambient light. No people, no ground plane, no rain, no puddles, no background, genuinely transparent alpha outside object with no grey haze. Complete object with only 3 percent empty margins. SUBJECT: bonded freight warehouse, huge closed ribbed freight doors on ground floor flanked by a small service door and loading control panel, upper storage windows and corrugated metal cladding, thick concrete columns, cargo crane rail along roof. Two or three faded ochre hazard patches, old freight markings, no containers or scattered goods outside.

Оригинал: C:\Users\petru\.codex\generated_images\01a1b4f3-3922-71e3-b366-eed59fa34cdf\exec-cfc0d2ee-cfde-4159-affa-66e268d25e23.png

### plant

Production raster architecture sprite for a 2D side-view cyberpunk industrial district. Reference ONLY for muted dirty graphite/sage concrete, aged steel and restrained ochre warnings. Strict FRONT ORTHOGRAPHIC elevation, flat facade plane, no isometric view, no visible side wall, no vanishing point. One complete connected industrial building, roughly 2.2 times wider than tall, rectangular facade with flat bottom and flat usable roof edge. Two human-scale storeys, lower service door about 34 percent of facade height. A continuous narrow steel service gallery spans facade at EXACTLY half facade height with low thin railing and visible support brackets; this is playable. No vertical or diagonal ladders or stairs baked in, they will be added in game. Gallery at half-height and roof are continuous horizontal surfaces. High detail realistic painted worn materials, dry soot, rust, grease stains, fine bolts, sensible connected pipes. ALL external lamps and fluorescent tubes switched OFF, interiors allowed dim warm ambient light. No people, no ground plane, no rain, no puddles, no background, genuinely transparent alpha outside object with no grey haze. Complete object with only 3 percent empty margins. SUBJECT: compressor and pumping station, large visible axial ventilation fan, pipes rising into galvanized air ducts, bolted access hatches, pressure meters and valve wheels, upper machinery behind mesh window, steel service door on ground level. Heavy believable infrastructure and connected pipework, flat roof with short vent housings.

Оригинал: C:\Users\petru\.codex\generated_images\01a1b4f3-3922-71e3-b366-eed59fa34cdf\exec-e2d8fc28-4aa4-4d8c-8df2-343b7ac22940.png

### control

Production raster architecture sprite for a 2D side-view cyberpunk industrial district. Reference ONLY for muted dirty graphite/sage concrete, aged steel and restrained ochre warnings. Strict FRONT ORTHOGRAPHIC elevation, flat facade plane, no isometric view, no visible side wall, no vanishing point. One complete connected industrial building, roughly 2.2 times wider than tall, rectangular facade with flat bottom and flat usable roof edge. Two human-scale storeys, lower service door about 34 percent of facade height. A continuous narrow steel service gallery spans facade at EXACTLY half facade height with low thin railing and visible support brackets; this is playable. No vertical or diagonal ladders or stairs baked in, they will be added in game. Gallery at half-height and roof are continuous horizontal surfaces. High detail realistic painted worn materials, dry soot, rust, grease stains, fine bolts, sensible connected pipes. ALL external lamps and fluorescent tubes switched OFF, interiors allowed dim warm ambient light. No people, no ground plane, no rain, no puddles, no background, genuinely transparent alpha outside object with no grey haze. Complete object with only 3 percent empty margins. SUBJECT: factory power distribution and dispatch building, lower steel personnel doors and electrical cabinets, massive industrial windows with dim desks behind upper floor, cable trays and transformers enclosed behind mesh at lower side, roof HVAC units. Restrained faded dark red signage, small dark control monitor next to entry.

Оригинал: C:\Users\petru\.codex\generated_images\01a1b4f3-3922-71e3-b366-eed59fa34cdf\exec-3044584c-4599-4fb2-bb22-81c60f0fcced.png


### far

Landscape raster background for a side-scrolling cyberpunk factory district at night. Distant steelworks, chimneys, refinery towers, cooling structures, silos and gantry cranes under a smoky navy sky. Dark desaturated blue-grey, tiny amber windows and red aviation dots. Wide horizontal composition, full opaque image, no foreground street or people, no text, no rain. Detailed realistic game painting, atmospheric depth.

Оригинал: C:\Users\petru\.codex\generated_images\01a1b4f3-3922-71e3-b366-eed59fa34cdf\exec-7c7dbe7a-a607-4a61-a96c-0d3011c6a38f.png

### mid

Landscape transparent game background layer: a continuous row of massive factories, steel trusses, ducts, interconnected industrial pipe racks and silos at night, straight side elevation. Detailed realistic raster, muted dark grey-green, dim warm industrial windows. Transparent sky above roofline. Solid factory walls extend down to bottom image edge. No streets, no perspective vanishing point, no people, no rain, no text, no neon. Wide horizontal composition.

Оригинал: C:\Users\petru\.codex\generated_images\01a1b4f3-3922-71e3-b366-eed59fa34cdf\exec-788db152-debb-423c-b739-dcd7db4410f5.png


