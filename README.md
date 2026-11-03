# 表示設定

## 品詞の色

`site/data/word class/classes.json` の各品詞の `color` に背景色を指定します。

```json
{"id": "noun", "name": "名詞", "color": "#C9F2C7"}
```

`#` に続く6桁のカラーコードを使用します。既存のIDと名前はそのままに、色だけを変更できます。省略・空文字の場合は薄緑になります。背景に合わせて文字色は黒か白に自動調整されます。

単語一覧・詳細画面の品詞ラベルと、選択中の品詞欄に反映します。プルダウンの選択肢自体の配色はOS・ブラウザーに依存します。語彙未登録の品詞も選択できます。

## 文字サイズ

`site/assets/style.css` 冒頭の `:root` に文字サイズをまとめています。

| 設定 | 用途 | 基本16pxの場合 |
| --- | --- | --- |
| `--font-size-small` | 補足・件数 | 13px |
| `--font-size-label` | ラベル・ボタン・品詞 | 14px |
| `--font-size-body` | 本文・意味・検索入力 | 16px |
| `--font-size-section` | 小見出し | 18px |
| `--font-size-heading` | 見出し | 24px |
| `--font-size-word` | 一覧の単語 | 28px |
| `--font-size-detail` | 詳細画面の単語 | 36px |

スマートフォンでも小さな文字へ戻さず、配置を調整します。

## 確認と公開

```sh
npm test
npm run build
python -m http.server 8000 --directory dist
```

プレビューは `http://localhost:8000/` で確認できます。データや表示設定の変更後は再ビルドしてください。`dist` は生成物です。元データは `site/data/` で管理します。

mainへのpushで既存のGitHub Actionsによる検査・公開が実行されます。
