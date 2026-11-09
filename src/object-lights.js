const light=(rect,colour,mode=false)=>({rect,colour,mode});
const warm=rect=>light(rect,'#ffd19a');
export const OBJECT_LIGHTS={
  locations:{
    2:[light([.12,.17,.30,.07],'#ffb35c','strong')],
    3:[light([.77,.06,.18,.33],'#ffc46f','blink')],
    4:[warm([.22,.37,.62,.04]),light([.72,.37,.20,.22],'#ff58bd','strong'),light([.01,.43,.14,.22],'#ff724e','blink')],
    5:[light([.12,.19,.70,.045],'#5ce8e4','strong'),light([.38,.35,.42,.24],'#51e5c6')],
    7:[...Array.from({length:5},(_,i)=>light([.18+i*.14,.34+Math.sin(i/4*Math.PI)*.12,.035,.055],'#ffd19a',i===1?'blink':false))],
    8:[warm([.28,.15,.45,.04]),light([.09,.12,.08,.17],'#fc66c2','blink'),light([.80,.37,.10,.13],'#56e6e5')],
    9:[warm([.85,.20,.09,.20]),warm([.30,.75,.16,.04])],
    12:[light([.13,.30,.11,.04],'#51dce5','strong')],
  },
  market:{
    0:[warm([.16,.26,.61,.025]),warm([.01,.31,.05,.13])],
    1:[light([.18,.28,.60,.025],'#ffd19a','strong')],
    2:[warm([.24,.23,.20,.025]),light([.69,.23,.20,.025],'#ffd19a','blink')],
    3:[light([.25,.33,.53,.025],'#5ae6e9','strong'),light([.18,.52,.18,.15],'#59e4dc')],
    4:[light([.32,.29,.46,.025],'#ff58c2','blink')],
    5:[light([.13,.30,.38,.03],'#5ae6e9','strong')],
    6:[warm([.20,.30,.54,.025])],
    7:[light([.78,.28,.14,.09],'#ff65c8','blink'),warm([.20,.31,.36,.025])],
    8:[warm([.15,.30,.30,.03]),light([.63,.30,.23,.03],'#ffd19a','strong')],
  },
  life:{
    1:[light([.22,.04,.35,.025],'#50e7e7','strong'),light([.17,.15,.55,.57],'#57e0e4')],
    3:[light([.33,.50,.60,.25],'#57e4e6','blink')],
    7:[light([.08,.13,.64,.68],'#5ae9df','strong')],
    12:[warm([.30,.03,.40,.035])],
    14:[light([.15,.10,.16,.04],'#53e1e9','blink')],
  },
  worksite:{
    1:[light([.72,.34,.06,.05],'#ffb55b','blink')],
    4:[light([.13,.01,.05,.06],'#ffc46f','blink')],
    7:[light([.50,.18,.09,.04],'#ffc46f','blink')],
    14:[light([.42,.02,.12,.14],'#ffc46f','blink')],
  },
};
