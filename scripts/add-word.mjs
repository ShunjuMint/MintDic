import {readFile,writeFile,rename,unlink} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {loadAndValidate,validate} from './validate.mjs';
const args=process.argv.slice(2), options={meaning:[],tag:[]};
const allowed=new Set(['id','form','pos','meaning','tag','ipa','reading']);
try {
 for(let i=0;i<args.length;i+=2){const name=args[i].replace(/^--/,'');if(!args[i].startsWith('--')||!allowed.has(name)||args[i+1]===undefined)throw new Error('使い方: node scripts/add-word.mjs --form "単語" --pos "品詞" --meaning "意味" --tag "タグ"');if(['meaning','tag'].includes(name))options[name].push(args[i+1]);else options[name]=args[i+1];}
 const {words,config,classes}=await loadAndValidate();
 const selected=classes.find(c=>c.id===options.pos)||classes.find(c=>c.name===options.pos);
 if(!selected)throw new Error('先に classes.json に品詞を登録してください');
 const word={id:options.id||'w-'+randomUUID(),form:options.form,pos:selected.name,meanings:options.meaning,tags:[...new Set(options.tag)],ipa:options.ipa||'',reading:options.reading||'',examples:[],related:[],etymology:'',notes:'',updated:new Date().toISOString().slice(0,10)};
 words.push(word);validate(words,config);
 const file=new URL(`../site/data/vocabulary/${selected.id}/words.json`,import.meta.url);
 let batch=[];try{batch=JSON.parse(await readFile(file,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
 const {pos,...stored}=word;batch.push(stored);
 const temporary=new URL(`../site/data/vocabulary/${selected.id}/.words-${randomUUID()}.tmp`,import.meta.url);
 try{await writeFile(temporary,JSON.stringify(batch,null,2)+'\n','utf8');await rename(temporary,file);}finally{await unlink(temporary).catch(()=>{});}
 console.log(`登録しました: ${word.form} (${word.id})\ngit diff で確認してからcommit・pushしてください。`);
} catch(e){console.error(e.message);process.exitCode=1;}
