const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url'),{chromium}=require('playwright');
async function main(){
  fs.mkdirSync('05_输出/qa/title-motion',{recursive:true});
  const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
  const checks=[];
  try{
    const page=await browser.newPage({viewport:{width:1440,height:1000}});
    for(const lang of ['ja','zh']){
      await page.goto(pathToFileURL(path.resolve('04_PPT工作区/index.html')).href+'?lang='+lang);await page.waitForFunction(()=>window.__goSlide);
      await page.evaluate(()=>window.__goSlide(6));await page.waitForTimeout(1200);
      const samples=await page.evaluate(async()=>{
        const slide=document.querySelector('#deck .slide.is-current');window.__goSlide(7);
        const n=slide.querySelector('[data-title-compact]')||slide.querySelector('h2'),samples=[],start=performance.now();
        do{
          await new Promise(requestAnimationFrame);const style=getComputedStyle(n),node=n.firstChild,ys=[],lines=[];
          for(let i=0;i<node.textContent.length;i++){
            const r=document.createRange();r.setStart(node,i);r.setEnd(node,i+1);const y=r.getBoundingClientRect().top;
            let line=ys.findIndex(t=>Math.abs(t-y)<2);if(line<0){line=ys.length;ys.push(y);}lines.push(line);
          }
          samples.push({time:performance.now()-start,font:style.fontSize,width:style.width,lines:lines.join(',')});
        }while(performance.now()-start<1250);
        return samples;
      });
      const layouts=new Set(samples.map(s=>[s.font,s.width,s.lines].join('|')));
      assert.equal(layouts.size,1,'Title glyph layout must remain fixed throughout movement');
      const timing=await page.locator('#deck .slide.is-prev [data-title-compact]').evaluate(n=>({duration:getComputedStyle(n).transitionDuration,delay:getComputedStyle(n).transitionDelay,chapterDuration:getComputedStyle(n.closest('.slide').querySelector('.chapter')).transitionDuration}));
      assert.ok(timing.duration.split(',').every(t=>t.trim()===timing.chapterDuration.split(',')[0].trim()));assert.ok(parseFloat(timing.duration)>=.9);assert.ok(parseFloat(timing.delay)>0);
      await page.evaluate(()=>{window.__goSlide(6);window.__goSlide(7);window.__goSlide(6);});await page.waitForTimeout(1200);
      assert.equal(await page.locator('#deck .slide.is-current h2').evaluate(n=>getComputedStyle(n).opacity),'1');
      await page.evaluate(()=>window.__goSlide(7));await page.waitForTimeout(500);
      await page.screenshot({path:`05_输出/qa/title-motion/${lang}-middle.png`});
      await page.waitForTimeout(750);await page.screenshot({path:`05_输出/qa/title-motion/${lang}-settled.png`});
      checks.push({lang,frames:samples.length,stableLayouts:layouts.size,timing,rapidReturn:true});
    }
    fs.mkdirSync('05_输出/qa/title-motion',{recursive:true});fs.writeFileSync('05_输出/qa/title-motion/qa.json',JSON.stringify({checks},null,2));console.log({checks});
  }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
