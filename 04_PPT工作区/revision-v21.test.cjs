const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const rows=require('./research-content.cjs');
const html=fs.readFileSync('04_PPT工作区/index.html','utf8');
test('privacy moves to supplement and field validation becomes one page',()=>{
  assert.equal(rows.filter(r=>!r.supplement).length,20);
  assert.equal(rows.filter(r=>r.supplement).length,2);
  assert.equal(rows.filter(r=>!r.supplement).reduce((s,r)=>s+r.seconds,0),600);
  const sections=[...html.matchAll(/<section class="slide\b[\s\S]*?<\/section>/g)].map(m=>m[0]);
  assert.match(sections.find(s=>s.includes('data-layout="privacy-flow"')),/data-supplement="true"/);
  assert.equal(sections.filter(s=>s.includes('data-layout="field-validation"')).length,1);
  assert.doesNotMatch(html,/data-layout="verification-frame"|data-layout="field-protocol"/);
});
test('method outputs explain signs and expansion belongs to the right column',()=>{
  for(const phrase of ['标识内容的记忆与理解程度','对标识的评价分数','标识纸面上的观看位置与分布'])assert.ok(html.includes(phrase),phrase);
  assert.match(html,/class="gaze-status gaze-status-right"/);
  assert.match(html,/screen-evaluation-setup\.webp/);
  assert.ok(!html.includes('src="assets/screen-tracking.jpg"'));
});
