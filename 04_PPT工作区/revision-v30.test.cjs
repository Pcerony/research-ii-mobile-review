const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
test('software explanation is prose with a basic-functions heading and linked step 04',()=>{
 const s=fs.readFileSync('04_PPT工作区/build-research-slides.cjs','utf8');
 assert.match(s,/software-description/);assert.match(s,/基本機能/);assert.match(s,/基础功能/);
 assert.match(s,/design-next-connector/);
 const co=require('./cocreation-content.cjs');assert.equal(co.groups[0].figures[0].image,'co-field-study.png');assert.equal(co.groups[0].figures[1].image,'co-issues.png');
 const rows=require('./research-content.cjs');assert.equal(rows.filter(r=>!r.supplement).length,18);
});
