const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {lexer} = require('marked');
const {chromium} = require('playwright');
const {pathToFileURL} = require('node:url');
async function main(){
  const html=fs.readFileSync('04_PPT工作区/index.html','utf8');
  const count=[...html.matchAll(/<section class="slide\b/g)].length;
  const evidence=lexer(fs.readFileSync('02_证据/实验核心数据与AOI统计汇总表.md','utf8'));
  const table=evidence.find(t=>t.type==='table'&&t.header[0].text==='参与者');
  const expected=table.rows.filter(r=>/^\*\*P\d{2}\*\*$/.test(r[0].text)).map(r=>({id:r[0].text.replaceAll('*',''),control:parseFloat(r[1].text),intervention:parseFloat(r[2].text)}));
  const actual=[...html.matchAll(/<g data-participant="(P\d{2})" data-control="([\d.]+)" data-intervention="([\d.]+)"/g)].map(m=>({id:m[1],control:Number(m[2]),intervention:Number(m[3])}));
  assert.deepEqual(actual,expected);
  const provenance=JSON.parse(fs.readFileSync('04_PPT工作区/heatmap-preview-provenance.json','utf8'));
  assert.equal(provenance.records.length,18);
  assert.ok(provenance.records.every(r=>r.pixelExact&&fs.existsSync(r.output)));
  assert.ok(!/src="(?:\.\.\/|https?:|file:)/.test(html));
  const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
  let sections;
  try{
    const page=await browser.newPage();
    await page.goto(pathToFileURL(path.resolve('04_PPT工作区/index.html')).href);
    await page.waitForFunction(()=>window.__goSlide);
    sections=await page.locator('#deck .slide').evaluateAll(nodes=>nodes.map(n=>{
      const body=n.querySelector('.composition')||n.querySelector('.reference-cover');
      const structure=el=>el.tagName+'('+[...el.children].map(structure).join(',')+')';
      return {layout:n.dataset.layout,speech:n.dataset.speech||'01',structure:structure(body),text:body.textContent};
    }));
    assert.equal(new Set(sections.map(s=>s.structure)).size,count,'Each content DOM structure must differ.');
    assert.ok(sections.every(s=>!s.text.includes('15名')&&!s.text.includes('15人')&&!s.text.includes('第1回・暫定')));
    const order=sections.map(s=>Number(s.speech));
    assert.ok(order.every((n,i)=>i===0||n>=order[i-1]));
    const declared=sections.map(s=>s.layout);
    assert.equal(new Set(declared).size,count);
    assert.equal(count,21);
    assert.equal(await page.locator('#deck .slide[data-supplement="true"]').count(),2);
    assert.ok(!sections.some(s=>s.layout==='gaze-definition'));
    assert.equal(await page.locator('#deck .learning-background a[href*="jstage"]').count(),1);
    assert.equal(await page.locator('#deck .workflow-overview figure').count(),4);
    const aoiTable=evidence.find(t=>t.type==='table'&&t.header[0].text==='设计原则类别'&&t.header[1].text.includes('10s'));
    for(const [id,term]of [['A','Inspirational'],['R','Audience'],['S','基础知识'],['other','其他区域']]){
      const row=aoiTable.rows.find(r=>r[0].text.includes(term));
      const values=row.slice(1,3).map(r=>parseFloat(r.text.replaceAll('*','')));
      const actual=await page.locator(`#deck [data-aoi="${id}"]`).evaluate(n=>[Number(n.dataset.control),Number(n.dataset.intervention)]);
      assert.deepEqual(actual,values);
    }
    assert.ok(await page.locator('#deck .slide:has(img)').count()>=8);
    const heatmapIndex=sections.findIndex(s=>s.layout==='heatmap-explorer');
    await page.evaluate(i=>window.__goSlide(i),heatmapIndex);
    await page.locator('#deck [data-heatmap-pick="2"]').hover();
    assert.equal(await page.locator('#deck [data-heatmap-current]').textContent(),'P03');
    await page.locator('#deck [data-heatmap-pick="2"]').focus();
    await page.keyboard.press('ArrowDown');
    assert.equal(await page.locator('#deck [data-heatmap-current]').textContent(),'P04');
  }finally{await browser.close();}
  const result={slides:sections.length,uniqueLayoutNames:count,uniqueContentStructures:count,orderedBySpeech:true,pairedDataMatchSource:true,heatmapCrops:18,heatmapHoverAndKeyboard:true,heatmapsAreQuantitativeEvidence:false,initialWindowSeconds:10,analysisN:9,speechSections:sections.map(s=>s.speech)};
  fs.mkdirSync('05_输出/qa/research-v10',{recursive:true});
  fs.writeFileSync('05_输出/qa/research-v10/narrative-alignment.json',JSON.stringify(result,null,2));
  console.log(result);
}
main().catch(e=>{console.error(e);process.exitCode=1;});
