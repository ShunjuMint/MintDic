export const normalize = value => String(value ?? '').normalize('NFKC').toLocaleLowerCase('ja');
export function prepareWords(words) {
  return words.map(w => ({...w, _search: normalize([w.form, w.reading, w.ipa, w.pos, ...w.meanings, ...w.tags, w.etymology, w.notes, ...(w.examples ?? []).flatMap(e => [e.text, e.translation])].join(' '))}));
}
export function searchWords(words, state) {
  const tokens = normalize(state.q).trim().split(/\s+/).filter(Boolean);
  const results = words.filter(w => tokens.every(t => w._search.includes(t)) && (!state.pos || w.pos === state.pos) &&
    (!state.tags.length || (state.mode === 'any' ? state.tags.some(t => w.tags.includes(t)) : state.tags.every(t => w.tags.includes(t))))); 
  if (state.sort === 'updated') results.sort((a,b) => (b.updated ?? '').localeCompare(a.updated ?? '') || a.form.localeCompare(b.form,'ja'));
  else if (state.sort === 'form') results.sort((a,b) => a.form.localeCompare(b.form,'ja') || a.id.localeCompare(b.id));
  return results;
}
export function readState(search) {
  const p = new URLSearchParams(search);
  return {q:p.get('q') ?? '', tags:[...new Set(p.getAll('tag'))], pos:p.get('pos') ?? '', mode:p.get('mode') === 'any' ? 'any':'all', sort:['form','updated'].includes(p.get('sort')) ? p.get('sort'):'source', page: Math.max(1, Math.min(100000, Number.parseInt(p.get('page'),10) || 1)), word:p.get('word') ?? ''};
}
export function stateQuery(s) {
  const p = new URLSearchParams();
  if(s.q) p.set('q',s.q);
  s.tags.forEach(t=>p.append('tag',t));
  if(s.pos) p.set('pos',s.pos);
  if(s.mode==='any') p.set('mode','any');
  if(s.sort==='updated'||s.sort==='form') p.set('sort',s.sort);
  if(s.page>1) p.set('page',String(s.page));
  if(s.word) p.set('word',s.word);
  return p.toString();
}
