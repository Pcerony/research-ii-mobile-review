const test=require('node:test'),assert=require('node:assert/strict');
const rows=require('./research-content.cjs');
test('page five explains benefits and limitations without ranking all devices',()=>{
  const p=rows[4];
  for(const word of ['佩戴负担','屏幕','普通摄像头','头部位置','真实环境','佩戴适配','费用','具体设备'])assert.ok(p.zh.includes(word),word);
  assert.match(p.ja,/装着の負担/);assert.match(p.ja,/頭の位置/);assert.match(p.ja,/費用/);
  assert.doesNotMatch(p.zh,/精度最高|精度最低|一定更准确|无需校准/);
  assert.equal(p.seconds,35);
  assert.equal(rows.filter(r=>!r.supplement).reduce((n,r)=>n+r.seconds,0),420);
});
