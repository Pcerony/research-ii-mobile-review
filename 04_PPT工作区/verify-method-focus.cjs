const fs=require('node:fs');
const assert=require('node:assert/strict');
const rows=require('./research-content.cjs');
const survey=require('./questionnaire-summary.json');
const html=fs.readFileSync('04_PPT工作区/index.html','utf8');
const main=rows.filter(r=>!r.supplement);
assert.equal(main.length,21);
assert.equal((html.match(/<section class="slide\b/g)||[]).length,22,'21 main and 1 supplementary slide');
for(const layout of ['learning-background','evaluation-gap','research-scope','verification-frame','operation-evidence','survey-feedback','validation-roadmap'])assert.ok(html.includes(`data-layout="${layout}"`),layout);
assert.match(main[1].ja,/植物園/);assert.match(main[1].ja,/共創/);
assert.match(main[3].ja,/記憶.*テスト.*得点/);
assert.match(main[2].ja,/ツールを開発/);assert.match(main[5].ja,/負担/);
assert.match(main[16].ja,/成功率.*校正.*所要時間/);
assert.match(main[17].ja,/共通/);assert.match(main[17].ja,/今回の実験だけの評価ではありません/);
assert.equal(survey.totalResponses,4);assert.equal(survey.linkedToEyeTrackingN9,false);
for(const item of survey.items){
  assert.equal(item.counts.reduce((a,b)=>a+b,0),item.n);
  assert.ok(html.includes(`data-survey="${item.id}"`));
  assert.ok(html.includes(`data-survey="${item.id}" data-counts="${item.counts.join(',')}"`));
}
assert.deepEqual(survey.items.map(x=>x.counts),[[0,0,2,2,0],[2,0,0,2,0]]);
assert.ok(!/成功率100|全員.*緊張しなかった|既存.*定量.*存在しない/.test(main.map(r=>r.ja).join('')));
console.log({mainSlides:21,allSlides:22,backgroundSeparated:true,toolIsResearchObject:true,surveyN:4,surveyCommonScope:true});
