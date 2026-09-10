import { readFile, mkdir, cp, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, dirname, sep } from 'node:path';
import { execFileSync } from 'node:child_process';
import { Script } from 'node:vm';
import { generateSubpages } from './build-subpages.mjs';

const projectRoot=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const browserPages=await generateSubpages();
const widget=await readFile(resolve(projectRoot,'imweb-rezum.html'),'utf8');
if (/:root|<!doctype|<(?:html|head|body|link)\b|document\.(?:body|documentElement)|position:\s*fixed/i.test(widget)) {
 throw new Error('The Imweb fragment must stay isolated from the host document.');
}
if (/<script\s+src=|<button\b(?![^>]*\btype="button")/i.test(widget)) {
 throw new Error('The Imweb fragment must use inline scripts and explicit button types.');
}
const pages=['index.html','imweb-rezum.html',...browserPages];
const assets=new Set();
let anchorCount=0, localLinkCount=0;
const idCache=new Map();
async function idsFor(path){
 if(!idCache.has(path)){
  const html=await readFile(path,'utf8');
  idCache.set(path,[...html.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]));
 }
 return idCache.get(path);
}
for(const page of pages){
 const file=resolve(projectRoot,page);
 const html=await readFile(file,'utf8');
 const ids=await idsFor(file);
 if(new Set(ids).size!==ids.length) throw new Error(page+': duplicate HTML IDs.');
 for(const [,id] of html.matchAll(/href="#([^"]+)"/g)){
  if(!ids.includes(id)) throw new Error(page+': missing anchor #'+id+'.');
 }
 for(const [,references] of html.matchAll(/\b(?:aria-labelledby|aria-controls|aria-describedby)="([^"]+)"/g)){
  for(const id of references.split(/\s+/)) if(!ids.includes(id)) throw new Error(page+': missing accessibility target #'+id+'.');
 }
 for(const [,source] of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)){
  if(source.trim()) new Script(source,{filename:page});
 }
 for(const [,raw] of html.matchAll(/(?:src|href)="([^"\s]+)"/g)){
  if(/^(?:[a-z]+:|\/\/|#|\/)/i.test(raw)) continue;
  const [asset,hash]=raw.split('#');
  const target=resolve(dirname(file),asset.split('?')[0]);
  if(!target.startsWith(projectRoot+sep)) throw new Error(page+': local reference leaves project.');
  await access(target);
  localLinkCount++;
  if(hash && target.endsWith('.html') && !(await idsFor(target)).includes(hash)) throw new Error(page+': broken page anchor '+raw);
  if(!target.endsWith('.html')) assets.add(target);
 }
 if(browserPages.includes(page)){
  if(/<(?:header|footer)\b|role="(?:banner|contentinfo|dialog)"|<dialog\b/i.test(html)) throw new Error(page+': browser preview must exclude header, footer and modal.');
  if(!page.endsWith('subpages.html') && (html.match(/<h1\b/g)||[]).length!==1) throw new Error(page+': exactly one page title is required.');
 }
 anchorCount+=ids.length;
}
for(const assetPath of assets){
 if(assetPath.endsWith('.css')){
  const css=await readFile(assetPath,'utf8');
  for(const [,path] of css.matchAll(/url\(['"]?(\.\.\/[^)'"\s]+)/g)) await access(resolve(dirname(assetPath),path));
 }
 if(assetPath.endsWith('.js')) execFileSync(process.execPath,['--check',assetPath],{stdio:'inherit'});
}
await mkdir(resolve(projectRoot,'dist'),{recursive:true});
for(const page of pages){
 await mkdir(dirname(resolve(projectRoot,'dist',page)),{recursive:true});
 await cp(resolve(projectRoot,page),resolve(projectRoot,'dist',page));
}
await cp(resolve(projectRoot,'assets'),resolve(projectRoot,'dist/assets'),{recursive:true});
console.log('Build complete: '+pages.length+' HTML files, '+anchorCount+' anchor targets, '+localLinkCount+' local references, '+assets.size+' local assets; scripts, links and header/footer exclusion checked.');
