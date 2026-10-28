import {test} from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,cp,mkdir,readFile,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import path from 'node:path';import {spawnSync} from 'node:child_process';
test('追加コマンドが保存し、重複IDの場合は元のファイルを保持する',async()=>{
 const root=await mkdtemp(path.join(tmpdir(),'dict-cli-'));
 try{
  await cp(new URL('../scripts/',import.meta.url),path.join(root,'scripts'),{recursive:true});await mkdir(path.join(root,'site'),{recursive:true});await cp(new URL('../site/data/',import.meta.url),path.join(root,'site/data'),{recursive:true});
  const run=args=>spawnSync(process.execPath,[path.join(root,'scripts/add-word.mjs'),...args],{encoding:'utf8'});
  const args=['--id','new-word','--form','TEST','--pos','名詞','--meaning','意味','--tag','タグ'];
  assert.equal(run(args).status,0);const file=path.join(root,'site/data/words.json');const saved=await readFile(file,'utf8');assert.equal(JSON.parse(saved).at(-1).form,'TEST');
  assert.notEqual(run(args).status,0);assert.equal(await readFile(file,'utf8'),saved);
 }finally{await rm(root,{recursive:true,force:true});}
});
