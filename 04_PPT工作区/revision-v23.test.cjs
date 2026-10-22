const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const opening=require('./opening-slides.cjs');
const t=(ja,zh,tag='span',cls='')=>`<${tag} class="${cls}">${ja}|${zh}</${tag}>`;
const pages=opening({t,h:(...args)=>t(...args,'h2'),sub:()=>'',image:src=>`<img src="${src}">`,caption:(...args)=>t(...args,'figcaption'),source:()=>''});
test('workshop starts without research strips and details name the papers',()=>{
 const html=pages[1][1];assert.match(html,/class="co-research-spans" hidden/);
 assert.match(html,/参加型・システム型問題抽出フレームワーク/);
 assert.match(html,/公共実地環境向け非接触型視線計測評価ツールの開発と検証/);
 const nav=fs.readFileSync('04_PPT工作区/reference-navigation.js','utf8');
 assert.match(nav,/animateCocreation/);assert.match(nav,/prefers-reduced-motion/);
});
test('gaze explanation belongs to the right column with honest data definitions',()=>{
 const html=pages[2][1];assert.match(html,/gaze-status-right/);
 assert.match(html,/观看顺序/);assert.match(html,/区域停留时间/);assert.match(html,/未被观看的区域/);
 assert.match(html,/离开目标区域的次数/);assert.match(html,/不能直接判断走神/);
 assert.doesNotMatch(html,/gaze-data-bottom/);assert.doesNotMatch(html,/gaze-status-wide/);
});
