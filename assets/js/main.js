(() => {
'use strict';
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
document.body.classList.add('js-ready');
const header=document.querySelector('.site-header'), menuButton=document.querySelector('.menu-toggle'), menu=document.querySelector('.full-menu'), scrim=document.querySelector('.menu-scrim');
function setMenu(open){menu.hidden=!open;scrim.hidden=!open;menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'전체 메뉴 닫기':'전체 메뉴 열기');document.body.classList.toggle('menu-open',open);if(open)menu.querySelector('a').focus();}
menuButton.addEventListener('click',()=>setMenu(menu.hidden));scrim.addEventListener('click',()=>setMenu(false));
menu.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>setMenu(false)));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!menu.hidden){setMenu(false);menuButton.focus();}if(e.key==='Tab'&&!menu.hidden){const links=[...menu.querySelectorAll('a')];if(e.shiftKey&&document.activeElement===links[0]){e.preventDefault();menuButton.focus();}else if(!e.shiftKey&&document.activeElement===links.at(-1)){e.preventDefault();menuButton.focus();}else if(document.activeElement===menuButton){e.preventDefault();(e.shiftKey?links.at(-1):links[0]).focus();}}});
const slides=[...document.querySelectorAll('.hero-slide')],hero=document.querySelector('.hero');let current=0,paused=reducedMotion,timer;
function showSlide(index){current=(index+slides.length)%slides.length;slides.forEach((slide,i)=>{slide.classList.toggle('is-active',i===current);slide.inert=i!==current;slide.setAttribute('aria-hidden',String(i!==current));});document.querySelector('.hero-current').textContent=String(current+1).padStart(2,'0');document.querySelector('.hero-progress i').style.width=`${((current+1)/slides.length)*100}%`;hero.dataset.activeSlide=current;}
function startTimer(){clearInterval(timer);if(!paused&&!document.hidden&&!hero.contains(document.activeElement)&&!hero.matches(':hover'))timer=setInterval(()=>showSlide(current+1),6500);}
document.querySelector('[data-hero-prev]').addEventListener('click',()=>{showSlide(current-1);startTimer();});document.querySelector('[data-hero-next]').addEventListener('click',()=>{showSlide(current+1);startTimer();});
const pause=document.querySelector('.hero-pause');function updatePause(){pause.textContent=paused?'▷':'Ⅱ';pause.setAttribute('aria-label',paused?'메인 슬라이드 자동 재생 시작':'메인 슬라이드 자동 재생 정지');pause.setAttribute('aria-pressed',String(paused));}
pause.addEventListener('click',()=>{paused=!paused;updatePause();startTimer();});hero.addEventListener('pointerenter',()=>clearInterval(timer));hero.addEventListener('pointerleave',startTimer);hero.addEventListener('focusin',()=>clearInterval(timer));hero.addEventListener('focusout',e=>{if(!hero.contains(e.relatedTarget))startTimer();});document.addEventListener('visibilitychange',startTimer);
let touchStart;hero.addEventListener('touchstart',e=>{touchStart=e.changedTouches[0].clientX;},{passive:true});hero.addEventListener('touchend',e=>{const delta=e.changedTouches[0].clientX-touchStart;if(Math.abs(delta)>60){showSlide(current+(delta<0?1:-1));startTimer();}},{passive:true});updatePause();startTimer();
const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}}),{threshold:.12});document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
function onScroll(){header.classList.toggle('is-scrolled',window.scrollY>30);}window.addEventListener('scroll',onScroll,{passive:true});onScroll();document.querySelector('.back-top').addEventListener('click',()=>window.scrollTo({top:0,behavior:reducedMotion?'instant':'smooth'}));
const footerObserver=new IntersectionObserver(entries=>{
  document.querySelector('.quick-menu').classList.toggle('is-footer-visible',entries[0].isIntersecting);
},{threshold:0});
footerObserver.observe(document.querySelector('.visit-footer'));
// Keep the active treatment centered at every viewport width.
const carousel=document.querySelector('.service-carousel'), track=document.querySelector('.service-track');
const cards=[...document.querySelectorAll('.service-card')], dots=[...document.querySelectorAll('[data-service-dot]')];
let activeService=2;
function selectService(index){
  activeService=(index+cards.length)%cards.length;
  cards.forEach((card,i)=>{card.classList.toggle('is-active',i===activeService);card.setAttribute('aria-pressed',String(i===activeService));card.tabIndex=i===activeService?0:-1;});
  dots.forEach((dot,i)=>{dot.classList.toggle('is-active',i===activeService);if(i===activeService)dot.setAttribute('aria-current','true');else dot.removeAttribute('aria-current');});
  const selected=cards[activeService];
  track.style.transform=`translateX(${carousel.clientWidth/2-selected.offsetLeft-selected.offsetWidth/2}px)`;
}
document.querySelector('[data-service-prev]').addEventListener('click',()=>selectService(activeService-1));
document.querySelector('[data-service-next]').addEventListener('click',()=>selectService(activeService+1));
dots.forEach(dot=>dot.addEventListener('click',()=>selectService(Number(dot.dataset.serviceDot))));
carousel.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();const cardHadFocus=cards.includes(document.activeElement);selectService(activeService+(e.key==='ArrowRight'?1:-1));if(cardHadFocus)cards[activeService].focus({preventScroll:true});}});
new ResizeObserver(()=>selectService(activeService)).observe(carousel);
let dragStart=null,dragDelta=0,suppressClick=false;
carousel.addEventListener('pointerdown',e=>{if(e.button!==0)return;dragStart=e.clientX;dragDelta=0;suppressClick=false;});
window.addEventListener('pointermove',e=>{if(dragStart!==null)dragDelta=e.clientX-dragStart;},{passive:true});
window.addEventListener('pointerup',()=>{if(dragStart===null)return;if(Math.abs(dragDelta)>45){suppressClick=true;selectService(activeService+(dragDelta<0?1:-1));}dragStart=null;});
window.addEventListener('pointercancel',()=>{dragStart=null;dragDelta=0;});
carousel.addEventListener('dragstart',e=>e.preventDefault());
cards.forEach((card,index)=>card.addEventListener('click',()=>{
  if(suppressClick){suppressClick=false;return;}
  selectService(index);
}));
selectService(activeService);

let activeSpace=0;
const spaces=[{name:'The Lounge',title:'여유를 담은 대기 공간',lines:['따뜻한 빛과 차분한 색감이 어우러진 공간.','마음의 긴장을 내려놓고 편안하게 머무세요.']},{name:'The Care Room',title:'이야기에 집중하는 진료 공간',lines:['차분한 분위기에서 나누는 당신의 이야기.','프라이버시를 배려한 공간을 지향합니다.']}];
function showSpace(index){activeSpace=(index+spaces.length)%spaces.length;const item=spaces[activeSpace];document.querySelector('.space-name').textContent=item.name;document.querySelector('.space-description h3').textContent=item.title;const p=document.querySelector('.space-description .body-copy');p.replaceChildren(document.createTextNode(item.lines[0]),document.createElement('br'),document.createTextNode(item.lines[1]));document.querySelectorAll('.space-image img').forEach((img,i)=>{img.classList.toggle('is-active',i===activeSpace);img.setAttribute('aria-hidden',String(i!==activeSpace));});document.querySelector('.space-current').textContent=String(activeSpace+1).padStart(2,'0');}
document.querySelector('[data-space-prev]').addEventListener('click',()=>showSpace(activeSpace-1));document.querySelector('[data-space-next]').addEventListener('click',()=>showSpace(activeSpace+1));showSpace(0);
document.querySelectorAll('[data-news]').forEach(button=>{
  const index=Number(button.dataset.news);
  const title=button.querySelector('strong').textContent;
  function preview(){
    document.querySelector('.news-preview-title').textContent=title;
    document.querySelector('.news-feature img').src=index%2?'assets/img/consultation.png':'assets/img/reception.png';
  }
  button.addEventListener('pointerenter',preview);
  button.addEventListener('focus',preview);
  button.addEventListener('click',preview);
});
})();
