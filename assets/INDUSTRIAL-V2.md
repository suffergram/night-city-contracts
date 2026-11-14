# Промзона: дворы и разная высота застройки v2

Двухэтажные корпуса теперь чередуются с обязательными секциями: одноэтажный погрузочный склад, открытая площадка контейнеров и строительные леса. Порядок и дополнительные секции выбираются по seed; ширина 3600–4800. Галереи лесов, крыши складов и штабели контейнеров имеют реальные платформы и связи лестницами.

Новые ассеты:
- industrial-shed-v3.png — низкий ангар, чистая прозрачность без светлого ореола; непрозрачная область 2138×626, высота в мире 140.
- industrial-scaffold-v1.png — открытая стальная конструкция с двумя настилами, 1421×1081, высота 210.
- industrial-freight-v1.png — атлас 4×2: два контейнера, погрузчик, бочки, паллеты с грузом, трубы на стойке, сварочная тележка, кабельная катушка.

Погрузочная техника и грузы сгруппированы по рабочим зонам. Напольные предметы привязаны к земле; верхний контейнер опирается на нижний. Масштаб спрайтов равномерный. Машина выхода и дополнительный наземный декор учитывают новые занятые области.

Встроенный image_gen, навык imagegen. Исходные генерации сохранены. v1/v2 ангара не используются из-за полупрозрачного белого фона; v3 очищен.

Проверены три участка в браузере, исключений JS нет. Три целевые проверки генерации, доступности и пропорций прошли; полный набор тестов не запускался.

## Промпты

### shed

Production raster sprite for a 2D side-view industrial cyberpunk game. One very LOW WIDE SINGLE STOREY warehouse loading shed, width about four times total height. Strict front orthographic elevation, flat facade with usable flat roof, no perspective side walls. Low corrugated metal and concrete depot with a broad open storage/loading bay, pallets and sacks visible inside, one human-size service door nearly 70 percent of total building height, roof ventilation ducts and unlit wall floodlights. No upper storey, no balcony. Same dusty sage concrete, rusty dark steel, faded ochre hazard strips as reference. Roof mostly flat at about 12 percent down from top; floor straight along bottom. No people, no yard props outside, no stairs/ladders, no ground plane, no rain. Truly transparent outside building, no grey matte or cast shadows. Complete silhouette, fine realistic textures, muted low contrast.

Оригинал: C:\Users\petru\.codex\generated_images\01a1b4f3-3922-71e3-b366-eed59fa34cdf\exec-1e07ed74-08f5-4dc5-87a2-8e70adf9ab3a.png

### scaffold

Production raster sprite: free-standing INDUSTRIAL SCAFFOLDING for a 2D side-view game, strict front orthographic elevation. Open steel tube frame with X braces, realistic adjustable base feet all on one horizontal floor, worn grey-green paint and rusty clamps, two full-width level wooden/metal working decks: upper deck near 15 percent of image height, lower deck near 60 percent. Low thin guardrails above both decks. A small loosely tied muted dusty tarp covering only part of one side, MOST of structure visibly OPEN with transparent gaps, no building wall or roof. Width about 1.3 times total height. No ladders or diagonal stairs, gameplay ladders will be separate. Match reference aged industrial materials. No people, no tools scattered outside, no ground, no shadows, no bright colours or lettering. Fully transparent background and between all steel tubes. Sharp fine realistic raster detail, structurally believable and supported.

Оригинал: C:\Users\petru\.codex\generated_images\01a1b4f3-3922-71e3-b366-eed59fa34cdf\exec-ef660b24-add4-4568-b438-68afbfb8e380.png

### freight

High quality raster game sprite atlas with EXACTLY eight objects in FOUR columns and TWO equal rows, one object per cell, generous 12 percent truly transparent margins. Reference for dirty muted industrial grey-green, dark steel, faded rust and ochre palette only. Front/side ORTHOGRAPHIC game elevation, no isometric perspective, realistic fine textures, dry dirt, no glow, no ground plane, no shadows or grey matte. ROW1: (1) long closed dark teal corrugated shipping container, SIDE elevation, 2.5 width:height ratio, straight flat top and bottom; (2) different long rust-red shipping container, same ratio and straight top/bottom; (3) small battered yellow industrial forklift in SIDE profile with forks extending to the RIGHT and cabin clearly visible, no driver; (4) three worn steel drums grouped together, one dull red, two dirty grey, standing on flat floor. ROW2: (1) wooden pallet with packed timber crates and wrapped sacks as one group; (2) low steel rack holding long metal pipes, supported on feet; (3) small wheeled welding gas-cylinder trolley; (4) wooden industrial cable reel lying on its side. Keep all shapes wholly inside their cells, completely separate. No text required, subdued ambient lighting, not shiny.

Оригинал: C:\Users\petru\.codex\generated_images\01a1b4f3-3922-71e3-b366-eed59fa34cdf\exec-1c365026-7226-475b-bbdc-3b00ec2734a2.png


### Извлечение фона ангара

Background extraction / transparent cutout. The input has a translucent WHITE MATTE that must be removed completely. Keep ONLY the industrial shed, its roof pipes and building, exactly as pictured. All white, pale grey or off-white pixels OUTSIDE the building silhouette must become fully transparent alpha ZERO, not alpha 128, not alpha 23, no checkerboard pattern. Also erase all soft shadows and haze around the silhouette. Do not repaint the building. Preserve its size, location, materials and dimensions. Return the building as a clean standalone PNG cutout on truly empty transparent background.

Оригинал: C:\Users\petru\.codex\generated_images\01a1b4f3-3922-71e3-b366-eed59fa34cdf\exec-e5c0bc30-6072-478a-b1b5-3f280b8d7e6f.png

