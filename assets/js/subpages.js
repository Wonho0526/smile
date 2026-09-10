(() => {
 const page=document.querySelector('.smile-page');
 if(!page) return;
 const nav=page.querySelector('.sp-section-nav');
 const links=nav?[...nav.querySelectorAll('a[href^="#"]')]:[];
 const sections=links.map(link=>page.querySelector(link.getAttribute('href'))).filter(Boolean);
 const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
 const reveal=[...page.querySelectorAll('[data-sp-reveal]')];
 let navHeight=0, frame=0;
 function update() {
  frame=0;
  navHeight=nav?nav.getBoundingClientRect().height:0;
  page.style.setProperty('--sp-nav-height',navHeight+'px');
  let current=sections[0];
  for(const section of sections) if(section.getBoundingClientRect().top<=navHeight+120) current=section;
  links.forEach(link=>{
   if(current && link.hash==='#'+current.id) link.setAttribute('aria-current','location');
   else link.removeAttribute('aria-current');
  });
 }
 function schedule(){if(!frame) frame=requestAnimationFrame(update);}
 links.forEach(link=>link.addEventListener('click',event=>{
  if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey) return;
  const target=page.querySelector(link.hash); if(!target) return;
  event.preventDefault();
  const top=target.getBoundingClientRect().top+window.scrollY-navHeight-16;
  target.focus({preventScroll:true});
  window.scrollTo({top:Math.max(0,top),behavior:motion.matches?'auto':'smooth'});
  try {history.replaceState(null,'',link.hash);} catch {}
 }));
 if('IntersectionObserver' in window && !motion.matches){
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
   if(entry.isIntersecting){entry.target.classList.add('sp-in-view');observer.unobserve(entry.target);}
  }),{threshold:.06});
  reveal.forEach(element=>observer.observe(element));
  page.classList.add('sp-motion-ready');
  motion.addEventListener('change',()=>{if(motion.matches){page.classList.remove('sp-motion-ready');observer.disconnect();}});
 }
 if(nav && 'ResizeObserver' in window) new ResizeObserver(schedule).observe(nav);
 window.addEventListener('scroll',schedule,{passive:true});
 window.addEventListener('resize',schedule,{passive:true});
 window.addEventListener('load',schedule,{once:true});
 update();
})();
