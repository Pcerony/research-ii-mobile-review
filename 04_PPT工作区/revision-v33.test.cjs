const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
test('value page retains transferability structure without split closing',()=>{
  const t=(ja,zh,tag='span',cls='')=>`<${tag} class="${cls}" data-ja="${ja}" data-zh="${zh}">${ja}</${tag}>`;
  const body=require('./reference-value.cjs')({t});
  assert.match(body,/value-transfer/);
  assert.doesNotMatch(body,/split-half|value-ledger|value-manifesto/);
  assert.match(body,/植物園の外へ/);
  assert.match(body,/博物館/);assert.match(body,/美術館/);assert.match(body,/商業展示/);
  assert.match(body,/他分野では未検証/);
  const css=fs.readFileSync('04_PPT工作区/conference-slides.css','utf8');
  assert.match(css,/\.value-transfer\{background:var\(--paper\)/);
  assert.match(css,/\.value-domain-pair/);
});
