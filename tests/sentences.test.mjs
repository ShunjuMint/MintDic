import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,cp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {validate} from '../scripts/validate.mjs';

const config={title:'Test'};
const sentence={id:'s1',text:'Example',translation:'訳'};
const word={id:'w1',form:'Word',pos:'名詞',meanings:['意味'],tags:[],examples:['s1']};

test('例文ID・本文・訳・参照先を検証する',()=>{
  assert.equal(validate([word,{...word,id:'w2'}],config,[sentence]),true);
  assert.throws(()=>validate([word],config,[]),/例文 s1 が見つかりません/);
  assert.throws(()=>validate([word],config,[sentence,sentence]),/例文IDが重複/);
  assert.throws(()=>validate([{...word,examples:['s1','s1']}],config,[sentence]),/例文IDが重複/);
  assert.throws(()=>validate([word],config,[{...sentence,text:''}]),/text/);
  assert.throws(()=>validate([word],config,[{...sentence,translation:''}]),/translation/);
  assert.throws(()=>validate([word],config,[{...sentence,id:'bad id'}]),/例文ID/);
  assert.throws(()=>validate([{...word,examples:[sentence]}],config,[sentence]),/例文ID/);
});

test('複数ファイルの例文を参照順に公開し、共有例文の修正と単語追加を反映する',async()=>{
  const root=await mkdtemp(path.join(tmpdir(),'dict-sentences-'));
  const write=async(file,value)=>writeFile(path.join(root,file),JSON.stringify(value));
  const run=(script,args=[])=>spawnSync(process.execPath,[path.join(root,'scripts',script),...args],{cwd:root,encoding:'utf8'});
  try{
    await cp(new URL('../scripts/',import.meta.url),path.join(root,'scripts'),{recursive:true});
    await mkdir(path.join(root,'site/data/word class'),{recursive:true});
    await mkdir(path.join(root,'site/data/vocabulary/noun'),{recursive:true});
    await mkdir(path.join(root,'site/data/sample sentence'),{recursive:true});
    await write('site/data/config.json',config);
    await write('site/data/word class/classes.json',[{id:'noun',name:'名詞'}]);
    const stored=[{...word,examples:['s2','s1']},{...word,id:'w2'}];
    await write('site/data/vocabulary/noun/words.json',stored);
    await write('site/data/sample sentence/基本.json',[sentence]);
    await write('site/data/sample sentence/other.json',[{id:'s2',text:'Second',translation:'二つ目'}]);
    const original=await readFile(path.join(root,'site/data/vocabulary/noun/words.json'),'utf8');
    let result=run('build.mjs');assert.equal(result.status,0,result.stderr);
    const readPublished=async()=>JSON.parse(await readFile(path.join(root,'dist/data/words.json'),'utf8'));
    let published=await readPublished();
    assert.deepEqual(published[0].examples.map(e=>e.id),['s2','s1']);
    assert.equal(published[1].examples[0].text,'Example');
    assert.equal(await readFile(path.join(root,'site/data/vocabulary/noun/words.json'),'utf8'),original);
    await write('site/data/sample sentence/基本.json',[{...sentence,text:'Changed'}]);
    result=run('build.mjs');assert.equal(result.status,0,result.stderr);
    published=await readPublished();
    assert.equal(published[0].examples[1].text,'Changed');
    assert.equal(published[1].examples[0].text,'Changed');
    result=run('add-word.mjs',['--id','new','--form','New','--pos','noun','--meaning','新規']);
    assert.equal(result.status,0,result.stderr);
    const saved=JSON.parse(await readFile(path.join(root,'site/data/vocabulary/noun/words.json'),'utf8'));
    assert.deepEqual(saved[0].examples,['s2','s1']);
    await write('site/data/sample sentence/other.json',[sentence]);
    result=run('build.mjs');assert.notEqual(result.status,0);assert.match(result.stderr,/例文IDが重複/);
  }finally{await rm(root,{recursive:true,force:true});}
});
