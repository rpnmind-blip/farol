'use strict';
/* One reading position, one session of choices; no scroll interception or server state. */
const menuToggle=document.querySelector('.menu-toggle'),nav=document.getElementById('navigation');
function closeMenu(){menuToggle.setAttribute('aria-expanded','false');menuToggle.setAttribute('aria-label','Abrir menu');nav.classList.remove('is-open');}
menuToggle.addEventListener('click',()=>{const open=menuToggle.getAttribute('aria-expanded')!=='true';menuToggle.setAttribute('aria-expanded',String(open));menuToggle.setAttribute('aria-label',open?'Fechar menu':'Abrir menu');nav.classList.toggle('is-open',open);});
nav.addEventListener('click',e=>{if(e.target.closest('a'))closeMenu();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menuToggle.getAttribute('aria-expanded')==='true'){closeMenu();menuToggle.focus();}});

const reducedQuery=matchMedia('(prefers-reduced-motion: reduce)'),desktopQuery=matchMedia('(min-width: 900px)');
const state={period:'day',route:'safe',report:null,guardian:{status:'idle',elapsed:0}};
const chapterNames=['ENTENDA O ENTORNO','ESCOLHA SEU CAMINHO','SIGA ACOMPANHADO','AJUDE OUTROS CAMINHOS'];
const reports={light:{title:'Iluminação reduzida',glyph:'☀',copy:'Seu relato de iluminação apareceu no mapa. Mais contexto para quem passar por aqui.',detail:'Um trecho para observar com mais atenção.'},accident:{title:'Acidente na via',glyph:'!',copy:'Seu relato de acidente apareceu no mapa. Uma informação para considerar antes de seguir.',detail:'Uma ocorrência fictícia no caminho.'},flood:{title:'Alagamento',glyph:'≈',copy:'Seu relato de alagamento apareceu no mapa. Informação para pensar em outro caminho.',detail:'Uma condição da via a considerar.'}};
const chapters=Array.from(document.querySelectorAll('[data-chapter]'));
const template=document.getElementById('scene-template').innerHTML;
const views=[];
function createScene(slot,fixedIndex){
 const uid='scene-'+views.length;slot.innerHTML=template.replaceAll('UID',uid);
 const el=slot.querySelector('.experience-stage');
 const view={el,fixedIndex,visible:false,index:fixedIndex??0,score:82,minutes:21,markerP:0,drawP:1,revealP:0,lastPhase:-1};
 view.safe=el.querySelector('.map-path-safe');view.fast=el.querySelector('.map-path-fast');
 view.safeLength=view.safe.getTotalLength();view.fastLength=view.fast.getTotalLength();
 view.marker=el.querySelector('.traveler');view.road=el.querySelector('.map-roads');
 view.scoreText=el.querySelector('.scene-score');view.timeValue=el.querySelector('.scene-time-value');view.headline=el.querySelector('.scene-headline');view.detail=el.querySelector('.scene-detail');view.eyebrow=el.querySelector('.metric-eyebrow');
 view.percent=el.querySelector('.guardian-percent');view.progress=el.querySelector('.guardian-progress');view.guardLabel=el.querySelector('.guardian-status-label');
 const replay=document.createElement('button');replay.className='stage-replay';replay.dataset.action='guardian-start';replay.textContent='Repetir percurso ↻';replay.hidden=true;el.querySelector('.scene-guardian').append(replay);view.replay=replay;
 el.dataset.scene=String(view.index);views.push(view);return view;
}
const desktopView=createScene(document.querySelector('.desktop-scene'),null);
document.querySelectorAll('[data-mobile-scene]').forEach(slot=>createScene(slot,Number(slot.dataset.mobileScene)));
let activeIndex=0,positions=[],needsLayout=true,raf=0,lastFrame=0;
let reduce=reducedQuery.matches,heroVisible=true;
const hero=document.querySelector('.hero'),heroArt=document.querySelector('.hero-art');
const heroRoute=document.querySelector('.decorative-route path');heroRoute.setAttribute('pathLength','1');
const boot=performance.now();let tilt={x:0,y:0,targetX:0,targetY:0};
const root=document.documentElement;
root.classList.toggle('motion-reduced',reduce);
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const setText=(el,value)=>{if(el.textContent!==String(value))el.textContent=String(value);};
const ease=(value,target,dt)=>{if(reduce)return target;const next=value+(target-value)*(1-Math.exp(-dt/125));return Math.abs(next-target)<.002?target:next;};
function schedule(){if(!raf)raf=requestAnimationFrame(frame);}
function layout(){positions=chapters.map(el=>{const r=el.getBoundingClientRect();return {top:r.top+scrollY,height:r.height};});needsLayout=false;}
function chapterProgress(index){const p=positions[index];return p?clamp((scrollY+innerHeight*.48-p.top)/p.height):0;}
function guardianVisible(){return !document.hidden&&(desktopQuery.matches?desktopView.visible&&activeIndex===2:views.some(v=>v.fixedIndex===2&&v.visible));}
function selectedScore(){return state.period==='night'?(state.route==='safe'?87:61):(state.route==='safe'?91:74);}
function updateControls(){
 document.querySelectorAll('button[data-period]').forEach(b=>{const selected=b.dataset.period===state.period;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));});
 document.querySelectorAll('button[data-route]').forEach(b=>{const selected=b.dataset.route===state.route;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));});
 document.querySelectorAll('[data-option-score]').forEach(el=>{const score=state.period==='night'?(el.dataset.optionScore==='safe'?87:61):(el.dataset.optionScore==='safe'?91:74);el.innerHTML=score+'<span>/100</span>';});
 document.querySelectorAll('button[data-report]').forEach(b=>{const selected=b.dataset.report===state.report;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));});
 setText(document.getElementById('period-feedback'),state.period==='night'?'22:40 · Iluminação reduzida e outros pontos de atenção no cenário.':'18:40 · Mais movimento e iluminação natural no cenário.');
 setText(document.getElementById('route-insight'),state.route==='safe'?'3 minutos a mais. Um caminho com menos pontos de atenção.':'Menor tempo no cenário, com mais pontos de atenção pelo caminho.');
 setText(document.getElementById('report-feedback'),state.report?reports[state.report].copy:'Toque em uma opção para adicionar seu relato fictício.');
 document.querySelector('[data-action="report-remove"]').disabled=!state.report;
 const button=document.querySelector('.activate-guardian');button.disabled=state.guardian.status==='running';
 setText(button.querySelector('span'),state.guardian.status==='complete'?'Repetir percurso':state.guardian.status==='running'?'Acompanhando seu caminho':'Ativar Guardião');
 needsLayout=true;schedule();
}
function renderScene(view,dt){
 const index=view.fixedIndex??activeIndex;
 view.index=index;
 if(view.lastPhase!==index){
  view.el.dataset.scene=String(index);view.lastPhase=index;
  setText(view.el.querySelector('.scene-step-label'),String(index+1).padStart(2,'0')+' / '+chapterNames[index]);
  view.el.querySelectorAll('[data-step]').forEach(a=>{if(Number(a.dataset.step)===index)a.setAttribute('aria-current','step');else a.removeAttribute('aria-current');});
 }
 const el=view.el;el.dataset.period=state.period;
 const running=state.guardian.status==='running',done=state.guardian.status==='complete';
 const guardP=clamp(state.guardian.elapsed/6000);
 const score=index===0?(state.period==='day'?82:58):index===2?Math.round(guardP*100):selectedScore();
 const minutes=state.route==='safe'?21:18;
 view.score=index===2?score:ease(view.score,score,dt);view.minutes=ease(view.minutes,minutes,dt);
 setText(view.scoreText,Math.round(view.score));el.style.setProperty('--score-progress',Math.round(view.score)+'%');
 const clock=state.period==='day'?'18:40':'22:40';setText(el.querySelector('.scene-time'),clock);
 const safe=state.route==='safe';
 view.safe.classList.toggle('is-selected',safe);view.fast.classList.toggle('is-selected',!safe);
 const drawTarget=index===0?.3:1;view.drawP=ease(view.drawP,drawTarget,dt);
 const path=safe?view.safe:view.fast,length=safe?view.safeLength:view.fastLength,other=safe?view.fast:view.safe;
 path.style.strokeDasharray=String(length);path.style.strokeDashoffset=String((1-view.drawP)*length);
 other.style.strokeDasharray='';other.style.strokeDashoffset='';
 let targetP=index===0?0:index===1?clamp(.12+chapterProgress(1)*.88):index===2?guardP:.9;
 if(reduce)targetP=index===2?(done?1:0):index===0?0:1;
 view.markerP=ease(view.markerP,targetP,dt);
 const point=path.getPointAtLength(length*view.markerP);view.marker.setAttribute('transform',`translate(${point.x.toFixed(2)} ${point.y.toFixed(2)})`);
 const revealTarget=reduce?1:index===0?clamp(.4+chapterProgress(0)*.8):1;view.revealP=ease(view.revealP,revealTarget,dt);
 el.style.setProperty('--map-reveal',String(.35+.65*view.revealP));el.style.setProperty('--roads-shift',(reduce?0:(1-view.revealP)*12).toFixed(2)+'px');
 let headline,detail,metric,value,observation;
 if(index===0){headline=state.period==='day'?'Um bom momento para ir.':'Um novo contexto para observar.';detail=state.period==='day'?'Movimento e iluminação natural.':'Trechos com iluminação reduzida.';metric='PONTUAÇÃO DO ENTORNO';value=clock;observation=state.period==='day'?'Mais movimento no seu entorno.':'Mais atenção neste horário.';}
 if(index===1){headline=safe?'Um caminho mais tranquilo.':'O caminho mais rápido.';detail=safe?'Contorna os pontos de atenção.':'Passa pelos trechos de atenção.';metric='PONTUAÇÃO DA SUA ROTA';value=Math.round(view.minutes)+' min';observation=safe?'Sua rota recomendada está traçada.':'Outra escolha. Um novo caminho.';}
 if(index===2){headline=done?'Você chegou bem.':running?'Seu caminho, acompanhado.':'Vamos juntos até o destino?';detail='Mariana · seu contato de confiança fictício.';metric='MODO GUARDIÃO · SIMULAÇÃO';value=done?'Chegou!':running?'Ativo':'Pronto';observation=done?'Destino alcançado. Tudo certo.':running?'Guardião de demonstração ativo.':'Ative o Guardião para começar.';}
 if(index===3){headline=state.report?reports[state.report].title:'Uma informação faz diferença.';detail=state.report?reports[state.report].detail:'Escolha um relato e veja no mapa.';metric='INTELIGÊNCIA COLABORATIVA';value=state.report?'Seu relato':'Sua voz';observation=state.report?'Você adicionou contexto ao caminho.':'Uma cidade mais informada, juntos.';}
 setText(view.headline,headline);setText(view.detail,detail);setText(view.eyebrow,metric);setText(view.timeValue,value);setText(el.querySelector('.scene-observation'),observation);
 el.classList.toggle('has-report',!!state.report);el.dataset.guardianStatus=state.guardian.status;
 const reportMarker=el.querySelector('.user-report-marker');reportMarker.classList.toggle('is-present',!!state.report&&index===3);
 if(state.report){const data=reports[state.report];setText(el.querySelector('.report-glyph'),data.glyph);setText(el.querySelector('.scene-report-title'),data.title);reportMarker.setAttribute('aria-label','Seu relato fictício: '+data.title);}
 const percent=Math.round(guardP*100);setText(view.percent,percent+'%');view.progress.setAttribute('aria-valuenow',String(percent));el.style.setProperty('--guardian-progress',String(guardP));
 setText(view.guardLabel,done?'Percurso concluído':running?(guardianVisible()?'Tudo certo no caminho':'Pausado enquanto você explora'):'Pronto para acompanhar');view.replay.hidden=!done;
 return !reduce&&(Math.abs(view.score-score)>.05||Math.abs(view.minutes-minutes)>.02||Math.abs(view.markerP-targetP)>.002||Math.abs(view.drawP-drawTarget)>.002||Math.abs(view.revealP-revealTarget)>.002);
}
function frame(now){
 raf=0;const dt=lastFrame?Math.min(48,now-lastFrame):16;lastFrame=now;
 if(needsLayout)layout();
 let nearest=0;const anchor=scrollY+innerHeight*.48;
 positions.forEach((p,i)=>{if(anchor>=p.top)nearest=i;});
 if(nearest!==activeIndex){activeIndex=nearest;chapters.forEach((el,i)=>el.classList.toggle('is-active',i===activeIndex));}
 const start=positions[0],end=positions[positions.length-1];if(start&&end)root.style.setProperty('--journey-progress',String(clamp((anchor-start.top)/(end.top+end.height-start.top))));
 let keep=false;
 if(state.guardian.status==='running'){
  if(guardianVisible()){
   state.guardian.elapsed=Math.min(6000,state.guardian.elapsed+dt);keep=true;
   if(state.guardian.elapsed>=6000){state.guardian.status='complete';updateControls();setText(document.getElementById('guardian-feedback'),'Você chegou bem. Repita a simulação quando quiser.');}
   else setText(document.getElementById('guardian-feedback'),'Guardião ativo · acompanhando seu trajeto de demonstração.');
  }else setText(document.getElementById('guardian-feedback'),'Percurso pausado. Ele continua quando você voltar a esta etapa.');
 }
 for(const view of views){if(view.visible)keep=renderScene(view,dt)||keep;}
 if(heroVisible&&!reduce){
  const rect=hero.getBoundingClientRect(),p=clamp(-rect.top/rect.height),entry=clamp((now-boot)/1300);
  tilt.x=ease(tilt.x,tilt.targetX,dt);tilt.y=ease(tilt.y,tilt.targetY,dt);
  heroArt.style.setProperty('--hero-drift',(-p*36).toFixed(2)+'px');heroArt.style.setProperty('--hero-back-drift',(p*22).toFixed(2)+'px');heroArt.style.setProperty('--hero-angle',(-p*7).toFixed(2)+'deg');heroArt.style.setProperty('--tilt-x',tilt.x.toFixed(2)+'px');heroArt.style.setProperty('--tilt-y',tilt.y.toFixed(2)+'px');
  heroArt.style.setProperty('--hero-line-offset',String(1-clamp(entry*.7+p*.3)));
  keep=keep||entry<1||Math.abs(tilt.x-tilt.targetX)>.01||Math.abs(tilt.y-tilt.targetY)>.01;
 }
 if(keep)schedule();
}
const visibilityObserver=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.target===hero){heroVisible=entry.isIntersecting;heroArt.classList.toggle('is-in-view',heroVisible);}else{const view=views.find(v=>v.el===entry.target);if(view){view.visible=entry.isIntersecting&&entry.intersectionRatio>0;view.el.classList.toggle('is-in-view',view.visible);}}}schedule();},{threshold:[0,.01,.1]});
views.forEach(v=>visibilityObserver.observe(v.el));visibilityObserver.observe(hero);
chapters[0].classList.add('is-active');
window.addEventListener('scroll',schedule,{passive:true});
window.addEventListener('resize',()=>{needsLayout=true;if(innerWidth>650)closeMenu();schedule();},{passive:true});
document.addEventListener('visibilitychange',()=>{lastFrame=0;schedule();});
reducedQuery.addEventListener('change',()=>{reduce=reducedQuery.matches;root.classList.toggle('motion-reduced',reduce);document.querySelectorAll('.phone').forEach(el=>el.getAnimations().forEach(a=>a.cancel()));needsLayout=true;schedule();});
heroArt.addEventListener('pointermove',e=>{if(reduce||!matchMedia('(hover: hover) and (pointer: fine)').matches||!desktopQuery.matches)return;const r=heroArt.getBoundingClientRect();tilt.targetX=((e.clientX-r.left)/r.width-.5)*14;tilt.targetY=((e.clientY-r.top)/r.height-.5)*10;schedule();},{passive:true});
heroArt.addEventListener('pointerleave',()=>{tilt.targetX=0;tilt.targetY=0;schedule();});
if(!reduce){document.querySelectorAll('.phone').forEach((el,i)=>el.animate([{opacity:0,translate:'0 45px'},{opacity:1,translate:'0 0'}],{duration:1100,delay:80+i*120,easing:'cubic-bezier(.16,1,.3,1)',fill:'backwards'}));}
document.addEventListener('click',e=>{
 const button=e.target.closest('button');if(!button)return;
 if(button.dataset.period){state.period=button.dataset.period;updateControls();}
 if(button.dataset.route){if(state.route!==button.dataset.route){state.route=button.dataset.route;views.forEach(v=>{v.drawP=reduce?1:0;v.markerP=0;});}updateControls();}
 if(button.dataset.report){state.report=button.dataset.report;updateControls();views.filter(v=>v.index===3).forEach(v=>{if(!reduce)v.el.querySelector('.user-report-marker').animate([{opacity:0,scale:'.65'},{opacity:1,scale:'1'}],{duration:500,easing:'cubic-bezier(.2,1.5,.4,1)'});});}
 if(button.dataset.action==='report-remove'){state.report=null;updateControls();}
 if(button.dataset.action==='guardian-start'&&state.guardian.status!=='running'){
  state.guardian.status='running';state.guardian.elapsed=0;lastFrame=0;views.forEach(v=>{if(v.index===2)v.markerP=0;});updateControls();
  if(!desktopQuery.matches)document.querySelector('[data-mobile-scene="2"]').scrollIntoView({block:'center',behavior:reduce?'instant':'smooth'});
 }
});
if('ResizeObserver' in window){const sizeObserver=new ResizeObserver(()=>{needsLayout=true;schedule();});chapters.forEach(el=>sizeObserver.observe(el));}
if(document.fonts)document.fonts.ready.then(()=>{needsLayout=true;schedule();});
updateControls();schedule();
