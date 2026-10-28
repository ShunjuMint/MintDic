import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
export function validate(words,config){
 const fail=message=>{throw new Error(message);};
 const text=(s,label)=>{if(typeof s!=='string'||!s.trim())fail(`${label} は空でない文字列にしてください`);};
 if(!Array.isArray(words))fail('words.json の最上位は配列にしてください');
 if(!config||typeof config!=='object')fail('config.json が不正です');
 for(const k of ['title','description','about'])text(config[k],`config.${k}`);
 if(config.repositoryUrl){const u=new URL(config.repositoryUrl);if(u.protocol!=='https:'||u.hostname!=='github.com')fail('repositoryUrl はGitHubのHTTPS URLにしてください');}
 const ids=new Set();
 words.forEach((w,i)=>{
  if(!w||typeof w!=='object')fail(`${i+1}番目の単語が不正です`);
  for(const k of ['id','form','pos'])text(w[k],`単語${i+1}.${k}`);
  if(!/^[A-Za-z0-9_-]+$/.test(w.id))fail(`${w.id}: IDは半角英数字・ハイフン・アンダースコアにしてください`);
  if(ids.has(w.id))fail(`IDが重複しています: ${w.id}`);ids.add(w.id);
  for(const k of ['meanings','tags']){if(!Array.isArray(w[k]))fail(`${w.id}.${k} は配列にしてください`);w[k].forEach(v=>text(v,`${w.id}.${k}`));}
  if(!w.meanings.length)fail(`${w.id}: 意味を1つ以上登録してください`);
  if(new Set(w.tags).size!==w.tags.length)fail(`${w.id}: 同じタグが重複しています`);
  for(const k of ['reading','ipa','etymology','notes','updated'])if(w[k]!==undefined&&typeof w[k]!=='string')fail(`${w.id}.${k} は文字列にしてください`);
  if(w.updated){const d=new Date(w.updated);if(!/^\d{4}-\d{2}-\d{2}$/.test(w.updated)||Number.isNaN(+d)||d.toISOString().slice(0,10)!==w.updated)fail(`${w.id}: updated は実在する YYYY-MM-DD にしてください`);}
  if(w.examples!==undefined){if(!Array.isArray(w.examples))fail(`${w.id}.examples は配列にしてください`);w.examples.forEach(e=>{text(e?.text,`${w.id}.examples.text`);text(e?.translation,`${w.id}.examples.translation`);});}
  if(w.related!==undefined&&(!Array.isArray(w.related)||w.related.some(id=>typeof id!=='string')))fail(`${w.id}.related はIDの配列にしてください`);
 });
 words.forEach(w=>(w.related??[]).forEach(id=>{if(!ids.has(id))fail(`${w.id}: 関連語 ${id} が見つかりません`);}));
 return true;
}
export async function loadAndValidate(){const root=new URL('../site/data/',import.meta.url);const [words,config]=await Promise.all(['words.json','config.json'].map(name=>readFile(new URL(name,root),'utf8').then(JSON.parse)));validate(words,config);return{words,config};}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){try{const {words}=await loadAndValidate();console.log(`OK: ${words.length}語のデータを検証しました`);}catch(e){console.error(e.message);process.exitCode=1;}}
