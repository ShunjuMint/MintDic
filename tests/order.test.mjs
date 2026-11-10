import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareWords,searchWords,readState,stateQuery} from '../site/assets/core.js';
const words=prepareWords([
 {id:'z',form:'zeta',pos:'名詞',meanings:['共通'],tags:['対象'],updated:'2026-01-01'},
 {id:'a',form:'alpha',pos:'動詞',meanings:['別'],tags:[],updated:'2026-03-01'},
 {id:'m',form:'mu',pos:'名詞',meanings:['共通'],tags:['対象'],updated:'2026-02-01'}
]);
const ids=values=>searchWords(words,{...readState(''),...values}).map(w=>w.id);
test('初期表示と絞り込みでJSONの配列順を保持する',()=>{
 assert.deepEqual(ids({}),['z','a','m']);
 for(const filters of [{q:'共通'},{pos:'名詞'},{tags:['対象']}])assert.deepEqual(ids(filters),['z','m']);
 assert.equal(readState('?sort=unknown').sort,'source');
});
test('明示的な並べ替えから登録順に戻せて元データを変更しない',()=>{
 assert.deepEqual(ids({sort:'form'}),['a','m','z']);
 assert.deepEqual(ids({sort:'updated'}),['a','m','z']);
 assert.deepEqual(ids({sort:'source'}),['z','a','m']);
 assert.deepEqual(words.map(w=>w.id),['z','a','m']);
 for(const sort of ['source','form','updated']){
  const state={...readState(''),sort};
  assert.deepEqual(readState(stateQuery(state)),state);
 }
});
