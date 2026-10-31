import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtemp,
  cp,
  mkdir,
  writeFile,
  readFile,
  rm
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

test(
  '追加コマンドが保存し、重複IDの場合は元のファイルを保持する',
  async () => {
    const root = await mkdtemp(
      path.join(tmpdir(), 'dict-cli-')
    );

    try {
      // スクリプトだけをコピーし、辞書データはコピーしない
      await cp(
        new URL('../scripts/', import.meta.url),
        path.join(root, 'scripts'),
        { recursive: true }
      );

      // テスト専用のデータを作成
      const data = path.join(root, 'site', 'data');
      const classDir = path.join(data, 'word class');
      const nounDir = path.join(data, 'vocabulary', 'noun');

      await mkdir(classDir, { recursive: true });
      await mkdir(nounDir, { recursive: true });

      await writeFile(
        path.join(data, 'config.json'),
        JSON.stringify({
          title: 'テスト用辞書',
          description: '',
          about: '',
          repositoryUrl: ''
        }),
        'utf8'
      );

      await writeFile(
        path.join(classDir, 'classes.json'),
        JSON.stringify([
          { id: 'noun', name: '名詞' }
        ]),
        'utf8'
      );

      const file = path.join(nounDir, 'words.json');
      await writeFile(file, '[]\n', 'utf8');

      const run = args => spawnSync(
        process.execPath,
        [path.join(root, 'scripts', 'add-word.mjs'), ...args],
        { encoding: 'utf8', cwd: root }
      );

      const args = [
        '--id', 'new-word',
        '--form', 'TEST',
        '--pos', '名詞',
        '--meaning', '意味',
        '--tag', 'タグ'
      ];

      // 正常に追加できる
      const first = run(args);
      assert.equal(first.status, 0, first.stderr);

      const saved = await readFile(file, 'utf8');
      const words = JSON.parse(saved);

      assert.equal(words.length, 1);
      assert.equal(words[0].id, 'new-word');
      assert.equal(words[0].form, 'TEST');

      // 同じIDの追加は失敗し、保存済みデータは変わらない
      const duplicate = run(args);
      assert.notEqual(duplicate.status, 0);
      assert.match(duplicate.stderr, /重複/);
      assert.equal(await readFile(file, 'utf8'), saved);
    } finally {
      await rm(root, {
        recursive: true,
        force: true
      });
    }
  }
);