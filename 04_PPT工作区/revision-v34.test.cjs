const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
test('value reference informs content, not the project palette',()=>{
 const css=fs.readFileSync('04_PPT工作区/conference-slides.css','utf8');
 assert.doesNotMatch(css,/value-lime|#C5E803/i);
 const t=(a,b,tag='span',cls='')=>`<${tag} class="${cls}">${a} ${b}</${tag}>`;
 const body=require('./reference-value.cjs')({t});
 for(const word of ['博物館','動物園','商業展示','VR','未検証','拡張'])assert.ok(body.includes(word),word);
 assert.match(css,/\.value-transfer\{background:var\(--paper\)/);
});
