// ラテン文字の代替表示を挟まず、専用フォントの読み込み成功後に表示します。
export async function loadLanguageFont(fonts = document.fonts, root = document.documentElement) {
  try {
    if (!fonts) return false;
    const faces = await fonts.load('400 1em "TumRare"', 'tum');
    if (!faces.length || !faces.every(face => face.status === 'loaded')) return false;
    root.classList.add('language-font-ready');
    return true;
  } catch {
    // 読み込めない場合も、別行のラテン文字で単語を確認できます。
    return false;
  }
}
