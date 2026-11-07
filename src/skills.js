export const BRANCHES = {
  body: { name: 'Сила', subtitle: 'Выживание / ближний бой', icon: '◈' },
  reflex: { name: 'Реакция', subtitle: 'Катаны / мобильность', icon: '斬' },
  tech: { name: 'Техника', subtitle: 'Броня / медицина', icon: '⚙' },
  intelligence: { name: 'Интеллект', subtitle: 'Сканер / уязвимости', icon: '⌘' },
  cool: { name: 'Хладнокровие', subtitle: 'Огнестрел / точность', icon: '◎' },
};
// Inspired by attribute branches; effects and costs belong to this game's combat model.
export const SKILLS = {
  constitution: { branch: 'body', name: 'Железное тело', description: '+8 к максимуму HP за ранг.', max: 3, level: 1, effects: { hp: 8 } },
  guard: { branch: 'body', name: 'Крепкая хватка', description: 'На 12% меньше затрат на блок за ранг.', max: 2, level: 3, requires: { constitution: 2 }, effects: { blockSaving: .12 } },
  endurance: { branch: 'body', name: 'Второе дыхание', description: '+4 к восстановлению выносливости в секунду за ранг.', max: 2, level: 3, requires: { constitution: 2 }, effects: { staminaRegen: 4 } },
  adrenaline: { branch: 'body', name: 'Адреналин', description: 'Убийство восстанавливает 5 HP.', max: 1, level: 6, requires: { endurance: 1 }, effects: { killHeal: 5 } },
  blades: { branch: 'reflex', name: 'Путь самурая', description: '+2 к урону катаны за ранг. Только с катаной.', max: 3, level: 1, effects: { melee: 2 } },
  flow: { branch: 'reflex', name: 'Текучесть', description: 'Катана расходует на 1,5 меньше выносливости за ранг.', max: 2, level: 3, requires: { blades: 2 }, effects: { meleeSaving: 1.5 } },
  dash: { branch: 'reflex', name: 'Рывок', description: 'Перекат дешевле на 4 выносливости за ранг.', max: 2, level: 3, requires: { blades: 2 }, effects: { rollSaving: 4 } },
  airDash: { branch: 'reflex', name: 'Воздушный рывок', description: 'Разрешает перекат в воздухе. Базовый перекат доступен на земле.', max: 1, level: 6, requires: { dash: 2 }, effects: { airDash: 1 } },
  plating: { branch: 'tech', name: 'Подкожная броня', description: '+2 брони за ранг.', max: 3, level: 1, effects: { armor: 2 } },
  medtech: { branch: 'tech', name: 'Полевой медик', description: 'Медгель восстанавливает на 8 HP больше за ранг.', max: 2, level: 3, requires: { plating: 2 }, effects: { healing: 8 } },
  capacitors: { branch: 'tech', name: 'Конденсаторы', description: '+10 к максимуму выносливости за ранг.', max: 2, level: 3, requires: { plating: 2 }, effects: { stamina: 10 } },
  recycler: { branch: 'tech', name: 'Биоконвертер', description: 'Откат медгеля сокращён на 3 секунды.', max: 1, level: 6, requires: { medtech: 2 }, effects: { healCooldownSaving: 3 } },
  optics: { branch: 'intelligence', name: 'Анализ угроз', description: '+1 к урону катаны и пистолета за ранг.', max: 3, level: 1, effects: { analysis: 1 } },
  scanner: { branch: 'intelligence', name: 'Боевой сканер', description: 'Показывает роль, HP и состояние видимых врагов.', max: 1, level: 3, requires: { optics: 2 }, effects: { scanner: 1 } },
  breach: { branch: 'intelligence', name: 'Пробой защиты', description: 'На 12% больше урона тяжёлым врагам за ранг.', max: 2, level: 3, requires: { optics: 2 }, effects: { breach: .12 } },
  exploit: { branch: 'intelligence', name: 'Уязвимость', description: '+25% урона противнику, восстанавливающемуся после атаки.', max: 1, level: 6, requires: { breach: 2 }, effects: { exploit: .25 } },
  focus: { branch: 'cool', name: 'Фокус', description: '+2 к урону огнестрела за ранг.', max: 3, level: 1, effects: { gun: 2 } },
  reload: { branch: 'cool', name: 'Ловкость рук', description: 'Перезарядка быстрее на 0,2 с за ранг.', max: 2, level: 3, requires: { focus: 2 }, effects: { reloadSaving: .2 } },
  execution: { branch: 'cool', name: 'Хладнокровный выстрел', description: '+15% урона огнестрела целям с HP ниже 35% за ранг.', max: 2, level: 3, requires: { focus: 2 }, effects: { execution: .15 } },
  deadeye: { branch: 'cool', name: 'Мёртвый глаз', description: 'Интервал выстрелов сокращён на 0,07 с.', max: 1, level: 6, requires: { reload: 2 }, effects: { fireSaving: .07 } },
};
export const skillBudget = profile => Math.max(2, profile.level * 2);
export function spentPoints(profile) { return Object.values(profile.skills || {}).reduce((sum, rank) => sum + rank, 0); }
export const availablePoints = profile => Math.max(0, skillBudget(profile) - spentPoints(profile));
export function skillStatus(profile, id) {
  const skill = Object.hasOwn(SKILLS, id) ? SKILLS[id] : null; if (!skill) return { allowed: false, reason: 'Неизвестный навык' };
  const rank = profile.skills?.[id] || 0;
  if (rank >= skill.max) return { allowed: false, reason: 'Максимальный ранг' };
  if (profile.level < skill.level) return { allowed: false, reason: `Нужен уровень ${skill.level}` };
  for (const [required, count] of Object.entries(skill.requires || {})) if ((profile.skills?.[required] || 0) < count) return { allowed: false, reason: `${SKILLS[required].name}: ранг ${count}` };
  if (availablePoints(profile) < 1) return { allowed: false, reason: 'Нет очков навыков' };
  return { allowed: true, reason: 'Изучить · 1 очко' };
}
export function learnSkill(profile, id) {
  if (!skillStatus(profile, id).allowed) return false;
  profile.skills ||= {}; profile.skills[id] = (profile.skills[id] || 0) + 1; return true;
}
export function skillEffects(profile) {
  const result = {};
  for (const [id, rank] of Object.entries(profile.skills || {})) {
    const skill = SKILLS[id]; if (!skill) continue;
    for (const [effect, value] of Object.entries(skill.effects)) result[effect] = (result[effect] || 0) + value * rank;
  }
  return result;
}
export function validateSkills(raw, level) {
  const p = { level, skills: {} };
  if (!raw || typeof raw !== 'object') return p.skills;
  // Parent nodes precede children; invalid, over-budget and premature ranks are ignored.
  for (const [id, skill] of Object.entries(SKILLS)) {
    const rank = Number.isInteger(raw[id]) ? Math.max(0, Math.min(raw[id], skill.max)) : 0;
    for (let i = 0; i < rank; i++) if (!learnSkill(p, id)) break;
  }
  return p.skills;
}
