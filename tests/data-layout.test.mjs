import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtemp,
  mkdir,
  writeFile,
  rm
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadAndValidate } from '../scripts/validate.mjs';

test(
  '品詞を独立登録し、フォルダから品詞を付与、全体でID・関連語を検証',
  async () => {
    const dir = await mkdtemp(
      path.join(tmpdir(), 'dict-layout-')
    );
    const root = pathToFileURL(dir + path.sep);

    const write = async (file, value) => {
      await writeFile(
        new URL(file, root),
        JSON.stringify(value),
        'utf8'
      );
    };

    try {
      await mkdir(new URL('word%20class/', root));

      await mkdir(
        new URL('vocabulary/noun/', root),
        { recursive: true }
      );

      await mkdir(new URL('vocabulary/verb/', root));

      await write('config.json', {
        title: '辞書',
        description: '',
        about: ''
      });

      await write('word%20class/classes.json', [
        { id: 'noun', name: '名詞' },
        { id: 'verb', name: '動詞' }
      ]);

      const a = {
        id: 'a',
        form: 'A',
        meanings: ['意味'],
        tags: [],
        related: ['b']
      };

      const b = {
        id: 'b',
        form: 'B',
        meanings: ['意味'],
        tags: []
      };

      await write('vocabulary/noun/one.json', [a]);
      await write('vocabulary/verb/words.json', [b]);

      // フォルダから品詞が付与される
      const loaded = await loadAndValidate(root);

      assert.equal(
        loaded.words.find(word => word.id === 'a').pos,
        '名詞'
      );

      // 存在しない関連語を拒否する
      await write('vocabulary/verb/words.json', []);

      await assert.rejects(
        loadAndValidate(root),
        /見つかりません/
      );

      // 語彙が空でも品詞は登録されている
      await write('vocabulary/noun/one.json', [
        { ...a, related: [] }
      ]);

      assert.equal(
        (await loadAndValidate(root)).classes.length,
        2
      );

      // 別の品詞フォルダとのID重複を拒否する
      await write('vocabulary/verb/words.json', [
        { ...b, id: 'a' }
      ]);

      await assert.rejects(
        loadAndValidate(root),
        /重複/
      );

      // 単語のposと所属フォルダの不一致を拒否する
      await write('vocabulary/verb/words.json', [
        { ...b, pos: '名詞' }
      ]);

      await assert.rejects(
        loadAndValidate(root),
        /一致/
      );

      // 未登録の品詞フォルダを拒否する
      await mkdir(new URL('vocabulary/unknown/', root));

      await assert.rejects(
        loadAndValidate(root),
        /未登録/
      );
    } finally {
      await rm(root, {
        recursive: true,
        force: true
      });
    }
  }
);