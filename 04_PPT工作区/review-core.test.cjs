const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const core=require('./review-core.js');
test('parse the new speech without a fixed 14-slide or 29-paragraph limit',()=>{
  const rows=core.parseNarrative(fs.readFileSync('04_PPT工作区/演讲稿_中文审查.md','utf8'));
  assert.equal(rows.length,19);
  assert.ok(rows[0].text.startsWith('大家好'));
  assert.ok(rows.at(-1).text.endsWith('谢谢大家。'));
  assert.ok(rows.every(r=>!r.text.includes('D-016')));
  assert.deepEqual(rows.map(r=>r.slide),Array.from({length:19},(_,i)=>i));
});
test('supplementary script has four workflow clips; heatmap is in the main talk',()=>{
  const rows=core.parseNarrative(fs.readFileSync('04_PPT工作区/补充稿_中文审查.md','utf8'));
  assert.deepEqual(rows.map(r=>r.slide),[19,19,19,19,20]);
});
test('timeline seek uses measured durations and handles exact boundaries',()=>{
  const clips=[{duration:10},{duration:20},{duration:5}];
  assert.deepEqual(core.locateTime(clips,-2),{index:0,offset:0});
  assert.deepEqual(core.locateTime(clips,10),{index:1,offset:0});
  assert.deepEqual(core.locateTime(clips,29),{index:1,offset:19});
  assert.deepEqual(core.locateTime(clips,100),{index:2,offset:5});
  assert.equal(core.elapsedBefore(clips,2),30);
});
test('speech normalization makes percentages pronounceable without changing values',()=>{
  const text=core.spokenText('38.6%到45.3%，相差6.7个百分点。AOI和WebGazer.js。');
  assert.ok(text.includes('百分之38.6'));
  assert.ok(text.includes('百分之45.3'));
  assert.ok(text.includes('6.7个百分点'));
  assert.ok(text.includes('A O I'));
});
test('heatmap cues follow audio progress, not wall-clock time',()=>{
  assert.equal(core.heatmapAt(4,10,40,14),null);
  assert.equal(core.heatmapAt(14,0,30,14),0);
  assert.equal(core.heatmapAt(14,14,30,14),3);
  assert.equal(core.heatmapAt(14,29,30,14),7);
});
