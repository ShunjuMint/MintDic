import {test} from 'node:test';
import assert from 'node:assert/strict';
import {classColors,validClassColor} from '../site/assets/appearance.js';
test('品詞色の未設定・無効値には既定色を使い、明暗に合わせて文字色を選ぶ',()=>{
 assert.deepEqual(classColors('#000000'),{background:'#000000',foreground:'#ffffff'});
 assert.deepEqual(classColors('#ffffff'),{background:'#ffffff',foreground:'#000000'});
 for(const value of [undefined,'','red','#abc','url(x)',123])assert.equal(classColors(value).background,'#c9f2c7');
 assert(validClassColor('#ACECA1'));assert(!validClassColor('#12345678'));
});
test('背景色に対して黒または白の文字で4.5以上のコントラストを保つ',()=>{
 const luminance=hex=>{const [r,g,b]=hex.slice(1).match(/../g).map(p=>{const v=parseInt(p,16)/255;return v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4;});return .2126*r+.7152*g+.0722*b;};
 for(let r=0;r<=255;r+=17)for(let g=0;g<=255;g+=17)for(let b=0;b<=255;b+=17){
  const color='#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('');const chosen=classColors(color);
  const x=luminance(color),y=luminance(chosen.foreground);assert((Math.max(x,y)+.05)/(Math.min(x,y)+.05)>=4.5);
 }
});
