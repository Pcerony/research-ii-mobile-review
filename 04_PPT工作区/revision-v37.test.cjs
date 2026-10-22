const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const rows=require('./research-content.cjs');
test('v37 adopts phone opening while retaining research and measurement boundaries',()=>{
  assert.match(rows[0].zh,/很高兴/);
  assert.match(rows[0].zh,/尚未验证/);
  assert.match(rows[1].zh,/市民参加/);
  assert.doesNotMatch(rows[1].zh,/越来越常见/);
  assert.match(rows[2].zh,/研究者与标识专家/);
  assert.doesNotMatch(rows[2].zh,/嫩诞生/);
  assert.match(rows[3].zh,/问卷和测试/);
  assert.doesNotMatch(rows[3].zh,/定性调查|普遍缺乏/);
  assert.match(rows[3].zh,/不直接测量理解/);
  assert.match(rows[2].ja,/研究者とサインの専門家/);
  assert.equal(rows.filter(r=>!r.supplement).reduce((n,r)=>n+r.seconds,0),420);
});
test('generated script and audio metadata identify the new source edition',()=>{
  const audio=JSON.parse(fs.readFileSync(__dirname+'/review-audio-manifest.json'));
  assert.equal(audio.speechVersion,37);
  assert.match(fs.readFileSync(__dirname+'/演讲稿_中文审查.md','utf8'),/第37稿/);
});
