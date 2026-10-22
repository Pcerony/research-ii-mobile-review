const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
test('research design precedes implementation and keeps two evaluation strands',()=>{
 const s=fs.readFileSync('04_PPT工作区/build-research-slides.cjs','utf8');
 assert.ok(s.indexOf("add('research-design'")>=0&&s.indexOf("add('research-design'")<s.indexOf("add('system-architecture'"));
 assert.match(s,/design-evaluation-branches/);assert.match(s,/比较材料/);assert.match(s,/问卷・现场询问/);
 const rows=require('./research-content.cjs');assert.equal(rows.filter(r=>!r.supplement).length,20);
});
test('conclusions separate preliminary operation, research-one evidence, and observations',()=>{
 const s=fs.readFileSync('04_PPT工作区/build-research-slides.cjs','utf8');
 assert.match(s,/conclusion-two-outcomes/);assert.match(s,/作者现场观察/);assert.match(s,/访谈无记录・未量化/);
 assert.match(s,/Transformer/);assert.match(s,/potential-applications/);
 const rows=require('./research-content.cjs');assert.match(rows[17].ja,/因果/);assert.match(rows[19].zh,/潜在应用/);
});
