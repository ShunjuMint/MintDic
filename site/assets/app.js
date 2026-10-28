import {prepareWords,searchWords,readState,stateQuery,normalize} from './core.js';
const $=id=>document.getElementById(id);
const el=(tag,text,className)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(className)n.className=className;return n;};
const button=(text,className,action)=>{const n=el('button',text,className);n.type='button';n.addEventListener('click',action);return n;};
const PAGE_SIZE=24;
let words=[], state=readState(location.search), currentWord=null, ready=false;
function syncURL(){const query=stateQuery(state);history.replaceState(null,'',location.pathname+(query?'?'+query:'')+location.hash);}
function change(values){Object.assign(state,values,{page:1});render();syncURL();}
function toggleTag(tag){change({tags:state.tags.includes(tag)?state.tags.filter(t=>t!==tag):[...state.tags,tag]});}
function tagChip(tag){return button('# '+tag,'tag-chip',()=>{if($('word-dialog').open)closeWord();toggleTag(tag);});}
function render(){
  const results=searchWords(words,state);const pages=Math.max(1,Math.ceil(results.length/PAGE_SIZE));state.page=Math.min(state.page,pages);
  $('result-count').textContent=`${results.length.toLocaleString()} / ${words.length.toLocaleString()} 語`;
  $('cards').replaceChildren();
  const start=(state.page-1)*PAGE_SIZE;
  for(const [i,w] of results.slice(start,start+PAGE_SIZE).entries()){
    const card=el('article',undefined,'word-card');const top=el('div',undefined,'card-top');top.append(el('span',w.pos||'未分類','pos-badge'),el('span',String(start+i+1).padStart(3,'0'),'word-number'));
    const open=button('','word-open',()=>openWord(w.id));open.append(el('h3',w.form));open.setAttribute('aria-label',`${w.form} の詳細を開く`);
    const tags=el('div',undefined,'card-tags');w.tags.forEach(t=>tags.append(tagChip(t)));
    card.append(top,open,el('p',w.ipa?`/${w.ipa}/`:w.reading||'','pronunciation'),el('p',w.meanings.slice(0,2).join(' / ')+(w.meanings.length>2?' …':''),'meaning'),tags);$('cards').append(card);
  }
  $('active-filters').replaceChildren(...state.tags.map(t=>button('# '+t+' ×','active-filter',()=>toggleTag(t))));
  document.querySelectorAll('.tag-filter').forEach(b=>b.setAttribute('aria-pressed',String(state.tags.includes(b.dataset.tag))));
  $('prev').disabled=state.page<=1;$('next').disabled=state.page>=pages;$('page-status').textContent=`${state.page} / ${pages}`;
  $('message').hidden=results.length>0;
  if(!results.length)$('message').textContent=words.length?'一致する単語はありません。':'まだ単語が登録されていません。';
}
function controls(){
  $('query').value=state.q;$('pos').value=state.pos;$('sort').value=state.sort;
  document.querySelectorAll('[name=mode]').forEach(n=>n.checked=n.value===state.mode);
}
function section(title,node){const s=el('section',undefined,'detail-section');s.append(el('h3',title),node);return s;}
function openWord(id,writeURL=true){
  const w=words.find(w=>w.id===id);
  if(!w){state.word='';if($('word-dialog').open)$('word-dialog').close();if(writeURL)syncURL();$('message').textContent='指定された単語は見つかりませんでした。';$('message').hidden=false;return;}
  currentWord=w;state.word=w.id;const body=$('word-body');body.replaceChildren();
  const title=el('h2',w.form);title.id='word-title';body.append(el('span',w.pos||'未分類','pos-badge'),title);
  if(w.ipa||w.reading)body.append(el('p',[w.ipa?`/${w.ipa}/`:'',w.reading].filter(Boolean).join('  ·  '),'pronunciation'));
  const meanings=el('ol');w.meanings.forEach(m=>meanings.append(el('li',m)));body.append(section('意味',meanings));
  if(w.tags.length){const tags=el('div',undefined,'card-tags');w.tags.forEach(t=>tags.append(tagChip(t)));body.append(section('タグ',tags));}
  if(w.examples?.length){const examples=el('div');w.examples.forEach(e=>{const x=el('div',undefined,'example');x.append(el('p',e.text),el('p',e.translation));examples.append(x);});body.append(section('例文',examples));}
  for(const [key,label] of [['etymology','語源'],['notes','メモ']])if(w[key])body.append(section(label,el('p',w[key],'paragraph')));
  if(w.related?.length){const links=el('div',undefined,'card-tags');w.related.forEach(id=>{const other=words.find(x=>x.id===id);if(other)links.append(button(other.form+' ↗','outline',()=>openWord(id)));});body.append(section('関連語',links));}
  if(w.updated)body.append(section('最終更新',el('p',w.updated,'small')));
  $('copy-status').textContent='';$('fallback-link').hidden=true;
  if(!$('word-dialog').open)$('word-dialog').showModal();else $('word-dialog').scrollTop=0;
  if(writeURL)syncURL();
}
function closeWord(){state.word='';currentWord=null;$('word-dialog').close();syncURL();}
$('close-word').onclick=closeWord;
$('word-dialog').addEventListener('cancel',e=>{e.preventDefault();closeWord();});
$('word-dialog').addEventListener('click',e=>{if(e.target===$('word-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeWord();}});
$('copy-link').onclick=async()=>{if(!currentWord)return;const link=new URL(location.href);link.search=stateQuery({...readState(''),word:currentWord.id});link.hash='';try{await navigator.clipboard.writeText(link.href);$('copy-status').textContent='コピーしました';}catch{$('fallback-link').hidden=false;$('fallback-link').value=link.href;$('fallback-link').select();$('copy-status').textContent='下のURLをコピーしてください';}};
$('about-button').onclick=()=>$('about-dialog').showModal();$('close-about').onclick=()=>$('about-dialog').close();
$('query').addEventListener('input',()=>{if(ready)change({q:$('query').value});});
$('pos').onchange=()=>change({pos:$('pos').value});$('sort').onchange=()=>change({sort:$('sort').value});
for(const n of document.querySelectorAll('[name=mode]'))n.onchange=()=>change({mode:n.value});
$('reset').onclick=()=>{state=readState('');controls();$('tag-query').value='';filterTags();render();syncURL();};
function filterTags(){const q=normalize($('tag-query').value);let visible=0;document.querySelectorAll('.tag-filter').forEach(b=>{b.hidden=!normalize(b.dataset.tag).includes(q);if(!b.hidden)visible++;});$('tag-empty').hidden=visible>0;}
$('tag-query').oninput=filterTags;
for(const [id,delta] of [['prev',-1],['next',1]])$(id).onclick=()=>{state.page+=delta;render();syncURL();$('results-title').focus();$('results-title').scrollIntoView({block:'start'});};
window.addEventListener('keydown',e=>{if(e.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)&&!document.querySelector('dialog[open]')){e.preventDefault();$('query').focus();}});
window.addEventListener('popstate',()=>{if(!ready)return;state=readState(location.search);controls();render();if(state.word)openWord(state.word,false);else if($('word-dialog').open)$('word-dialog').close();});
async function loadJSON(path){const r=await fetch(new URL(path,document.baseURI),{cache:'no-cache'});if(!r.ok)throw new Error('HTTP '+r.status);return r.json();}
try{
  const [config,data]=await Promise.all([loadJSON('./data/config.json'),loadJSON('./data/words.json')]);
  words=prepareWords(data);$('site-name').textContent=config.title;document.title=config.title;
  $('about-text').textContent=typeof config.about==='string' && config.about.trim()?config.about:'説明はまだ登録されていません。';document.querySelector('meta[name="description"]').content=config.description;
  $('total').textContent=words.length.toLocaleString();
  const tags=new Map();words.forEach(w=>w.tags.forEach(t=>tags.set(t,(tags.get(t)||0)+1)));
  $('tag-total').textContent=tags.size;
  for(const [tag,count] of [...tags].sort(([a],[b])=>a.localeCompare(b,'ja'))){const b=button('','tag-filter',()=>toggleTag(tag));b.dataset.tag=tag;b.setAttribute('aria-pressed','false');b.append(el('span','# '+tag,'tag-name'),el('span',count,'tag-number'));$('tag-list').append(b);}
  const positions=new Set(words.map(w=>w.pos).filter(Boolean));if(state.pos)positions.add(state.pos);
  for(const pos of [...positions].sort((a,b)=>a.localeCompare(b,'ja'))){const o=el('option',pos);o.value=pos;$('pos').append(o);}
  if(config.repositoryUrl){const url=new URL(config.repositoryUrl);if(url.protocol==='https:'&&url.hostname==='github.com'){$('repo-link').href=url.href;$('repo-link').hidden=false;$('site-footer').hidden=false;}}
  ready=true;controls();render();if(state.word)openWord(state.word,false);syncURL();
}catch(error){$('about-text').textContent='説明を読み込めませんでした。ページを再読み込みしてください。';console.error(error);$('result-count').textContent='読み込みエラー';$('message').hidden=false;$('message').textContent='辞書を読み込めませんでした。\nページを再読み込みしてください。ファイルを直接開いている場合は、READMEのプレビュー手順をご確認ください。';}
