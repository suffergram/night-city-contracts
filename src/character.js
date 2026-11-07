// One layered vector model powers both the world sprites and the equipment preview.
// Each slot has a separate silhouette, material and rarity accent.
const hash = value => { let n = 0; for (const c of value) n = (n * 31 + c.charCodeAt(0)) >>> 0; return n; };
export function appearance(item, slot) {
  if (!item) return { color: '#414655', dark: '#232938', accent: '#76838f', variant: 0 };
  const variants = {
    torso: ['#c64c43', '#456575', '#5c5277', '#a27e43'],
    legs: ['#26394c', '#414653', '#34394b', '#4a4c3d'],
    feet: ['#303d48', '#554c48', '#343342', '#384d50'],
    head: ['#394751', '#4a3d4c', '#4f525a', '#364d5d'],
    weapon: ['#c5d5df', '#e0e7e6', '#9acbd2', '#c6bfd2'],
    gun: ['#667786', '#8c7c68', '#574f6d', '#556c6a'],
  };
  const variant = hash(item.id + item.name) % 4;
  return { color: variants[slot][variant], dark: '#182332', accent: ['#56d9dc', '#61f0ee', '#ed77f2'][item.rarity], variant };
}
export function mercenarySvg(equipment = {}, options = {}) {
  const role = options.role || 'hero', pose = options.pose || 'idle', hero = role === 'hero';
  const e = hero ? equipment : {
    head: { id: role, name: role, rarity: role === 'runner' ? 1 : 0 }, torso: { id: role, name: role, rarity: 0 },
    legs: { id: role, name: role, rarity: 0 }, feet: { id: role, name: role, rarity: 0 },
    weapon: role === 'runner' ? { id: role, name: role, rarity: 1 } : null,
    gun: role === 'gunner' || role === 'heavy' ? { id: role, name: role, rarity: 0 } : null,
  };
  const h = appearance(e.head, 'head'), t = appearance(e.torso, 'torso'), l = appearance(e.legs, 'legs'), f = appearance(e.feet, 'feet'), k = appearance(e.weapon, 'weapon'), g = appearance(e.gun, 'gun');
  if (!hero) { t.color = ({ runner: '#713b54', gunner: '#425c6d', heavy: '#626b67', merchant: '#9a6b4d', trainer: '#4b6c64' })[role]; t.accent = role === 'runner' ? '#ff4f91' : '#fd705e'; }
  const accent = hero ? '#51dfe1' : t.accent;
  const id = `merc-${hash(JSON.stringify(e) + role + pose)}`;
  const legA = pose === 'runA' ? -12 : pose === 'runB' ? 11 : 0, legB = -legA;
  const swing = pose === 'windup' ? -76 : pose === 'slash' ? 45 : -12;
  const katana = `<g data-slot="weapon" transform="translate(187 241) rotate(${swing})"><path d="M-3-28C-2-74 1-139 16-188L20-196C13-135 8-78 4-28Z" fill="url(#${id}-steel)" stroke="#ecf9fa" stroke-width=".7"/><path d="M0-31Q3-132 17-190" fill="none" stroke="${k.accent}" stroke-width="1.8"/><ellipse cx="0" cy="-25" rx="12" ry="3.6" fill="#b4a06e" stroke="#e4ce8d"/><path d="M-3-22H4L2 9H-5Z" fill="#1b202c" stroke="#8f6770"/>${Array.from({ length: 6 }, (_, i) => `<path d="M-4 ${-19 + i * 5}l7 4m-7 0l7-4" stroke="#d2bda5" stroke-width="1"/>`).join('')}<path d="M-5 8H3V13H-6Z" fill="#b4a06e"/></g>`;
  const pistol = `<g data-slot="gun" transform="translate(${pose === 'shoot' ? '186 198) rotate(-83)' : '88 264) rotate(13)' }"><path d="M-5-18H10L13 27H-5Z" fill="#131b29"/><path d="M-8-24H10L13-15L9 7H-7Z" fill="${g.color}" stroke="#9aabb9"/><path d="M-6-20H7V-5H-6Z" fill="#384454"/><path d="M-5 2H8L6 26H-4Z" fill="#242c3b"/><path d="M-2-16H8M-2-12H8M-2-8H8" stroke="#c4cbd0"/><path d="M9-1H16V10H8" fill="none" stroke="#9aabb9" stroke-width="2"/><path d="M-2-25H4" stroke="${g.accent}" stroke-width="3"/></g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 440" role="img" aria-label="Наёмник: надетая броня, катана и огнестрел" data-role="${role}" data-pose="${pose}">
  <defs><linearGradient id="${id}-steel"><stop stop-color="#536d83"/><stop offset=".4" stop-color="#f0f7fa"/><stop offset=".7" stop-color="#6a899c"/><stop offset="1" stop-color="#c6e5ea"/></linearGradient><linearGradient id="${id}-skin" x2="1" y2=".4"><stop stop-color="#776958"/><stop offset=".5" stop-color="#c9ac91"/><stop offset="1" stop-color="#9d7f70"/></linearGradient><linearGradient id="${id}-cloth" x2="1" y2=".6"><stop stop-color="${t.color}"/><stop offset="1" stop-color="#232b3b"/></linearGradient><pattern id="${id}-weave" width="5" height="5" patternUnits="userSpaceOnUse"><path d="M0 5L5 0" stroke="#fff" stroke-opacity=".055"/></pattern></defs>
  <ellipse cx="129" cy="416" rx="76" ry="10" fill="#040917" opacity=".6"/>
  <g transform="${role === 'heavy' ? 'translate(-16 0) scale(1.13 1)' : ''}">
  ${e.weapon ? `<g><path d="M74 149L43 366" stroke="#0b1321" stroke-width="12"/><path d="M76 150L45 364" stroke="#526172" stroke-width="2"/><path d="M78 140L84 102" stroke="#b18d73" stroke-width="8"/><path d="M74 131l10 2m-9-10l10 2m-8-10l10 2" stroke="#1e2634" stroke-width="3"/><path d="M68 143L88 147" stroke="#beaa7e" stroke-width="5"/></g>` : ''}
  <g transform="rotate(${legA} 106 267)"><path d="M89 254L123 257L121 325L113 382L84 382L86 326Z" fill="${l.color}" stroke="#101927" stroke-width="2"/><path d="M91 268L115 274L108 310L87 307Z" fill="#141f2f" opacity=".45"/><path d="M90 283L118 287M87 301L116 304" stroke="#8a8c90" stroke-width="2"/>
  ${e.legs ? `<g data-slot="legs"><path d="M89 311L115 315L112 337L86 334Z" fill="#67727d" stroke="#1d2839" stroke-width="2"/><path d="M93 316L109 319L107 330L91 329Z" fill="#303e50"/><path d="M89 344L111 347L108 374L86 372Z" fill="#202c3d"/><path d="M89 352L108 354" stroke="${l.accent}" stroke-width="2"/><path d="M82 276L91 278L89 300L80 299Z" fill="#59626d"/></g>` : ''}
  <g ${e.feet ? 'data-slot="feet"' : ''}><path d="M83 374L112 377L116 400L110 411H66L66 403L82 391Z" fill="${f.color}" stroke="#121e2d" stroke-width="2"/><path d="M66 405H112L110 414H65Z" fill="#0b1320"/><path d="M86 382L106 384M82 389L107 392M77 397L109 399" stroke="#8794a1" stroke-width="2"/>${e.feet ? `<path d="M69 405H96" stroke="${f.accent}" stroke-width="2"/>` : ''}</g></g>
  <g transform="rotate(${legB} 143 267)"><path d="M126 257L156 252L165 319L165 383L136 384L127 326Z" fill="${l.color}" stroke="#101927" stroke-width="2"/><path d="M137 268L153 267L158 310L134 314Z" fill="#101e2e" opacity=".5"/><path d="M130 285L159 281M132 302L162 299" stroke="#727d87" stroke-width="2"/>
  ${e.legs ? `<g><path d="M134 315L162 311L166 333L139 337Z" fill="#626e7a" stroke="#182537" stroke-width="2"/><path d="M139 319L158 317L160 329L143 332Z" fill="#29394c"/><path d="M140 346L164 342L164 372L141 375Z" fill="#202c3d"/><path d="M143 352L162 349" stroke="${l.accent}" stroke-width="2"/></g>` : ''}
  <path d="M136 375L165 373L168 391L185 401L185 413H136L132 403Z" fill="${f.color}" stroke="#121e2d" stroke-width="2"/><path d="M136 406H185V415H137Z" fill="#0a1321"/><path d="M139 382L161 380M141 389L165 389M143 398L174 399" stroke="#7d8e9e" stroke-width="2"/>${e.feet ? `<path d="M157 406H182" stroke="${f.accent}" stroke-width="2"/>` : ''}</g>
  <path d="M88 130L111 117H143L166 132L164 204L153 254L88 255L79 203Z" fill="#283446" stroke="#101a2a" stroke-width="2"/>
  ${e.torso ? `<g data-slot="torso"><path d="M85 131L107 119L125 140L143 119L170 134L163 210L153 251L89 250L78 204Z" fill="url(#${id}-cloth)" stroke="#8f817c" stroke-width="1.2"/><path d="M85 131L107 119L125 140L143 119L170 134L163 210L153 251L89 250L78 204Z" fill="url(#${id}-weave)"/><path d="M91 126L104 114L121 128L125 143L109 139Z" fill="#333a49" stroke="#a49786"/><path d="M130 141L137 123L149 116L158 129L141 144Z" fill="#303c4c" stroke="#a49786"/><path d="M122 141L120 244" stroke="#c0b08f" stroke-width="2"/><path d="M128 148L153 142L158 172L132 180Z" fill="#263847" stroke="#526a79"/><path d="M91 147L111 151L109 177L86 170Z" fill="#253445" stroke="#526a79"/><path d="M134 151l6 10 7-12m-9 12l9 4" stroke="${t.accent}" stroke-width="2" fill="none"/><path d="M88 196L111 198L109 218L84 216Z" fill="#212f40" stroke="#70818a"/><path d="M133 195L158 191L156 214L132 220Z" fill="#212f40" stroke="#70818a"/><path d="M85 223L110 227M133 226L155 221" stroke="${t.accent}" stroke-width="2"/><path d="M93 137L88 189M159 137L161 183" stroke="#d1aa86" stroke-opacity=".45"/><path d="M91 247H153" stroke="#a28a70" stroke-width="4"/></g>` : `<path d="M89 145L110 157L117 205M149 145L134 157L128 205M90 220L153 220" fill="none" stroke="#6c7885" stroke-width="2"/>`}
  ${role === 'heavy' ? `<path d="M86 147L122 158L157 146L154 212L125 226L89 208Z" fill="#3e4a55" stroke="#95a29c" stroke-width="3"/><path d="M97 165H146M99 178H145M99 192H144" stroke="#252f3d" stroke-width="5"/><path d="M116 171H130V187H116Z" fill="#b9aa5f"/>` : ''}
  <path d="M86 247L155 246L159 261L86 266Z" fill="#121d2c" stroke="#6b7886"/><path d="M115 249H131V261H115Z" fill="#9aa2a8"/><path d="M119 252H128V258H119Z" fill="${accent}"/><path d="M92 248V264M104 249V263M140 248V260" stroke="#9b8b6b" stroke-width="3"/>
  <g><path d="M82 135L67 145L58 191L61 229L73 234L82 194L96 158Z" fill="${e.torso ? t.color : '#596271'}" stroke="#101b2a" stroke-width="2"/><path d="M64 154L83 158L78 186L60 183Z" fill="#333e50"/><path d="M59 191L79 195L75 228L60 226Z" fill="#6a7986" stroke="#1b2d3e"/><path d="M64 195L74 198L69 221L62 219Z" fill="#25394c"/><path d="M60 204L73 207M60 213L72 215" stroke="${accent}" stroke-width="1.2"/><path d="M61 229L72 232L73 245L66 255L58 250L56 239Z" fill="#a18e7e" stroke="#2c2d37"/><path d="M61 239L61 248M66 238L66 250M70 239L69 247" stroke="#524c48" stroke-width="1.2"/><path d="M67 140L82 133L95 143L89 159L65 156Z" fill="#4b586b" stroke="#9a9290"/><path d="M70 145L85 142" stroke="${accent}" stroke-width="2"/></g>
  <g transform="${pose === 'shoot' ? 'rotate(-68 160 151)' : pose === 'block' ? 'rotate(-24 160 151)' : ''}"><path d="M162 137L179 145L187 184L187 224L173 232L165 186L151 158Z" fill="${e.torso ? t.color : '#596271'}" stroke="#101b2a" stroke-width="2"/><path d="M170 163L181 165L185 185L167 190Z" fill="#374a5c"/><path d="M169 192L186 189L188 223L174 229Z" fill="url(#${id}-steel)" stroke="#2b394b"/><path d="M174 197L181 196L183 216L176 221Z" fill="#27394b"/><path d="M174 203L184 201M176 213L185 211" stroke="${accent}" stroke-width="1.5"/><path d="M174 229L188 223L195 232L192 244L182 248L174 240Z" fill="#a98e7a" stroke="#3b3840"/><path d="M181 231L189 237M178 235L186 242" stroke="#574b47" stroke-width="1.5"/><path d="M153 142L168 132L181 142L183 157L157 163Z" fill="#4e5b70" stroke="#a9a1a0"/><path d="M160 146L176 143" stroke="${accent}" stroke-width="2"/></g>
  <path d="M112 105H139V128L125 138L110 125Z" fill="url(#${id}-skin)" stroke="#353441"/>
  <path d="M101 60L115 45L139 48L151 67L149 93L139 112L121 119L106 104L101 83Z" fill="url(#${id}-skin)" stroke="#3b3540" stroke-width="1.5"/>
  <path d="M104 80L112 77M134 77L145 80M125 80L122 95L129 96M117 104L133 104M111 92L115 96" fill="none" stroke="#695448" stroke-width="1.6"/><path d="M109 83H117M134 83H142" stroke="#252e3b" stroke-width="2"/><path d="M110 82H114M136 82H140" stroke="${accent}" stroke-width="1.5"/>
  <path d="M106 86L108 95L113 99M145 87L142 97L137 101" fill="none" stroke="#3c4c5c" stroke-width="2"/><path d="M107 88H110M141 92H145" stroke="${accent}" stroke-width="2"/>
  <path d="M100 75L97 61L106 42L126 34L144 44L152 58L150 73L141 62L117 61L106 73L106 89L100 86Z" fill="#192332" stroke="#465469"/><path d="M107 54L125 42L144 53M108 60L125 48L145 59M100 61L104 53" fill="none" stroke="#596576" stroke-width="1.5"/>
  ${role === 'runner' ? '<path d="M115 44L116 21L125 11L136 20L138 47Z" fill="#e54a7a"/><path d="M120 22L124 43M129 21L131 43" stroke="#ff8b99" stroke-width="2"/>' : ''}
  ${e.head ? `<g data-slot="head">${h.variant === 2 || role === 'heavy' ? `<path d="M98 71L97 54L107 39L136 37L151 49L155 72L147 78L140 61L111 61L104 79Z" fill="${h.color}" stroke="#8593a3"/><path d="M109 43L114 57M134 42L142 57" stroke="#243442" stroke-width="3"/>` : ''}<path d="M104 76L145 76L145 86L132 90L108 87Z" fill="#151f30" stroke="#6b94a3"/><path d="M109 79H139V83H109Z" fill="${h.accent}" opacity=".9"/><path d="M99 76H105V92H99Z" fill="#566879"/><path d="M146 78H151V90H146Z" fill="#566879"/>${role === 'gunner' || role === 'heavy' ? '<path d="M109 95L125 90L144 95L138 110L124 116L112 106Z" fill="#35475a" stroke="#8593a3"/><path d="M118 101H135M119 105H133" stroke="#142335" stroke-width="2"/>' : ''}</g>` : ''}
  ${e.gun ? pistol : ''}${e.weapon && pose !== 'shoot' && pose !== 'block' ? katana : ''}
  ${pose === 'block' ? `<path d="M173 164L203 157L211 207L190 232L174 220Z" fill="#3ae3e92b" stroke="#64edf0" stroke-width="2"/><path d="M183 174L195 172L200 203L188 218" fill="none" stroke="#64edf0"/>` : ''}
  </g></svg>`;
}

const spriteCache = new Map();
export function drawMercenary(ctx, x, y, width, height, equipment, options = {}) {
  if (typeof Image === 'undefined') return; // Node model tests have no image decoder.
  const key = JSON.stringify([equipment, options.role, options.pose]);
  let image = spriteCache.get(key);
  if (!image) { image = new Image(); image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(mercenarySvg(equipment, options))}`; spriteCache.set(key, image); if (spriteCache.size > 180) spriteCache.delete(spriteCache.keys().next().value); }
  if (image.complete && image.naturalWidth) ctx.drawImage(image, x, y, width, height);
}
