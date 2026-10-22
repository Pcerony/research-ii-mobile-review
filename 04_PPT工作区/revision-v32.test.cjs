const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
test('author footer, denser static context and two-by-two design follow the new feedback',()=>{
 const build=fs.readFileSync('04_PPT工作区/build-research-slides.cjs','utf8');
 assert.match(build,/2026年10月24日/);assert.match(build,/research-design-grid/);
 const position=fs.readFileSync('04_PPT工作区/research-position.cjs','utf8');
 assert.match(position,/co-field-study/);assert.match(position,/co-issues/);assert.match(position,/position-process/);
 assert.match(build,/apparatus-flat-v32/);assert.match(fs.readFileSync('04_PPT工作区/conference-slides.css','utf8'),/workflow-schematic-v32/);
 const workflowLine=build.split('\n').find(l=>l.startsWith("add('workflow-overview'"));
 assert.doesNotMatch(workflowLine,/workflow-generated/);assert.match(workflowLine,/i===3/);
 const rows=require('./research-content.cjs');assert.equal(rows.filter(r=>!r.supplement).length,19);assert.equal(rows.filter(r=>!r.supplement).reduce((n,r)=>n+r.seconds,0),420);
});
