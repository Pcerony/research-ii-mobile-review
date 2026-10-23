const crypto=require('node:crypto'),assert=require('node:assert/strict');
const hash=text=>crypto.createHash('sha256').update(text).digest('hex');
function validate(rows,ledger){
 assert.equal(rows.length,ledger.pages.length,'中日对照页数变化，需重新逐页审查');
 rows.forEach((row,i)=>{const page=String(i+1).padStart(2,'0'),review=ledger.pages[i];
  assert.equal(review.slide,i+1,`${page}页序不一致`);
  assert.equal(hash(row.zh),review.zhHash,`${page}中文已改，请同步日语并重新核对信息点`);
  assert.equal(hash(row.ja),review.jaHash,`${page}日语已改，请与中文重新核对信息点`);
  assert.ok(review.points.length,`${page}缺少逐页信息检查记录`);
 });return {pages:rows.length,reviewVersion:ledger.reviewVersion};
}
function validateClips(rows,clips,language,scope){
 const expected=rows.flatMap((r,i)=>!!r.supplement===(scope==='supplement')?r[language].trim().split(/\n\s*\n/).map(text=>({slide:i,text:text.trim()})):[]);
 assert.deepEqual(clips.map(c=>({slide:c.slide,text:c.text})),expected,`${language}/${scope}正文与已复核源稿不一致，请同步中日原稿后再生成`);
}
module.exports={validate,validateClips};
if(require.main===module)console.log(validate(require('./research-content.cjs'),require('./bilingual-alignment.json')));
