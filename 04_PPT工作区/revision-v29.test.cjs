const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
test('results consist of two method-focused pages and keep evidence boundaries',()=>{
 const rows=require('./research-content.cjs'),main=rows.filter(r=>!r.supplement);
 assert.equal(main.length,18);assert.equal(main.filter(r=>r.chapter===4).length,2);
 assert.equal(main.reduce((s,r)=>s+r.seconds,0),600);
 assert.match(main[10].zh,/2026年5月28日/);assert.match(main[10].zh,/累计参与15人/);assert.match(main[10].zh,/分析的9人/);
 assert.match(main[13].zh,/可以进一步分析/);assert.match(main[14].zh,/一个方向偏移/);assert.match(main[14].zh,/没有用数值比较/);
 const s=fs.readFileSync('04_PPT工作区/build-research-slides.cjs','utf8');
 assert.match(s,/tool-results-content/);assert.match(s,/workflow-axonometric/);assert.doesNotMatch(s,/field-validation-boundary/);
 const content=require('./tool-results-content.cjs')({t:(a,b)=>a+b,h:(a,b)=>a+b,pairs:'',aoi:[],survey:require('./questionnaire-summary.json')});
 assert.equal(content.length,2);assert.match(content[1][1],/未量化/);
});
