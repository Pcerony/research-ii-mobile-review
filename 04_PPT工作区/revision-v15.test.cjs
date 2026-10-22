const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const rows=require('./research-content.cjs');
const html=fs.readFileSync('04_PPT工作区/index.html','utf8');
test('footer has no duplicate title or supplementary toggle',()=>{
 const footer=html.match(/<footer id="presentation-footer">[\s\S]*?<\/footer>/)[0];
 assert.ok(!footer.includes('indicator-title'));
 assert.ok(!footer.includes('supplement-toggle'));
 assert.ok(footer.includes('indicator-page'));
});
test('co-creation research ownership uses three groups plus a separate GGJ introduction',()=>{
 assert.equal((html.match(/data-cocreation-step=/g)||[]).length,3);
 assert.equal((html.match(/data-cocreation-intro=/g)||[]).length,1);
 assert.ok(html.includes('data-research-owner="I"'));
 assert.ok(html.includes('data-research-owner="prototype"'));
 assert.ok(html.includes('data-research-owner="II"'));
 assert.ok(html.includes('data-image-pending'));
});
test('prior work includes wearable research without universal precision or cost ranking',()=>{
 assert.match(rows[4].ja,/装着/);
 assert.match(html,/10.3389\/fpsyg.2025.1607029/);
 assert.ok(html.includes('data-tracking-route="remote"'));
 assert.ok(html.includes('data-tracking-route="wearable"'));
 assert.ok(!/穿戴式一定|必ず高精度|已兼具.*高精度/.test(rows[4].zh));
});
test('research background states attraction and has a layered framework',()=>{
 assert.match(rows[1].zh,/吸引力/);
 assert.ok(html.includes('background-framework'));
 assert.ok(html.includes('assets/sign-context.jpg'));
});
