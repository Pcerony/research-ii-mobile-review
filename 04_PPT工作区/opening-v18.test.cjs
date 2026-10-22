const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const rows=require('./research-content.cjs');
const html=fs.readFileSync('04_PPT工作区/index.html','utf8');

test('background follows the author-provided four-node system diagram',()=>{
  assert.ok(html.includes('class="background-system"'));
  assert.equal((html.match(/class="system-node graph-node/g)||[]).length,4);
  assert.match(html,/本研究/);
  assert.match(html,/共創ワークショップ/);
  assert.match(html,/来園者/);
  assert.match(html,/植物知識/);
  assert.match(html,/改善方法/);
  assert.match(html,/改良設計/);
  assert.match(html,/解説標識/);
  assert.match(html,/system-graph-arrows/);
});

test('co-creation shows five visual phases with three detail panels',()=>{
  assert.equal((html.match(/data-cocreation-phase=/g)||[]).length,5);
  assert.equal((html.match(/data-cocreation-step=/g)||[]).length,5);
  assert.equal((html.match(/data-cocreation-key=/g)||[]).length,5);
  assert.equal((html.match(/class="co-process-step/g)||[]).length,5);
  assert.equal((html.match(/data-cocreation-panel=/g)||[]).length,4);
  assert.doesNotMatch(html,/class="co-interaction-bar/);
  assert.match(html,/data-cocreation-phase="0"/);
  assert.match(html,/data-cocreation-phase="1"/);
  assert.match(html,/data-cocreation-phase="2"/);
});

test('method page exposes the data produced by each method',()=>{
  assert.equal((html.match(/class="method-output"/g)||[]).length,8);
  assert.match(html,/サインの使いにくさ|标识使用中的困难/);
  assert.match(html,/サインへの感想|对标识的感想/);
  assert.match(html,/サインの内容|标识内容/);
  assert.match(html,/data-gaze-toggle/);
  assert.match(html,/視線から分析できる情報|视线可分析的信息/);
  assert.doesNotMatch(html,/Activity/);
  assert.doesNotMatch(html,/已有用于评价的先行研究|評価への先行研究がある/);
});

test('the prior-work page has two visual anchors and no research-purpose footer',()=>{
  assert.equal((html.match(/class="route-visual photo-fill"/g)||[]).length,2);
  assert.match(html,/screen-evaluation-setup\.webp/);
  assert.match(html,/wearable-tracking\.jpg/);
  assert.equal((html.match(/class="route-limitation-item/g)||[]).length,4);
  assert.doesNotMatch(html,/class="route-distinction/);
  assert.doesNotMatch(html,/class="route-synthesis"/);
});

test('the challenge page carries the combined-path goal concisely',()=>{
  assert.equal(rows[5].title[0],'非装着・実地評価方法の開発');
  assert.ok(html.includes('class="challenge-synthesis"'));
  assert.match(html,/二つの視線計測法の利点を組み合わせる/);
  assert.match(html,/非装着で、実物の紙面を評価する方法/);
});
