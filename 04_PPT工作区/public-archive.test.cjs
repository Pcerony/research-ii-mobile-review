const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
test('public rebuild removes stale files outside its allowlist',()=>{
 const root='05_输出/github-public';fs.mkdirSync(root,{recursive:true});fs.writeFileSync(root+'/stale-private-fixture.txt','test fixture, not private data');
 require('node:child_process').execFileSync(process.execPath,['04_PPT工作区/build-public-archive.cjs']);
 assert.ok(!fs.existsSync(root+'/stale-private-fixture.txt'));
});
test('public archive has explicit redaction manifest and no raw identity-bearing heatmaps',()=>{
 const root='05_输出/github-public',audit=JSON.parse(fs.readFileSync(root+'/PUBLIC-ARCHIVE.json'));
 assert.ok(audit.replaced.includes('assets/experiment-scene.jpg'));
 assert.ok(!fs.existsSync(root+'/03_图表与素材'));
 const text=fs.readFileSync(root+'/00_项目管理/14_事后问卷来源与采用边界.md','utf8');
 assert.ok(!text.includes('edit#responses'));assert.ok(!text.includes('1ym96Z_'));
 const data=fs.readFileSync(root+'/04_PPT工作区/review-data.js','utf8');assert.ok(data.includes('PUBLIC_REDACTED'));
});
