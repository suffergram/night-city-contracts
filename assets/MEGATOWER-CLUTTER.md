# Бытовые детали мегабашни

Активный атлас: [tower-clutter-v2.png](environment/tower-clutter-v2.png), 4×4 ячейки, 16 предметов. Версия v1 — исходная генерация; v2 очищена от полупрозрачной дымки и сетки. Исходные файлы Codex сохранены.

Предметы: три ведра (одно перевёрнуто), ящик с инструментами, два открытых раскладных стула и один сложенный, табурет, три вида коробок, связка картона, мешки, пластиковый ящик, поддон с уборочными средствами, тележка с мешком.

Палитра и фактура согласованы с tower-commons-open-v6.png. Размеры подобраны для читаемости за перилами: стулья 40–43, табурет 30, вёдра 24–27, коробки 30–43 при высоте героя около 60. Масштаб равномерный, нижняя граница каждого предмета совпадает с полом. Предметы за персонажами и перилами, без коллизий. Увеличены интервалы между предметами и свободная зона вокруг группы.

Расстановка: src/tower-clutter.js, отдельный генератор от seed, не меняющий игровой RNG. Небольшие группы под окнами между дверями; не более трёх групп на этаж. Свободны пролёты и площадки лестниц, отверстия в полу, тайники, выход и место появления героя. Геометрия квартир и этажей не меняется.

Атлас загружается и готовится вместе с остальными ассетами мегабашни на экране загрузки. Просмотрено в браузере, исключений JS нет; полный набор тестов не запускался.

## Генерация

Встроенный image_gen, навык imagegen, прозрачный фон.

Первый промпт:

Production transparent sprite atlas for a 2D side-view game, precisely FOUR by FOUR equal square cells, 16 separate household objects, centered one in each cell with at least 15 percent transparent margin. Reference image ONLY for realistic worn texture, muted low contrast grey-green/dirty ochre palette and ambient interior lighting. No architecture in output. Strict FRONT elevation or very slight side-facing profile, not isometric or overhead. Objects stand with a clear flat ground contact, no ground plane or detached shadows, no text, no glow. Fine realistic raster detail, desaturated lived-in megatower clutter, not shiny merchandise. Row1 left to right: upright dented metal bucket with handle; upside-down dented metal bucket; scuffed grey plastic bucket; battered low lidded metal toolbox. Row2: open rusted steel folding chair with brown vinyl seat; different open folding chair with faded olive canvas seat; folded thin metal chair leaning slightly; low round worn metal stool. Row3: single closed battered cardboard box; two small uneven cardboard boxes stacked into a single group; open cardboard carton with crumpled packing paper; folded flattened cardboard stack tied with string. Row4: tied dark grey refuse bags (two bags in one group); short battered grey plastic storage crate; small pair of dusty cleaning bottles and rag in shallow tray; small old wheeled hand trolley with a sack on it. 16 clearly separated objects, no overlap between cells, uniform dark ambient lighting, subtle dirt, muted warm-grey cardboard, restrained earthy cloth, no vivid accents. Preserve transparent background and negative space inside chair frames.

Оригинал: C:\Users\petru\.codex\generated_images\01a1b4f3-3922-71e3-b366-eed59fa34cdf\exec-6f635648-0e83-4ad2-b7fc-aba2443984db.png

Очистка прозрачности:

Edit this exact 4x4 game sprite atlas. ONLY clean the alpha background. Remove ALL grey haze, noisy matte, gridlines, colored fringing and shadows outside objects. Background must be exactly fully transparent alpha zero, including gaps within chair legs and backs. Preserve all 16 objects, their positions, sizes, original fine textures, muted colours, and cell boundaries EXACTLY unchanged. No extra content. Crisp natural antialias edges, transparent cutout sprites.

Оригинал: C:\Users\petru\.codex\generated_images\01a1b4f3-3922-71e3-b366-eed59fa34cdf\exec-459881e1-eb18-4c21-999a-c660a276f7c2.png

