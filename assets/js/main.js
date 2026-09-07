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
  cards.forEach((card,i)=>{card.classList.toggle('is-active',i===activeService);card.tabIndex=i===activeService?0:-1;});
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
const serviceDescriptions=[
  ['배뇨 클리닉','VOIDING CARE','일상에서 느끼는 배뇨 관련 불편함을 편안하게 상담하는 진료 분야입니다.','언제부터 어떤 상황에서 불편했는지 이야기해 주세요. 개인의 상태와 생활을 함께 살펴봅니다.'],
  ['전립선 클리닉','PROSTATE CARE','연령에 따라 달라지는 건강 고민을 함께 살펴보는 진료 분야입니다.','현재 느끼는 불편함과 궁금한 점에 대해 충분히 이야기 나누는 시간을 지향합니다.'],
  ['여성 비뇨의학','WOMEN’S WELLNESS','쉽게 이야기하지 못했던 비뇨기 건강 고민을 편안하게 나누는 진료 분야입니다.','각자의 생활과 상황을 이해하고, 프라이버시를 배려하는 상담을 지향합니다.'],
  ['요로결석 클리닉','STONE CARE','요로결석과 관련된 고민을 상담하고 상태를 확인하는 진료 분야입니다.','진료 및 검사 과정은 의료진과 상담을 통해 안내받을 수 있습니다.'],
  ['건강 검진','HEALTH CHECKUP','지금의 건강을 돌아보고 일상의 관리 방향을 생각해 보는 시간입니다.','검사 항목과 진행 과정은 개인의 상황에 맞춰 상담 후 안내됩니다.']
];
const dialog=document.querySelector('.detail-dialog');let dialogTrigger;
function openDetail(category,title,paragraphs){
  dialogTrigger=document.activeElement;
  dialog.querySelector('.dialog-category').textContent=category;
  dialog.querySelector('h2').textContent=title;
  const body=dialog.querySelector('.dialog-body');body.replaceChildren();
  paragraphs.forEach(text=>{const p=document.createElement('p');p.textContent=text;body.append(p);});
  dialog.showModal();document.body.style.overflow='hidden';
}
function closeDetail(){dialog.close();}
dialog.querySelector('.dialog-close').addEventListener('click',closeDetail);
dialog.querySelector('.dialog-confirm').addEventListener('click',closeDetail);
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDetail();}});
dialog.addEventListener('close',()=>{document.body.style.overflow='';dialogTrigger?.focus();});
cards.forEach((card,index)=>card.addEventListener('click',()=>{if(suppressClick){suppressClick=false;return;}if(index!==activeService){selectService(index);return;}const item=serviceDescriptions[index];openDetail(item[1],item[0],[item[2],item[3],'본 페이지는 디자인 시안입니다. 실제 운영되는 진료 항목은 병원 안내를 확인해 주세요.']);}));
selectService(activeService);

let activeSpace=0;
const spaces=[{name:'The Lounge',title:'여유를 담은 대기 공간',lines:['따뜻한 빛과 차분한 색감이 어우러진 공간.','마음의 긴장을 내려놓고 편안하게 머무세요.']},{name:'The Care Room',title:'이야기에 집중하는 진료 공간',lines:['차분한 분위기에서 나누는 당신의 이야기.','프라이버시를 배려한 공간을 지향합니다.']}];
function showSpace(index){activeSpace=(index+spaces.length)%spaces.length;const item=spaces[activeSpace];document.querySelector('.space-name').textContent=item.name;document.querySelector('.space-description h3').textContent=item.title;const p=document.querySelector('.space-description .body-copy');p.replaceChildren(document.createTextNode(item.lines[0]),document.createElement('br'),document.createTextNode(item.lines[1]));document.querySelectorAll('.space-image img').forEach((img,i)=>{img.classList.toggle('is-active',i===activeSpace);img.setAttribute('aria-hidden',String(i!==activeSpace));});document.querySelector('.space-current').textContent=String(activeSpace+1).padStart(2,'0');}
document.querySelector('[data-space-prev]').addEventListener('click',()=>showSpace(activeSpace-1));document.querySelector('[data-space-next]').addEventListener('click',()=>showSpace(activeSpace+1));showSpace(0);
const newsBodies=[['따뜻한 소재와 자연광이 어우러지는 스마일의 공간을 소개합니다. 방문하는 순간부터 편안하게 느낄 수 있는 분위기를 생각했습니다.','이 사진과 소식은 홈페이지 디자인을 위한 예시입니다.'],['처음 방문하기 전, 평소 궁금했던 점과 상담하고 싶은 내용을 정리해 보세요. 충분히 이야기를 나눌 수 있는 진료를 지향합니다.','실제 준비 사항과 예약 방법은 병원의 운영 안내 확정 후 이곳에서 확인할 수 있습니다.'],['잘 듣는 것, 쉽게 설명하는 것, 마음을 배려하는 것. 스마일이 생각하는 진료의 작은 약속입니다.','각자의 이야기를 이해하는 데서 더 나은 진료가 시작된다고 믿습니다.'],['홈페이지의 맞춤 진료 영역에서 관심 있는 분야를 살펴보세요. 카드를 선택하면 해당 분야의 안내를 확인할 수 있습니다.','궁금한 진료 분야와 공간을 편안하게 둘러보세요.']];
document.querySelectorAll('[data-news]').forEach(button=>{const index=Number(button.dataset.news);const title=button.querySelector('strong').textContent;function preview(){document.querySelector('.news-preview-title').textContent=title;document.querySelector('.news-feature img').src=index%2?'assets/img/consultation.png':'assets/img/reception.png';}button.addEventListener('pointerenter',preview);button.addEventListener('focus',preview);button.addEventListener('click',()=>openDetail('SMILE JOURNAL · '+button.querySelector('.news-meta').textContent,title,newsBodies[index]));});
document.querySelectorAll('[data-policy]').forEach(button=>button.addEventListener('click',()=>{if(button.dataset.policy==='privacy')openDetail('PRIVACY','개인정보처리 안내',['이 페이지는 디자인 시안이며, 예약이나 문의를 위한 개인정보를 입력받거나 저장하지 않습니다.','실제 서비스 연결 시 운영 주체의 개인정보처리방침으로 교체됩니다.']);else openDetail('INFORMATION','홈페이지 이용 안내',['스마일비뇨의학과의 홈페이지 디자인 시안입니다. 사진, 소식 및 운영 시간은 예시로 구성되어 있습니다.','메뉴 이동, 슬라이드, 진료 분야 상세 보기와 공간 안내를 이용할 수 있습니다.']);}));
})();
