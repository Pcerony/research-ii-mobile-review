const fs=require('node:fs');
const rows=require('./research-content.cjs');
const clock=s=>`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
for(const [lang,mainPath,supplementPath]of [['ja','発表原稿_日本語.md','補足原稿_日本語.md'],['zh','演讲稿_中文审查.md','补充稿_中文审查.md']]){
  for(const supplemental of [false,true]){
    let time=0;
    const blocks=rows.map((r,i)=>({...r,index:i})).filter(r=>!!r.supplement===supplemental).map(r=>{
      const end=time+r.seconds;
      const heading=`## ${String(r.index+1).padStart(2,'0')}｜${clock(time)}–${clock(end)}｜${r.group[lang==='ja'?0:1]}：${r.title[lang==='ja'?0:1]}`;
      time=end;return `${heading}\n\n${r[lang]}`;
    });
    if(!supplemental&&time!==420)throw new Error('Main talk must allocate exactly 420 seconds.');
    const title=lang==='ja'?`研究Ⅱ・${supplemental?'補足原稿':'発表原稿'}（第31稿）`:`研究Ⅱ・${supplemental?'补充稿':'演讲稿'}（第31稿・中文对照）`;
    const count=rows.filter(r=>!r.supplement).length;
    const intro=supplemental?(lang==='ja'?'質疑応答用。本編には含めない。':'问答用补充，不计入发表正文。'):(lang==='ja'?`本文のみを読み上げる。${count}枚・7分は配分であり、本人の実測ではない。`:`只朗读正文。${count}页、7分钟为分配目标，尚未本人朗读实测。`);
    const memo=lang==='ja'?'編集メモ：実験年、刺激対応、測定条件と保存実装は引き続き核査する。本編の熱図は記録全体の出力例。':'编辑备注：继续核对实验年份、刺激对应、测量条件与保存实现；正文热图是完整记录输出示例。';
    fs.writeFileSync('04_PPT工作区/'+(supplemental?supplementPath:mainPath),`# ${title}\n\n${intro}\n\n${blocks.join('\n\n')}\n\n---\n\n${memo}\n`);
  }
}
console.log({main:rows.filter(r=>!r.supplement).length,supplements:rows.filter(r=>r.supplement).length,jaCharacters:rows.filter(r=>!r.supplement).reduce((n,r)=>n+r.ja.replace(/\s/g,'').length,0)});
