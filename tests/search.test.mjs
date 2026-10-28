import {test} from 'node:test';import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {prepareWords,searchWords,readState,stateQuery} from '../site/assets/core.js';
import {validate,loadAndValidate} from '../scripts/validate.mjs';
const {config}=await loadAndValidate();
const words=[
 {id:'a',form:'TEST',ipa:'teːst',pos:'名詞',meanings:['検索用の意味'],tags:['タグ1','タグ2']},
 {id:'b',form:'VALUE',pos:'動詞',meanings:['別の意味'],tags:['タグ1']}
];
const prepared=prepareWords(words);const state=values=>({...readState(''),...values});
test('日本語・発音・複数語・全角英字の検索',()=>{assert.equal(searchWords(prepared,state({q:'検索用 意味'}))[0].id,'a');assert.equal(searchWords(prepared,state({q:'ＴＥＳＴ'}))[0].id,'a');assert.equal(searchWords(prepared,state({q:'teːst'}))[0].id,'a');});
test('タグAND/ORと品詞の組み合わせ',()=>{assert.equal(searchWords(prepared,state({tags:['タグ1','タグ2']})).length,1);assert.equal(searchWords(prepared,state({tags:['タグ1','タグ2'],mode:'any'})).length,2);assert.equal(searchWords(prepared,state({tags:['タグ1'],pos:'動詞'}))[0].id,'b');});
test('未知タグと空検索',()=>{assert.equal(searchWords(prepared,state({tags:['ないタグ']})).length,0);assert.equal(searchWords(prepared,state({q:'  '})).length,words.length);});
test('日本語・記号を含む共有URLの往復',()=>{const s=state({q:'意味 & /',tags:['タグ1','タグ2'],mode:'any',pos:'名詞',sort:'updated',page:2,word:'a'});assert.deepEqual(readState(stateQuery(s)),s);assert.equal(readState('?page=-2').page,1);});
test('異なるアクセントの綴りを勝手に同一視しない',()=>{assert.equal(searchWords(prepareWords([{id:'a',form:'ā',pos:'名詞',meanings:['長母音'],tags:[]}]),state({q:'a'})).length,0);});
test('重複ID・壊れた関連語・日付を公開前に拒否する',()=>{assert.throws(()=>validate([...words,words[0]],config),/重複/);assert.throws(()=>validate([{...words[0],related:['missing']}],config),/見つかりません/);assert.throws(()=>validate([{...words[0],related:[],updated:'2026-02-30'}],config),/実在/);});
test('HTMLとして解釈させない描画方法を維持',async()=>{const js=await readFile(new URL('../site/assets/app.js',import.meta.url),'utf8');assert(!/innerHTML|insertAdjacentHTML|document\.write|\beval\(/.test(js));});
