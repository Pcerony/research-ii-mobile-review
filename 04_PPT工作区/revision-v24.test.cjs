const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const source=fs.readFileSync('04_PPT工作区/build-research-slides.cjs','utf8');
test('page seven explains the paper projection route and three software functions',()=>{
 assert.match(source,/paper-technical-route/);assert.match(source,/software-functions/);
 for(const term of ['映射校准','视线追踪','数据分析','纸面透视投影变换'])assert.ok(source.includes(term),term);
});
test('mapping distinguishes adjustment, projection and unverified accuracy',()=>{
 assert.match(source,/mapping-details/);assert.match(source,/mapping-constraint/);
 assert.match(source,/目标点与估计位置/);assert.match(source,/不代表误差已消除/);
});
test('each two-by-two workflow step separates participant and operator',()=>{
 assert.match(source,/workflow-step-copy/);assert.match(source,/step\.participant/);assert.match(source,/step\.operator/);
 const css=fs.readFileSync('04_PPT工作区/conference-slides.css','utf8');
 assert.match(css,/\.workflow-overview \.static-workflow\{[^}]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
});
