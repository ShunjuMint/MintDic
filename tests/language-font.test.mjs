import test from 'node:test';
import assert from 'node:assert/strict';
import {loadLanguageFont} from '../site/assets/language-font.js';

test('専用フォントの完了を待ってから表示する', async () => {
  const classes = new Set();
  const root = {classList: {add: name => classes.add(name)}};
  let finish;
  const fonts = {load: () => new Promise(resolve => {finish = resolve;})};
  const pending = loadLanguageFont(fonts, root);
  assert.equal(classes.size, 0);
  finish([{status: 'loaded'}]);
  assert.equal(await pending, true);
  assert.ok(classes.has('language-font-ready'));
});

test('失敗・未登録・未完了の場合は代替フォントを表示しない', async () => {
  for (const fonts of [null, {load: async () => []}, {load: async () => [{status: 'error'}]}, {load: async () => {throw new Error('network');}}]) {
    const classes = new Set();
    assert.equal(await loadLanguageFont(fonts, {classList: {add: name => classes.add(name)}}), false);
    assert.equal(classes.size, 0);
  }
});
