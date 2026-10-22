const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
test('author-supplied GGJ and UI images replace the designated placeholders',()=>{
 const opening=fs.readFileSync('04_PPT工作区/opening-slides.cjs','utf8');
 const build=fs.readFileSync('04_PPT工作区/build-research-slides.cjs','utf8');
 assert.match(opening,/ggj-2025\.png/);assert.match(build,/tool-ui\.jpg/);
 assert.doesNotMatch(build,/design-evidence-boundary/);
 assert.match(build,/04　检验工具与用户反馈/);
 assert.doesNotMatch(build,/design-evaluation-heading"><span/);
});
