const test=require('node:test'),assert=require('node:assert/strict'),core=require('./review-core.js');
test('slide regions normalize reverse drags and clamp to the slide',()=>{
  assert.deepEqual(core.normalizeSlideRect({left:100,top:50,width:400,height:200},{x:420,y:230},{x:180,y:90}),{x:.2,y:.2,width:.6,height:.7});
  assert.deepEqual(core.normalizeSlideRect({left:100,top:50,width:400,height:200},{x:0,y:0},{x:900,y:900}),{x:0,y:0,width:1,height:1});
  assert.throws(()=>core.normalizeSlideRect({left:0,top:0,width:0,height:100},{x:0,y:0},{x:1,y:1}));
});
test('invalid or out-of-page slide targets cannot be replayed',()=>{
  const base={type:'slide-region',slideIndex:2,language:'zh',rect:{x:.1,y:.2,width:.3,height:.4}};
  assert.equal(core.validSlideTarget(base),true);
  for(const patch of [{rect:{x:.9,y:0,width:.3,height:.2}},{rect:{x:NaN,y:0,width:.2,height:.2}},{slideIndex:-1},{language:'oops'},{type:'unknown'}])assert.equal(core.validSlideTarget({...base,...patch}),false);
  assert.equal(core.validSlideTarget({type:'slide-page',slideIndex:0,language:'ja'}),true);
  assert.equal(core.validSlideTarget({type:'slide-text',slideIndex:0,language:'zh',path:[0],anchor:core.createAnchor('标题文本',0,2)}),true);
});
