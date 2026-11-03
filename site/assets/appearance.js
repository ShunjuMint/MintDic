// 品詞の背景色は #RRGGBB。未指定時は既定色を使用。
export const validClassColor = value => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);
export function classColors(value) {
  const background = validClassColor(value) ? value : '#c9f2c7';
  const rgb = background.slice(1).match(/../g).map(part => {
    const v = parseInt(part, 16) / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  const luminance = rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
  const blackContrast = (luminance + 0.05) / 0.05;
  const whiteContrast = 1.05 / (luminance + 0.05);
  return {background, foreground: blackContrast >= whiteContrast ? '#000000' : '#ffffff'};
}
