const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const rows=require('./research-content.cjs');
const deck=()=>fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
test('purpose concerns a co-creation evaluation tool, before choosing gaze',()=>{
  assert.match(rows[2].title[1],/评价工具/);
  assert.match(rows[2].group[1],/目的/);
  assert.doesNotMatch(rows[2].zh,/既有视线追踪适用于/);
});
test('prior work compares the two paths and the next page carries the combined goal',()=>{
  assert.equal(rows[4].group[0],'先行研究');
  assert.match(rows[4].ja,/Spooner/);
  assert.match(rows[5].title[1],/结合两种路径/);
  assert.match(rows[5].zh,/无需佩戴.*实体纸面/);
});
test('opening renders four honest image/placeholder states and two method columns',()=>{
  const html=deck();
  assert.doesNotMatch(html,/10 min · 芸術工学会/);
  assert.equal((html.match(/data-cocreation-panel=/g)||[]).length,4);
  assert.match(html,/method-columns/);
  assert.match(html,/sign-context.jpg/);
  assert.match(html,/10.3390\/jzbg5030029/);
});
