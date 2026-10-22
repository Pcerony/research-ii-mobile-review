const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url'),{chromium}=require('playwright');
async function main(){
 const out='05_输出/qa/workshop-motion-v26';fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 const checks=[],errors=[];
 try{
  const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));
  for(const width of [1440,390])for(const lang of ['ja','zh']){
   await page.setViewportSize({width,height:width===1440?1000:844});
   await page.goto(pathToFileURL(path.resolve('04_PPT工作区/index.html')).href+'?lang='+lang);
   await page.waitForFunction(()=>window.__goSlide);await page.evaluate(()=>window.__goSlide(2));await page.waitForTimeout(900);
   const slide=page.locator('.slide.is-current'),rail=slide.locator('.co-process-wrap');
   assert.equal(await slide.locator('.co-research-spans').isVisible(),false);
   await slide.locator('[data-cocreation-key="0"]').click();await page.waitForTimeout(180);
   const intermediate=await rail.evaluate(el=>({top:el.getBoundingClientRect().top,active:el.getAnimations().some(a=>a.playState==='running')}));
   assert.equal(intermediate.active,true);await page.screenshot({path:path.join(out,`${lang}-${width}-transition.png`)});
   await page.waitForTimeout(650);const settled=await rail.boundingBox();
   assert.ok(intermediate.top>settled.y+1,'Flow rail interpolates from the intro position');
   assert.equal(await slide.locator('.co-owner-i.is-active').count(),1);
   assert.equal(await slide.locator('.co-owner-ii.is-active').count(),0);
   assert.equal(await slide.locator('.co-detail-head:visible').evaluate(el=>getComputedStyle(el).borderTopWidth),'0px');
   assert.ok((await slide.locator('.co-detail-head:visible').innerText()).includes(lang==='ja'?'参加型・システム型問題抽出フレームワーク':'参与式・系统性问题提取框架'));
   const colors=await slide.locator('.co-research-spans>span').evaluateAll(els=>els.map(el=>getComputedStyle(el).color));assert.notEqual(colors[0],colors[1]);
   await slide.locator('[data-cocreation-key="3"]').click();await page.waitForTimeout(700);
   assert.equal(await slide.locator('.co-owner-ii.is-active').count(),1);
   assert.ok((await slide.locator('.co-detail-head:visible').innerText()).includes(lang==='ja'?'公共実地環境向け':'面向公共实地环境'));
   await page.screenshot({path:path.join(out,`${lang}-${width}-research-II.png`)});
   await slide.evaluate(s=>{for(const key of ['0','4','2'])s.querySelector(`[data-cocreation-key="${key}"]`).click();});await page.waitForTimeout(700);
   assert.equal(await slide.locator('[data-cocreation-panel="1"]').isVisible(),true);
   await slide.locator('[data-cocreation-key="2"]').click();await page.waitForTimeout(700);
   assert.equal(await slide.locator('.co-research-spans').isVisible(),false);
   checks.push({width,lang,animated:true,ownership:true,paperTitles:true,rapidReturn:true});
  }
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.locator('.slide.is-current [data-cocreation-key="0"]').click();
  assert.equal(await page.locator('.slide.is-current .co-process-wrap').evaluate(el=>el.getAnimations().length),0);
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'qa.json'),JSON.stringify({checks,reducedMotion:true,errors},null,2));console.log({checks:checks.length,reducedMotion:true,errors});
 }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
