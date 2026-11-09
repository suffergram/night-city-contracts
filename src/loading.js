const screen=document.getElementById('loading-screen');
const app=document.querySelector('.app');
export const nextPaint=()=>new Promise(resolve=>requestAnimationFrame(()=>setTimeout(resolve,0)));
export function showLoading(title='Подключение к Найт-Сити'){
  app.inert=true;screen.hidden=false;screen.querySelector('h2').textContent=title;
  screen.querySelector('button').hidden=true;loadingProgress(0,'Подготовка…');
}
export function loadingProgress(value,label){
  const percent=Math.round(Math.max(0,Math.min(1,value))*100);
  screen.querySelector('progress').value=percent;
  screen.querySelector('[data-percent]').textContent=percent+'%';
  screen.querySelector('[data-stage]').textContent=label;
}
export function hideLoading(){screen.hidden=true;app.inert=false;}
export function loadingError(error){
  screen.querySelector('h2').textContent='Не удалось загрузить город';
  screen.querySelector('[data-stage]').textContent='Проверь соединение и попробуй ещё раз.';
  const button=screen.querySelector('button');button.hidden=false;button.onclick=()=>location.reload();button.focus();
  console.error('Loading failed',error);
}
