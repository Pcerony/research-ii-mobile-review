const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
test('seven-minute narrative follows the revised method-first sequence',()=>{
 const rows=require('./research-content.cjs'),main=rows.filter(r=>!r.supplement);
 assert.equal(main.length,19);assert.equal(main.reduce((n,r)=>n+r.seconds,0),420);
 assert.equal(main[5].group[1],'研究目的');assert.match(main[6].group[1],/方法/);
 assert.equal(main[13].chapter,4);assert.equal(main[14].chapter,4);
 assert.match(main.at(-1).ja,/ありがとうございました/);
 const html=fs.readFileSync('04_PPT工作区/index.html','utf8');
 assert.doesNotMatch(html, /data-layout="aoi-metrics"/);
 assert.match(html,/data-layout="closing-thanks"/);assert.match(html,/workflow-greenhouse-topcamera/);
 const position=html.match(/data-layout="research-position"[\s\S]*?<\/section>/)[0];assert.doesNotMatch(position,/<button/);
 assert.match(html,/王 平成｜九州大学大学院 芸術工学府/);assert.match(html,/張 彦芳｜九州大学大学院 芸術工学研究院/);
});
