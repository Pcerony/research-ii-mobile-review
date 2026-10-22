const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url'),{chromium}=require('playwright');
async function main(){
  const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true}),checks=[];
  const out='05_输出/qa/title-flow';fs.mkdirSync(out,{recursive:true});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:1000}});
    for(const lang of ['ja','zh']){
      await page.goto(pathToFileURL(path.resolve('04_PPT工作区/index.html')).href+'?lang='+lang);await page.waitForFunction(()=>window.__goSlide);
      assert.equal(await page.locator('#deck [data-title-compact]').count(),0,'No cross-faded duplicate title');
      await page.evaluate(()=>window.__goSlide(6));await page.waitForTimeout(1200);
      const samples=await page.evaluate(async()=>{
        const slide=document.querySelector('#deck .slide.is-current'),title=slide.querySelector('h2'),parts=[...title.querySelectorAll('[data-title-line]')],samples=[];
        const original=title.textContent;window.__goSlide(7);const start=performance.now();
        do{
          await new Promise(requestAnimationFrame);
          samples.push({time:performance.now()-start,text:title.textContent,opacity:getComputedStyle(title).opacity,parts:parts.map(n=>({text:n.textContent,width:n.offsetWidth,height:n.offsetHeight,transform:getComputedStyle(n).transform,opacity:getComputedStyle(n).opacity}))});
        }while(performance.now()-start<1150);
        return {samples,original};
      });
      assert.ok(samples.samples[0].parts.length>=2,'Predetermined line groups exist');
      for(const sample of samples.samples){assert.equal(sample.text,samples.original);assert.equal(sample.opacity,'1');for(const p of sample.parts)assert.equal(p.opacity,'1');}
      const layouts=new Set(samples.samples.map(s=>JSON.stringify(s.parts.map(p=>[p.text,p.width,p.height]))));assert.equal(layouts.size,1,'Group membership and glyph layout never change');
      assert.ok(new Set(samples.samples.map(s=>s.parts.map(p=>p.transform).join('|'))).size>10,'Same line groups continuously travel and scale');
      const timing=await page.locator('#deck .slide.is-prev').evaluate(s=>({chapter:getComputedStyle(s.querySelector('.chapter')).transitionDuration,chapterDelay:getComputedStyle(s.querySelector('.chapter')).transitionDelay,title:getComputedStyle(s.querySelector('[data-title-line]')).transitionDuration}));
      assert.equal(parseFloat(timing.chapter),.76);assert.equal(parseFloat(timing.chapterDelay),0);assert.ok(parseFloat(timing.title)>.76&&parseFloat(timing.title)<=1);
      await page.screenshot({path:path.join(out,`${lang}-settled.png`)});
      await page.evaluate(()=>{window.__goSlide(6);window.__goSlide(7);window.__goSlide(6);});await page.waitForTimeout(1200);
      assert.ok(await page.locator('#deck .slide.is-current [data-title-line]').evaluateAll(nodes=>nodes.every(n=>new DOMMatrix(getComputedStyle(n).transform).isIdentity)));
      await page.evaluate(()=>window.__goSlide(7));await page.waitForTimeout(450);
      await page.screenshot({path:path.join(out,`${lang}-middle.png`)});
      await page.waitForTimeout(750);
      checks.push({lang,frames:samples.samples.length,stableLayouts:layouts.size,continuousSameText:true,timing,rapidReturn:true});
    }
    fs.writeFileSync(path.join(out,'qa.json'),JSON.stringify({checks},null,2));console.log({checks});
  }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
