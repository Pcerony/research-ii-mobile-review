const test=require('node:test');
const assert=require('node:assert/strict');
const core=require('./review-core.js');
test('quote anchor keeps exact offsets and context',()=>{
  assert.equal(typeof core.createAnchor,'function');
  const anchor=core.createAnchor('前文。重复文本。后文。',3,7);
  assert.equal(anchor.quote,'重复文本');
  assert.deepEqual(core.resolveAnchor(anchor.sourceText,anchor),{start:3,end:7});
});
test('annotation follows insertions but never points at deleted text',()=>{
  const anchor=core.createAnchor('前文。被选文字。后文。',3,7);
  assert.deepEqual(core.resolveAnchor('新增。前文。被选文字。后文。',anchor),{start:6,end:10});
  assert.equal(core.resolveAnchor('前文。已经替换。后文。',anchor),null);
});
test('context disambiguates repeated text and refuses ambiguous matches',()=>{
  const anchor=core.createAnchor('甲：相同。乙：相同。',7,9);
  assert.deepEqual(core.resolveAnchor('新增。甲：相同。乙：相同。',anchor),{start:10,end:12});
  const lone=core.createAnchor('相同',0,2);
  assert.equal(core.resolveAnchor('相同，相同',lone),null);
});
test('empty selections and invalid bounds are rejected',()=>{
  assert.throws(()=>core.createAnchor('正文',1,1),RangeError);
  assert.throws(()=>core.createAnchor('正文',-1,2),RangeError);
  assert.throws(()=>core.createAnchor('正文',0,5),RangeError);
});
