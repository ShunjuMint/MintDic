import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm,cp,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import {loadAndValidate} from '../scripts/validate.mjs';
test('品詞を独立登録し、フォルダから品詞を付与、全体でID・関連語を検証',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'dict-layout-'));const root=pathToFileURL(dir+'/');
 const write=async(file,value)=>writeFile(new URL(file,root),JSON.stringify(value));
 try{
  await mkdir(new URL('word%20class/',root));await mkdir(new URL('vocabulary/noun/',root),{recursive:true});await mkdir(new URL('vocabulary/verb/',root));
  await write('config.json',{title:'辞書',description:'',about:''});await write('word%20class/classes.json',[{id:'noun',name:'名詞'},{id:'verb',name:'動詞'}]);
  const a={id:'a',form:'A',meanings:['意味'],tags:[],related:['b']},b={id:'b',form:'B',meanings:['意味'],tags:[]};
  await write('vocabulary/noun/one.json',[a]);await write('vocabulary/verb/words.json',[b]);
  assert.equal((await loadAndValidate(root)).words.find(w=>w.id==='a').pos,'名詞');
  await write('vocabulary/verb/words.json',[]);await assert.rejects(loadAndValidate(root),/見つかりません/);
  await write('vocabulary/noun/one.json',[{...a,related:[]}]);assert.equal((await loadAndValidate(root)).classes.length,2);
  await write('vocabulary/verb/words.json',[{...b,id:'a'}]);await assert.rejects(loadAndValidate(root),/重複/);
  await write('vocabulary/verb/words.json',[{...b,pos:'名詞'}]);await assert.rejects(loadAndValidate(root),/一致/);
  await mkdir(new URL('vocabulary/unknown/',root));await assert.rejects(loadAndValidate(root),/未登録/);
 }finally{await rm(root,{recursive:true,force:true});}
});
test('旧データの移行はID・関連語・設定を保存し、再実行で上書きしない',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'dict-migrate-'));
 try{
  await cp(new URL('../scripts/',import.meta.url),path.join(dir,'scripts'),{recursive:true});await mkdir(path.join(dir,'site/data'),{recursive:true});
  const config={title:'名称',description:'',about:'説明'},words=[{id:'a',form:'A',pos:'名詞',meanings:['意味'],tags:[],related:['b']},{id:'b',form:'B',pos:'動詞',meanings:['意味'],tags:[]}];
  await writeFile(path.join(dir,'site/data/config.json'),JSON.stringify(config));await writeFile(path.join(dir,'site/data/words.json'),JSON.stringify(words));
  const run=()=>spawnSync(process.execPath,[path.join(dir,'scripts/migrate.mjs')],{encoding:'utf8'});const result=run();assert.equal(result.status,0,result.stderr);
  const loaded=await loadAndValidate(pathToFileURL(path.join(dir,'site/data/')));assert.deepEqual(loaded.words,words);assert.deepEqual(loaded.config,config);
  assert.deepEqual(JSON.parse(await readFile(path.join(dir,'data-before-migration/words.json'),'utf8')),words);
  assert.notEqual(run().status,0);
 }finally{await rm(dir,{recursive:true,force:true});}
});
