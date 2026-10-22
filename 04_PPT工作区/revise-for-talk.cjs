// Content-only authoring pass; the original reference CSS and animation remain intact.
const fs = require('fs');
const file = '04_PPT工作区/index.html';
let html = fs.readFileSync(file,'utf8');
if(html.includes('id="narrative-layout"'))throw new Error('Legacy authoring pass disabled. Use build-narrative-slides.cjs.');
const existing = [...html.matchAll(/<section class="slide\b[\s\S]*?<\/section>/g)].map(m=>m[0]);
if(existing.length !== 14) throw new Error('Expected 14 source slides');
const esc = s => s.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
const t = (ja,zh,tag='span',cls='') => `<${tag} class="${cls}" data-ja="${esc(ja)}" data-zh="${esc(zh)}">${ja}</${tag}>`;
const title = (ja,zh) => t(ja,zh,'h2','h-xl-zh');
const note = (ja,zh) => t(ja,zh,'p','note');
function slide(i,chapter,nameJa,nameZh,headingJa,headingZh,body,claim='E-04') {
  return `<section class="slide" data-index="${i}" data-chapter="${chapter}" data-layout="S16" data-title-ja="${nameJa}" data-title-zh="${nameZh}" data-claim="${claim}"><div class="canvas-card talk-slide">
  <div class="slide-head"><div class="kicker">RESEARCH II / ${String(i+1).padStart(2,'0')}</div><div class="chapter">${claim}</div></div>
  <div class="talk-heading">${title(headingJa,headingZh)}</div><div class="talk-visual">${body}</div>
  <div class="bottom"><span>SIGN VISUAL ATTENTION</span><span>${String(i+1).padStart(2,'0')} / 14</span></div></div></section>`;
}
function comparison(values,metricJa,metricZh,delta) {
  let lines='';
  for(const n of [0,25,50,75,100]) {
    const x=220+n*8.2;
    lines+=`<line x1="${x}" x2="${x}" y1="45" y2="335" stroke="#e0e0e0"/><text x="${x}" y="375" text-anchor="middle">${n}%</text>`;
  }
  values.forEach((value,i)=>{
    const y=100+i*145;
    lines+=`<text x="0" y="${y+36}" data-ja="${i?'改良条件':'従来条件'}" data-zh="${i?'改良条件':'传统条件'}">${i?'改良条件':'従来条件'}</text><rect x="220" y="${y}" width="${value*8.2}" height="54" rx="5" fill="${i?'#0B5D3B':'#a3a3a3'}"/><text class="chart-value" x="${235+value*8.2}" y="${y+40}">${value.toFixed(1)}%</text>`;
  });
  return `<div class="result-context">${t(metricJa,metricZh)}<span>10 s · N = 9</span></div><svg class="result-chart" viewBox="0 0 1100 400" role="img" aria-label="0 to 100 percent comparison">${lines}</svg><div class="result-delta">+${delta} <span>pt</span>${t('第1回・暫定','第一批・暂定','span','result-qualifier')}</div>`;
}
const data = [
  ['P01',55.1,23.9],['P02',45.1,59.9],['P03',21.8,53.3],
  ['P04',15.1,11.5],['P05',50.9,59.1],['P06',44.5,57.9],
  ['P07',46.6,53.3],['P08',39.5,34.2],['P09',28.4,54.6]
];
let paired='';
for(const n of [0,25,50,75,100]) {
  const x=140+n*8;
  paired+=`<line x1="${x}" x2="${x}" y1="20" y2="415" stroke="#e0e0e0"/><text x="${x}" y="452" text-anchor="middle">${n}%</text>`;
}
data.forEach(([id,a,b],i)=>{
  const y=40+i*43,x1=140+a*8,x2=140+b*8;
  paired+=`<g data-participant="${id}" data-control="${a}" data-intervention="${b}"><title>${id}: ${a}% → ${b}%</title><text x="18" y="${y+7}">${id}</text><line x1="${x1}" x2="${x2}" y1="${y}" y2="${y}" stroke="${b>a?'#0B5D3B':'#737373'}" stroke-width="3"/><circle cx="${x1}" cy="${y}" r="7" fill="#fafaf8" stroke="#737373" stroke-width="2"/><circle cx="${x2}" cy="${y}" r="7" fill="#0B5D3B"/></g>`;
});
const slides = [];
slides.push(existing[0].replace('王 平成 · 九州大学芸術工学府','王 平成 · 張 彦芳 / 九州大学').replace('2026 · 芸術工学会','芸術工学府 · 芸術工学研究院'));
slides.push(slide(1,1,'目次','目录','本日の流れ','今天的路线',`<div class="talk-route">${[
  ['01','現場の課題','现场问题'],['02','ツールの設計','工具设计'],['03','実地での比較','实地比较'],['04','検証の範囲','验证边界']
].map(([n,ja,zh])=>`<div><b>${n}</b>${t(ja,zh,'h3')}</div>`).join('')}</div>`,'STRUCTURE'));
slides.push(slide(2,1,'背景','背景','改善案を、現場の注意と照らす','让改良方案与现场注意相互对照',`<div class="talk-photo-layout"><div class="image-frame"><img src="assets/field-observation.jpg" alt="植物園温室の解説環境"></div><div class="question-link">${t('共創による改善案','共创改良方案','div','question-item')}<div class="question-gap">?</div>${t('紙面上の注意分布','纸面上的注意分布','div','question-item')}</div></div>`,'E-01'));
slides.push(slide(3,1,'設計要件','设计要求','実物の紙面を、装着なしで測る','面向实体纸面，无需穿戴',`<div class="requirement-table"><div>${t('紙面に対応づける','对应到纸面','h3')}<span class="relation-arrow">→</span>${t('透視マッピング','透视映射','h3')}</div><div>${t('装着を求めない','不要求穿戴','h3')}<span class="relation-arrow">→</span>${t('操作者と役割を分ける','与操作者分工','h3')}</div></div>${note('設計要件と、その対応','设计要求及其对应方式')}`));
slides.push(slide(4,2,'システム','系统','視線推定と、紙面の対応づけを分ける','区分视线估计与纸面配准',`<div class="mapping-flow"><div class="mapping-unit">${t('視線推定','视线估计','h3')}<p>Web camera<br>WebGazer.js</p><div class="calibration-dots">${Array.from({length:9},()=>'<i></i>').join('')}</div>${t('9点校正','九点校准','div','mapping-label')}</div><span class="relation-arrow">→</span><div class="mapping-unit">${t('紙面への変換','转换到纸面','h3')}<div class="paper-geometry"><i></i><i></i><i></i><i></i><span>H</span></div>${t('四隅の対応づけ','四角对应','div','mapping-label')}</div><span class="relation-arrow">→</span><div class="mapping-unit">${t('領域別に集計','按区域汇总','h3')}<div class="aoi-mini"><span>A</span><span>R</span><span>S</span></div><p>Heatmap / AOI</p></div></div>${note('処理概念の模式図 / 座標変換は精度保証ではない','处理概念示意 / 坐标转换不等于精度保证')}`));
slides.push(slide(5,2,'操作手順','操作流程','参加者は紙を見る。操作は支援者が担う。','参与者看纸面，操作者负责系统。',`<figure class="workflow-figure"><img src="assets/four-step-workflow.png" alt="姿勢確認、9点校正、サイン提示、解析の操作記録"></figure>${note('操作の記録 / 定量比較の刺激対応を示す図ではない','操作记录 / 不作为定量比较刺激对应的证据')}<div class="condition-strip">${t('姿勢を大きく変えない条件','以姿势不大幅变化为前提')}<span>01 → 02 → 03 → 04</span></div>`));
slides.push(slide(6,2,'比較材料','比较材料','A/R/Sは、比較のための設計枠組み','A/R/S是比较输入的设计框架',`<div class="stimulus-schematic"><div class="schematic-column">${t('従来条件','传统条件','h3')}<div class="mock-paper"><div class="mock-title"></div><div class="mock-picture"></div><div class="mock-lines">${'<i></i>'.repeat(6)}</div></div></div><span class="relation-arrow">↔</span><div class="schematic-column">${t('改良条件','改良条件','h3')}<div class="mock-paper modular"><span>A</span><span>S</span><span>R</span></div></div></div><div class="ars-key"><span>A · Atmosphere</span><span>R · Relevance</span><span>S · Structure</span></div>${note('情報構造の模式図 / 実際の刺激画像ではない','信息结构示意 / 不是实际刺激图像')}`));
slides.push(slide(7,3,'参加者と分析','参与者与分析','参加者は二回に分けて追加','参与者分两批加入',`<div class="sample-flow"><div><div class="sample-number">9</div>${t('第1回','第一批','h3')}</div><span class="relation-arrow">+</span><div><div class="sample-number">6</div>${t('第2回','第二批','h3')}</div><span class="relation-arrow">=</span><div><div class="sample-number">15</div>${t('参加者合計','参与者合计','h3')}</div></div>${note('現図は第1回の分析 / 最終集計は確認中','现图为第一批分析 / 最终汇总待核实')}<div class="field-location">${t('福岡市植物園・温室区域','福冈市植物园・温室区域')}</div>`));
slides.push(slide(8,3,'指標','指标','二つの百分率は、分母が異なる','两个百分率，分母不同',`<div class="metric-concepts"><div><div class="metric-symbol coverage-symbol"><i></i><i></i><i></i><i></i></div>${t('文字領域の被覆','文字区域覆盖','h3')}${t('被覆の広さ','覆盖广度','p')}</div><div><div class="metric-symbol share-symbol"><span>AOI</span><span>∑</span></div>${t('AOIの注意分配','AOI注意分配','h3')}${t('領域内熱力 / 全体熱力','区域内热力 / 整体热力','p')}</div></div><div class="condition-strip"><span>Initial 10 s</span>${t('理解率・厳密な注視時間ではない','不是理解率或严格注视时长')}</div>`));
slides.push(slide(9,4,'結果：被覆','结果：覆盖','文字領域の平均被覆','文字区域平均覆盖',comparison([38.6,45.3],'文字領域視線被覆率','文字区域视线覆盖率','6.7'),'E-02'));
slides.push(slide(10,4,'結果：R領域','结果：R区域','R領域への注意分配','R区域的注意分配',comparison([5.0,21.4],'熱力強度の構成比','热力强度构成比','16.4'),'E-03'));
slides.push(slide(11,4,'個体差','个体差异','平均の上昇は、全員の上昇ではない','平均上升，不等于全员上升',`<div class="paired-legend"><span><i class="control-dot"></i>${t('従来条件','传统条件')}</span><span><i class="intervention-dot"></i>${t('改良条件','改良条件')}</span><span>${t('上昇6名 / 下降3名','上升6人 / 下降3人')}</span></div><svg class="individual-chart" viewBox="0 0 1100 480" role="img" aria-label="P01 to P09 text coverage paired comparison">${paired}</svg>${note('第1回・前10秒 / N=9','第一批・前10秒 / N=9')}`,'E-02'));
slides.push(slide(12,5,'限界','局限','実地運用と、精度・因果を区別する','区分实地运行、精度与因果',`<div class="scope-table"><div>${t('実地での運用','实地运行','h3')}${t('予備的に試行','初步试用','span','scope-tested')}</div><div>${t('測定の精度','测量精度','h3')}${t('基準機器との比較は未実施','尚未与基准设备比较')}</div><div>${t('設計要因の因果','设计因素的因果','h3')}${t('交絡要因を分離できていない','尚未分离混杂因素')}</div></div>${note('次段階：基準比較 → 条件別誤差 → 比較設計・サンプル拡大','下一步：基准比较 → 条件误差 → 比较设计与样本扩展')}`));
slides.push(slide(13,5,'結論','结论','共創の改善案を、現場の分布と照らす','让共创改良方案与现场分布相互对照',`<div class="closing-relation">${t('紙面上の注意分布','纸面上的注意分布','div')}<span class="relation-arrow">→</span>${t('次の改善仮説','下一轮改进假说','div')}</div><div class="closing-boundary">${t('試作ツールと予備的な実地適用','试作工具与初步实地应用','p')}<span>PoC</span></div>${t('ご清聴ありがとうございました','谢谢','p','closing-thanks')}`));
let index=0;
html=html.replace(/<section class="slide\b[\s\S]*?<\/section>/g,()=>slides[index++]);
const extra = fs.readFileSync('04_PPT工作区/talk-layout.css','utf8');
html=html.replace(/<style id="talk-layout">[\s\S]*?<\/style>/,'');
html=html.replace('</head>',`<style id="talk-layout">${extra}</style></head>`);
fs.writeFileSync(file,html);
console.log('Revised 14 slides against the talk; original reference style retained.');
