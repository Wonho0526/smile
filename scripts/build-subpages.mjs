import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const number=value=>String(value).padStart(2,'0');
const palette=['#c6ded5','#b9d4cb','#d7e5da','#aecbc5','#cbdcd2','#b9d7d2'];
export const pagePath=slug=>slug==='rezum'?'rezum.html':'subpages/'+slug+'.html';
const placeholder=(label,className,index=0,caption='')=>'<figure class="sp-media '+className+'" role="img" aria-label="'+escape(label)+' 이미지 자리" style="--media-color:'+palette[index%palette.length]+'">'+(caption?'<figcaption aria-hidden="true">'+escape(caption)+'</figcaption>':'')+'</figure>';
function document(title,description,prefix,body){
 return '<!doctype html>\n<html lang="ko">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n<meta name="description" content="'+escape(description)+'">\n<meta name="theme-color" content="#154e4d">\n<title>'+escape(title)+' · 스마일비뇨의학과</title>\n<link rel="stylesheet" href="'+prefix+'assets/css/subpages.css">\n<script src="'+prefix+'assets/js/subpages.js" defer></script>\n</head>\n<body>\n'+body+'\n</body>\n</html>\n';
}
function renderItems(section){
 const items=section.items||[];
 switch(section.type){
 case 'cards': case 'steps':
  return '<ol class="sp-grid" data-count="'+items.length+'">'+items.map((item,i)=>'<li class="sp-card'+(section.type==='steps'?' sp-step':'')+'" data-sp-reveal>'+(section.type==='steps'?placeholder(item.title,'sp-step-media',i):'')+'<span class="sp-card-number">'+number(i+1)+'</span><h3>'+escape(item.title)+'</h3>'+(item.text?'<p>'+escape(item.text)+'</p>':'')+'</li>').join('')+'</ol>';
 case 'list':
  return '<ol class="sp-list">'+items.map((item,i)=>'<li class="sp-list-item" data-sp-reveal><span class="sp-card-number">'+number(i+1)+'</span><h3'+(!item.text?' style="grid-column:2 / -1"':'')+'>'+escape(item.title)+'</h3>'+(item.text?'<p>'+escape(item.text)+'</p>':'')+'</li>').join('')+'</ol>';
 case 'table':
  return '<div class="sp-table-wrap" data-sp-reveal><table class="sp-table"><thead><tr>'+section.columns.map(column=>'<th scope="col">'+escape(column)+'</th>').join('')+'</tr></thead><tbody>'+section.rows.map(row=>'<tr>'+row.map((value,i)=>i===0?'<th scope="row">'+escape(value)+'</th>':'<td>'+escape(value)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
 case 'gallery':
  return '<ul class="sp-gallery">'+items.map((item,i)=>'<li data-sp-reveal>'+placeholder(item.title,'',i)+'<h3>'+escape(item.title)+'</h3>'+(item.text?'<p>'+escape(item.text)+'</p>':'')+'</li>').join('')+'</ul>';
 case 'map':
  return '<div class="sp-map" role="img" aria-label="지도 연결을 위한 빈 컬러 박스" data-sp-map></div>'+renderItems({...section,type:'cards'});
 case 'articles':
  return '<ol class="sp-board">'+items.map((item,i)=>'<li data-sp-reveal><a href="'+escape(item.href)+'" target="_blank" rel="noopener noreferrer" aria-label="'+escape(item.title)+' — 원본 글, 새 창"><span class="sp-board-number">'+number(i+1)+'</span><h3>'+escape(item.title)+'</h3><span aria-hidden="true">↗</span></a></li>').join('')+'</ol>';
 default: throw new Error('Unknown section type: '+section.type);
 }
}
function renderPage(page,allPages){
 const prefix=page.slug==='rezum'?'':'../';
 const navigation=[{id:'overview',label:'소개'},...page.sections];
 const body='<main class="smile-page" id="smile-page">\n'+
 '<section class="sp-hero" aria-labelledby="page-title"><div class="sp-container sp-hero-inner"><div><div class="sp-breadcrumb"><span>'+escape(page.category)+'</span></div><span class="sp-kicker">'+escape(page.kicker)+'</span><h1 id="page-title">'+escape(page.title)+'</h1><p class="sp-hero-copy">'+escape(page.lead)+'</p></div>'+placeholder(page.title,'sp-hero-media',0,page.kicker)+'</div></section>\n'+
 '<nav class="sp-section-nav" aria-label="페이지 내 섹션"><div class="sp-nav-inner">'+navigation.map((s,i)=>'<a href="#'+escape(s.id)+'"'+(i===0?' aria-current="location"':'')+'><span>'+number(i+1)+'</span>'+escape(s.label)+'</a>').join('')+'</div></nav>\n'+
 '<section class="sp-section" id="overview" tabindex="-1" aria-labelledby="overview-title"><div class="sp-container"><div class="sp-section-heading" data-sp-reveal><div><span class="sp-kicker">OVERVIEW</span><h2 class="sp-title" id="overview-title">'+escape(page.introTitle)+'</h2></div></div><div class="sp-intro-grid">'+placeholder(page.introTitle,'sp-intro-media',1)+'<div class="sp-intro-copy" data-sp-reveal>'+page.intro.map(text=>'<p>'+escape(text)+'</p>').join('')+'</div></div></div></section>\n'+
 page.sections.map((s,i)=>{
  const tone=(i===page.sections.length-1 && ['cards','list'].includes(s.type))?' sp-tone-deep':i%2===0?' sp-tone-mint':'';
  return '<section class="sp-section'+tone+'" id="'+escape(s.id)+'" tabindex="-1" aria-labelledby="'+escape(s.id)+'-title"><div class="sp-container"><div class="sp-section-heading" data-sp-reveal><div><span class="sp-kicker">'+escape(page.kicker)+' / '+number(i+2)+'</span><h2 class="sp-title" id="'+escape(s.id)+'-title">'+escape(s.title)+'</h2></div></div>'+(s.intro?'<p class="sp-section-intro">'+escape(s.intro)+'</p>':'')+renderItems(s)+'</div></section>';
 }).join('\n')+'\n'+
 (page.note?'<aside class="sp-source-note" aria-label="참고 안내"><div class="sp-container"><p>'+escape(page.note)+'</p></div></aside>\n':'')+
 (()=>{const related=allPages.filter(other=>other.category===page.category && other.slug!==page.slug);return related.length?'<nav class="sp-related" aria-label="'+escape(page.category)+' 관련 페이지"><div class="sp-container"><p class="sp-related-label">'+escape(page.category)+'</p><div class="sp-related-links">'+related.map(other=>'<a href="'+prefix+pagePath(other.slug)+'">'+escape(other.title)+'</a>').join('')+'</div></div></nav>':'';})()+'\n</main>';
 return document(page.title,page.lead,prefix,body);
}
function renderCatalog(pages){
 const categories=[...new Set(pages.map(page=>page.category))];
 return document('서브페이지 미리보기','스마일비뇨의학과의 병원 소개와 진료별 서브페이지 미리보기.','',
 '<main class="smile-page sp-catalog" id="smile-page"><div class="sp-container"><div class="sp-catalog-heading"><div><span class="sp-kicker">SMILE UROLOGY CLINIC</span><h1>서브페이지 미리보기</h1></div><p>기존 홈페이지의 진료 내용을 담은 '+pages.length+'개 페이지입니다.<br>확인할 페이지를 선택해 주세요.</p></div><div class="sp-catalog-groups">'+categories.map((category,i)=>'<section class="sp-catalog-group" aria-labelledby="category-'+i+'"><h2 id="category-'+i+'"><span>'+number(i+1)+'</span>'+escape(category)+'</h2><ul class="sp-catalog-links">'+pages.filter(page=>page.category===category).map(page=>'<li><a href="'+pagePath(page.slug)+'">'+escape(page.title)+'<span aria-hidden="true">↗</span></a></li>').join('')+'</ul></section>').join('')+'</div></div></main>');
}
export async function generateSubpages({requireComplete=true}={}){
 const manifest=JSON.parse(await readFile(resolve(root,'content/subpage-manifest.json'),'utf8'));
 const records=JSON.parse(await readFile(resolve(root,'content/subpages.json'),'utf8'));
 if(new Set(records.map(page=>page.slug)).size!==records.length) throw new Error('Duplicate content slug.');
 const pages=manifest.filter(item=>records.some(record=>record.slug===item.slug)).map(item=>({...item,...records.find(record=>record.slug===item.slug)}));
 if(requireComplete && pages.length!==manifest.length) throw new Error('Content missing: '+manifest.filter(item=>!records.some(record=>record.slug===item.slug)).map(item=>item.slug).join(', '));
 if(pages.length!==records.length) throw new Error('Unrecognized page content.');
 for(const page of pages){
  if(!page.lead || !page.introTitle || !page.intro?.length || !page.sections?.length) throw new Error(page.slug+': missing page content.');
  if(!/^https:\/\/smileuro\.com\//.test(page.source)) throw new Error(page.slug+': invalid source.');
  if(page.sections.some(section=>!/^[-a-z0-9]+$/.test(section.id))) throw new Error(page.slug+': invalid section ID.');
 }
 await mkdir(resolve(root,'subpages'),{recursive:true});
 for(const page of pages) await writeFile(resolve(root,pagePath(page.slug)),renderPage(page,pages),'utf8');
 await writeFile(resolve(root,'subpages.html'),renderCatalog(pages),'utf8');
 return ['subpages.html',...pages.map(page=>pagePath(page.slug))];
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const pages=await generateSubpages({requireComplete:!process.argv.includes('--partial')});
 console.log('Generated '+pages.length+' browser HTML files.');
}
