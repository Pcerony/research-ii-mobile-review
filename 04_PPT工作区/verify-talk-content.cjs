const fs = require('fs');
const {lexer} = require('marked');
const md = fs.readFileSync('04_PPT工作区/発表原稿_日本語.md','utf8');
const html = fs.readFileSync('04_PPT工作区/index.html','utf8');
const evidence = fs.readFileSync('02_证据/实验核心数据与AOI统计汇总表.md','utf8');
const seconds = s => s.split(':').reduce((a,b)=>a*60+Number(b),0);
const blocks = [...md.matchAll(/## (\d{2})｜(\d\d:\d\d)–(\d\d:\d\d)｜([^\n]+)\n([\s\S]*?)(?=\n## |\n---|$)/g)];
if (blocks.length !== 14) throw new Error('This legacy audit requires 14 slide-aligned blocks. Use verify-narrative.cjs for the independent narrative.');
const slides = [...html.matchAll(/<section class="slide\b[\s\S]*?<\/section>/g)].map(m=>m[0]);
const timings = blocks.map((m,i)=>{
  const speech = m[5].split('\n').filter(s=>s.trim()&&!s.startsWith('【')).join('');
  const screen = slides[i].replace(/<[^>]*>/g,'').replace(/\s+/g,'');
  const repeatedSentences = speech.split('。').filter(s=>s.length>=24&&screen.includes(s));
  return {slide:Number(m[1]),start:seconds(m[2]),end:seconds(m[3]),allocatedSeconds:seconds(m[3])-seconds(m[2]),spokenCharacters:speech.length,repeatedSentences};
});
const table = lexer(evidence).find(t=>t.type==='table'&&t.header[0].text==='参与者');
const sourcePairs = table.rows.filter(row=>/^\*\*P\d{2}\*\*$/.test(row[0].text)).map(row=>({id:row[0].text.replaceAll('*',''),control:parseFloat(row[1].text),intervention:parseFloat(row[2].text)}));
const chartPairs = [...html.matchAll(/<g data-participant="(P\d{2})" data-control="([\d.]+)" data-intervention="([\d.]+)"/g)].map(m=>({id:m[1],control:Number(m[2]),intervention:Number(m[3])}));
const mean = k => sourcePairs.reduce((sum,p)=>sum+p[k],0)/sourcePairs.length;
const median = k => sourcePairs.map(p=>p[k]).sort((a,b)=>a-b)[4];
const assets=[...new Set([...html.matchAll(/src="(assets\/[^\"]+)"/g)].map(m=>m[1]))];
const originalStyleHash = require('node:crypto').createHash('sha256').update(html.match(/<style id="reference-style">([\s\S]*?)<\/style>/)[1]).digest('hex');
const result={
  spokenCharacters:timings.reduce((sum,t)=>sum+t.spokenCharacters,0),
  allocatedSeconds:timings.reduce((sum,t)=>sum+t.allocatedSeconds,0),
  uninterruptedSchedule:timings.every((t,i)=>i===0?t.start===0:t.start===timings[i-1].end),
  timedBySpeaker:false,
  repeatedSentences:timings.flatMap(t=>t.repeatedSentences),
  pairDataMatchesSource:JSON.stringify(sourcePairs)===JSON.stringify(chartPairs),
  means:{control:mean('control'),intervention:mean('intervention')},
  exploratoryCounts:{up:sourcePairs.filter(p=>p.intervention>p.control).length,down:sourcePairs.filter(p=>p.intervention<p.control).length},
  sourceConflict:{field:'表5改良条件中位数',listed:54.6,recomputed:median('intervention'),usedInTalk:false},
  assets,missingAssets:assets.filter(p=>!fs.existsSync('04_PPT工作区/'+p)),
  originalStyleHash,
  timings
};
fs.mkdirSync('05_输出/qa/talk-review',{recursive:true});
fs.writeFileSync('05_输出/qa/talk-review/content-audit.json',JSON.stringify(result,null,2));
console.log(JSON.stringify(result,null,2));
if(result.allocatedSeconds!==600||!result.uninterruptedSchedule||!result.pairDataMatchesSource||result.missingAssets.length||result.repeatedSentences.length)process.exitCode=1;
