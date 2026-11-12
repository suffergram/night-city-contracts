# Мегабашня: боковые лестницы и фасад v4

- Пролёты чередуются на 30% и 70% ширины мира (середины второй и четвёртой из пяти зон). Физические ступени и визуальные пролёты перемещены вместе.
- Лестницы рисуются перед персонажами, но за сплошными передними парапетами: площадки и пересечения закрыты бетоном. Коллизионные отверстия остаются внутри галереи.
- Текстура перекрытия имеет постоянную фазу в мировых координатах. Ограничение видимой области выполняется clipping, без пересчёта рисунка от камеры.
- Номерные опоры соединяют низ верхнего и верх нижнего перекрытия; указатели закреплены снизу верхнего перекрытия.
- Старые увеличенные кабели, кондиционеры и ткань заменены на новые атласы. Кабели имеют три различных силуэта, кондиционеры два, бельё два.
- Подвал закрыт непрерывной технической стеной с трубами, решётками, шкафами и воздуховодами; поверх неё установлены вентиляторные блоки.

## Ассеты

Встроенный image_gen, навык imagegen. Референс палитры/стиля: tower-atrium-v1.png; отдельные модули, без использования референса как целого уровня. Прозрачность сохранена, предыдущие файлы сохранены.

### tower-cables-v1.png

Промпт:

Transparent sprite atlas for a 2D side-view game. Reference image is mood and scale reference ONLY, do not reproduce whole building. THREE DIFFERENT thin sagging electrical cable bundles, one per equal horizontal row in a wide landscape canvas. Keep each sprite fully inside its own row with 12% transparent margins. Each bundle consists of 3 to 5 thin dusty dark rubber wires spanning long distance with slight uneven sag, small subtle metal clamps anchored to concrete at endpoints, no massive boxes or thick hoses. Row1 shallow asymmetrical sag; row2 deeper overlapping fine wires; row3 cables sagging toward one side with a tiny hanging connector. Highly detailed raster, orthographic elevation, fine realistic painted weathering. Muted low contrast dark grey green, same ambient illumination as reference atrium. Real transparent background with no cast backdrop, no glow, no text, no people, no surrounding building. Wire thickness tiny relative to width.

Оригинал: C:\Users\petru\.codex\generated_images\01a1b4f3-3922-71e3-b366-eed59fa34cdf\exec-7b563c85-35ff-43e8-be54-b8a75bf5167d.png

### tower-facade-v1.png

Промпт:

Transparent 2 by 2 sprite atlas for a 2D side-view game, exactly 4 isolated architectural detail groups, each fully within its own equal quadrant with 12% empty margins. Reference atrium determines realistic style, muted grey-green dirty palette, low contrast fine detail. TOP LEFT: small battered wall-mounted residential AC condenser on rusty brackets with thin conduit curving down wall, understated grey. TOP RIGHT: different small square fan condenser on brackets, dusty fins, small junction box and conduit. BOTTOM LEFT: a short laundry line with 2 small faded beige and grey towels hung close to wall, loose drape, no saturated colors. BOTTOM RIGHT: a single faded dark desaturated red blanket draped neatly over a short narrow thin metal railing fixed to wall. Orthographic FRONT elevation, realistic raster textures at high resolution, no perspective, no lighting glow, no huge fabric, no background, no surrounding building. Items should look lived-in and naturally attached, not display props.

Оригинал: C:\Users\petru\.codex\generated_images\01a1b4f3-3922-71e3-b366-eed59fa34cdf\exec-5899dace-dc1e-4254-8c8b-f0e2e1c38a56.png

### tower-basement-v1.png

Промпт:

A single wide shallow cyberpunk residential megatower basement service wall module for 2D platformer. Reference image for mood and realistic worn grey-green material ONLY. Straight orthographic front elevation, no perspective. Continuous dark stained concrete foundation with large rectangular service grilles, horizontal insulated water mains, bundles of thin electrical conduits, vertical rusty risers and broad galvanized rectangular ducts connecting to ventilation, a few small utility panels and 2 restrained amber inspection lamps switched OFF. A dense interconnected technical wall, believable engineering, dirty, low contrast, muted detailed realistic raster. Three times wider than tall. No people, no words, no giant free-floating objects, no scene background. Rectangular solid service wall with straight left and right sides that can tile horizontally, no transparent holes inside. Transparent background outside rectangular module.

Оригинал: C:\Users\petru\.codex\generated_images\01a1b4f3-3922-71e3-b366-eed59fa34cdf\exec-2792624a-188f-4b10-b6da-dc15110485d3.png


