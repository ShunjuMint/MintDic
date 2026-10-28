import {readFile,writeFile,rename,unlink} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {loadAndValidate,validate} from './validate.mjs';
const args=process.argv.slice(2), options={meaning:[],tag:[]};
const allowed=new Set(['id','form','pos','meaning','tag','ipa','reading']);
try {
 for(let i=0;i<args.length;i+=2){const name=args[i].replace(/^--/,'');if(!args[i].startsWith('--')||!allowed.has(name)||args[i+1]===undefined)throw new Error('使い方: node scripts/add-word.mjs --form "単語" --pos "品詞" --meaning "意味" --tag "タグ"');if(['meaning','tag'].includes(name))options[name].push(args[i+1]);else options[name]=args[i+1];}
 const {words,config}=await loadAndValidate();
 const word={id:options.id||'w-'+randomUUID(),form:options.form,pos:options.pos,meanings:options.meaning,tags:[...new Set(options.tag)],ipa:options.ipa||'',reading:options.reading||'',examples:[],related:[],etymology:'',notes:'',updated:new Date().toISOString().slice(0,10)};
 words.push(word);validate(words,config);
 const file=new URL('../site/data/words.json',import.meta.url);const temporary=new URL(`../site/data/.words-${randomUUID()}.tmp`,import.meta.url);
 try{await writeFile(temporary,JSON.stringify(words,null,2)+'\n','utf8');await rename(temporary,file);}finally{await unlink(temporary).catch(()=>{});}
 console.log(`登録しました: ${word.form} (${word.id})\ngit diff で確認してからcommit・pushしてください。`);
} catch(e){console.error(e.message);process.exitCode=1;}
