const fs=require('node:fs'),assert=require('node:assert/strict');
const parse=path=>[...fs.readFileSync(path,'utf8').split('\n---')[0].matchAll(/## (\d{2})｜(\d\d:\d\d)–(\d\d:\d\d)｜([^\n]+)\n([\s\S]*?)(?=\n## |$)/g)].map(m=>({id:m[1],start:m[2],end:m[3],paragraphs:m[5].trim().split(/\n\s*\n/)}));
const ja=parse('04_PPT工作区/発表原稿_日本語.md'),zh=parse('04_PPT工作区/演讲稿_中文审查.md');
const qaJa=parse('04_PPT工作区/補足原稿_日本語.md'),qaZh=parse('04_PPT工作区/补充稿_中文审查.md');
assert.equal(ja.length,19);assert.equal(qaJa.length,2);
for(const [left,right]of [[ja,zh],[qaJa,qaZh]]){
  assert.equal(left.length,right.length);
  left.forEach((s,i)=>{
    assert.equal(s.start,i?left[i-1].end:'00:00');
    assert.equal(s.id,right[i].id);assert.equal(s.start,right[i].start);assert.equal(s.end,right[i].end);
    assert.equal(s.paragraphs.length,right[i].paragraphs.length);
    s.paragraphs.forEach((p,j)=>{
      const numbers=text=>text.replaceAll('两天','2天').match(/\d+(?:\.\d+)?/g);
      assert.deepEqual(numbers(p),numbers(right[i].paragraphs[j]));
      assert.ok(!/[?？]/.test(p));
    });
  });
}
assert.equal(ja.at(-1).end,'07:00');assert.equal(qaJa[0].id,'20');assert.equal(qaJa[0].paragraphs.length,4);
const spoken=ja.flatMap(s=>s.paragraphs).join(''),chars=spoken.replace(/\s/g,'').length;
assert.ok(chars>=1900&&chars<=2500,'Incremental research narrative remains a seven-minute allocation, not a timed rehearsal.');
assert.match(spoken,/SIGN Visual Attention/);
assert.match(spoken,/累計15名/);assert.ok(!/排除|除外した6名/.test(spoken));
for(const n of ['38.6','45.3'])assert.ok(spoken.includes(n),n);
assert.match(qaJa[1].paragraphs.join(''),/方針/);
assert.ok(!/ホーソン効果を解消|無誤差|因果効果を証明|理解率が向上/.test(spoken));
const result={version:38,mainSections:19,supplementSections:2,mainParagraphs:19,supplementParagraphs:5,spokenCharacters:chars,allocatedSeconds:420,timedBySpeaker:false,bilingualNumbersMatch:true,longestJapaneseSentence:Math.max(...spoken.split('。').map(s=>s.length)),contentAndLanguageNeedHumanReview:true};
fs.mkdirSync('05_输出/qa/narrative-v38',{recursive:true});fs.writeFileSync('05_输出/qa/narrative-v38/check.json',JSON.stringify(result,null,2));console.log(result);
