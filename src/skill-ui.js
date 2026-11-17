import {BRANCHES,SKILLS,availablePoints,skillStatus} from './skills.js';
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const button=(text,action,disabled=false)=>`<button class="button" data-action="${action}" ${disabled?'disabled':''}>${text}</button>`;
export function skillScreen(profile,branch=null,focus=null){
 const points=availablePoints(profile);
 if(!Object.hasOwn(BRANCHES,branch))return `<div class="skills-topline"><strong>${points} очк.</strong><span>Выбери специализацию</span></div><div class="attribute-menu">${Object.entries(BRANCHES).map(([id,b])=>{
  const ranks=Object.entries(SKILLS).filter(([,s])=>s.branch===id).reduce((n,[key])=>n+(profile.skills[key]||0),0);
  return `<button class="attribute-card" data-action="branch:${id}"><span class="attribute-icon">${b.icon}</span><h3>${b.name}</h3><p>${b.subtitle}</p><small>Вложено: ${ranks}</small><b>Открыть ветку →</b></button>`;
 }).join('')}</div>`;
 const info=BRANCHES[branch],nodes=Object.entries(SKILLS).filter(([,s])=>s.branch===branch),positions=[[18,50],[50,22],[50,72],[82,50]],selected=nodes.find(([id])=>id===focus)||nodes[0];
 const coords=Object.fromEntries(nodes.map(([id],i)=>[id,positions[i]]));
 const links=nodes.flatMap(([id,s])=>Object.keys(s.requires||{}).filter(parent=>coords[parent]).map(parent=>{
  const [x,y]=coords[parent],[tx,ty]=coords[id],mid=(x+tx)/2,learned=(profile.skills[parent]||0)>=(s.requires[parent]||0);
  return `<path class="${learned?'unlocked':''}" d="M${x},${y} C${mid},${y} ${mid},${ty} ${tx},${ty}"/>`;
 })).join('');
 const [selectedId,skill]=selected,status=skillStatus(profile,selectedId),rank=profile.skills[selectedId]||0;
 const graph=nodes.map(([id,s],i)=>{
  const [x,y]=positions[i],n=profile.skills[id]||0,st=skillStatus(profile,id);
  return `<button class="perk-node ${n?'learned':''} ${st.allowed?'available':''} ${selectedId===id?'selected':''}" style="left:${x}%;top:${y}%" data-action="perk:${id}" aria-pressed="${selectedId===id}" aria-label="${esc(s.name)}, ранг ${n} из ${s.max}"><span class="perk-emblem"><span class="perk-glyph">${n===s.max?'✓':i===0?info.icon:'◇'}</span></span><span class="perk-rank">${n}/${s.max}</span><strong>${s.name}</strong></button>`;
 }).join('');
 return `<div class="skills-topline">${button('← Специализации','skill-overview')}<h3>${info.name}</h3><strong>${points} очк.</strong></div><div class="perk-layout"><section class="perk-graph" aria-label="Дерево навыков ${info.name}"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${links}</svg>${graph}</section><aside class="perk-inspector"><small>${info.name} · Ранг ${rank}/${skill.max}</small><h3>${skill.name}</h3><p>${skill.description}</p><div class="perk-requirements">Уровень ${skill.level}${skill.requires?'<br>'+Object.entries(skill.requires).map(([id,n])=>SKILLS[id].name+' '+n).join('<br>'):''}</div>${button(status.allowed?'Изучить · 1 очко':status.reason,'learn:'+selectedId,!status.allowed)}</aside></div>`;
}
