import {readFile,readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
export function validate(words,config){
 const fail=message=>{throw new Error(message);};
 const text=(s,label)=>{if(typeof s!=='string'||!s.trim())fail(`${label} は空でない文字列にしてください`);};
 if(!Array.isArray(words))fail('words.json の最上位は配列にしてください');
 if(!config||typeof config!=='object')fail('config.json が不正です');
 text(config.title,'config.title');
 for(const k of ['description','about'])if(config[k]!==undefined&&typeof config[k]!=='string')fail(`config.${k} は文字列にしてください`);
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
export async function loadAndValidate(root=new URL('../site/data/',import.meta.url)){
 const read=async file=>JSON.parse(await readFile(new URL(file,root),'utf8'));
 const config=await read('config.json');
 const classes=await read('word%20class/classes.json');
 if(!Array.isArray(classes))throw new Error('classes.json は配列にしてください');
 const ids=new Set(),names=new Set();
 for(const c of classes){
  if(!c||typeof c.id!=='string'||!/^[a-z0-9][a-z0-9_-]*$/.test(c.id)||/^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/.test(c.id))throw new Error('品詞IDは安全な半角小文字英数字・ハイフン・アンダースコアにしてください');
  if(typeof c.name!=='string'||!c.name.trim()||c.name!==c.name.trim())throw new Error('品詞名は前後に空白のない文字列にしてください');
  if(ids.has(c.id)||names.has(c.name))throw new Error('品詞IDまたは品詞名が重複しています');
  ids.add(c.id);names.add(c.name);
 }
 const entries=await readdir(new URL('vocabulary/',root),{withFileTypes:true});
 for(const entry of entries){
  if(entry.name==='.gitkeep'&&entry.isFile())continue;
  if(!entry.isDirectory()||!ids.has(entry.name))throw new Error(`未登録または不正な品詞フォルダ: ${entry.name}`);
 }
 const words=[];
 for(const c of classes){
  const directory=`vocabulary/${c.id}/`;
  const files=await readdir(new URL(directory,root),{withFileTypes:true});
  for(const entry of files){
   if(entry.name==='.gitkeep'&&entry.isFile())continue;
   if(!entry.isFile()||!entry.name.endsWith('.json'))throw new Error(`語彙フォルダにはJSONファイルだけを置いてください: ${directory}${entry.name}`);
   const batch=await read(directory+encodeURIComponent(entry.name));
   if(!Array.isArray(batch))throw new Error(`${directory}${entry.name} は配列にしてください`);
   for(const w of batch){
    if(!w||typeof w!=='object'||Array.isArray(w))throw new Error('単語はオブジェクトにしてください');
    if(w.pos!==undefined&&w.pos!==c.name)throw new Error(`${w.id}: pos と品詞フォルダが一致しません`);
    words.push({...w,pos:c.name});
   }
  }
 }
 try{await readFile(new URL('words.json',root));throw new Error('旧 words.json が残っています。npm run migrate を実行してください');}catch(e){if(e.code!=='ENOENT')throw e;}
 validate(words,config);return{words,config,classes};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){try{const {words}=await loadAndValidate();console.log(`OK: ${words.length}語のデータを検証しました`);}catch(e){console.error(e.message);process.exitCode=1;}}
