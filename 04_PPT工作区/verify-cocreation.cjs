const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url'),{chromium}=require('playwright');
async function main(){
 const out='05_输出/qa/cocreation-v26';fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 const errors=[],checks=[];
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true});page.on('pageerror',e=>errors.push(e.message));
  for(const width of [1440,390])for(const lang of ['ja','zh']){
   await page.setViewportSize({width,height:width===1440?1000:844});await page.goto(pathToFileURL(path.resolve('04_PPT工作区/index.html')).href+'?lang='+lang);
   await page.waitForFunction(()=>window.__goSlide);await page.evaluate(()=>window.__goSlide(2));await page.waitForTimeout(1000);
   const slide=page.locator('#deck .slide.is-current');
   assert.equal(await slide.locator('[data-cocreation-panel="intro"]').isVisible(),true);
   for(const i of ['intro',0,1,2,3,4]){
    if(i==='intro')assert.equal(await slide.locator('[data-cocreation-panel="intro"]').isVisible(),true);
    else await slide.locator('[data-cocreation-key="'+i+'"]').click();
    await page.waitForTimeout(700);
    assert.equal(await slide.locator('[data-cocreation-panel]:visible').count(),1);
    assert.equal(await slide.locator('.co-research-spans').isVisible(),i!=='intro');
    if(i===0||i===1)assert.equal(await slide.locator('.co-process-step.is-active').count(),2);
    const audit=await slide.evaluate(s=>{
     const b=s.getBoundingClientRect(),bad=[];const p=s.querySelector('[data-cocreation-panel]:not([hidden])');
     for(const el of p.querySelectorAll('h3,p,strong,figure,img,figcaption')){const r=el.getBoundingClientRect();if(r.left<b.left-1||r.right>b.right+1||r.top<b.top-1||r.bottom>b.bottom+1)bad.push(el.textContent);}
     return {bad,missing:[...p.querySelectorAll('img')].filter(img=>!img.naturalWidth).length};
    });assert.deepEqual(audit,{bad:[],missing:0});
    await page.screenshot({path:path.join(out,lang+'-'+width+'-'+i+'.png')});checks.push({lang,width,step:i});
   }
   await slide.locator('[data-cocreation-key="4"]').click();assert.equal(await slide.locator('[data-cocreation-panel="intro"]').isVisible(),true);
   await slide.locator('[data-cocreation-key="2"]').press('Home');assert.equal(await slide.locator('[data-cocreation-key="0"]').getAttribute('aria-selected'),'true');
   await page.keyboard.press('ArrowRight');assert.equal(await slide.locator('[data-cocreation-key="1"]').getAttribute('aria-selected'),'true');
   assert.equal(await slide.getAttribute('data-index'),'2');
  }
  await page.setViewportSize({width:1440,height:1000});await page.goto(pathToFileURL(path.resolve('04_PPT工作区/review.html')).href);
  await page.locator('#play:not([disabled])').waitFor();await page.locator('.clip-location').nth(2).click();
  const frame=page.frameLocator('#deck-frame');const slide=frame.locator('#deck .slide.is-current');
  await slide.locator('[data-cocreation-key="2"]').click();assert.equal(await slide.locator('[data-cocreation-panel="1"]').isVisible(),true);
  await page.locator('#annotate-slide-page').click();await page.locator('#note-text').fill('原型制作页的意见');await page.locator('#save-note').click();
  const pending=page.waitForEvent('download');await page.locator('#export-notes').click();const payload=JSON.parse(fs.readFileSync(await(await pending).path(),'utf8'));
  assert.equal(payload.notes[0].target.state.cocreation,'2');
  await slide.locator('[data-cocreation-key="0"]').click();await page.locator('.note-location').click();await page.waitForTimeout(700);
  assert.equal(await slide.locator('[data-cocreation-key="2"]').getAttribute('aria-selected'),'true');
  await frame.locator('[data-slide-review-highlight="slide-page"]').waitFor();
  await page.locator('.note-location').click();await page.waitForTimeout(700);assert.equal(await slide.locator('[data-cocreation-panel="1"]').isVisible(),true);
  await page.screenshot({path:path.join(out,'review-restored.png')});
  await slide.locator('[data-cocreation-key="2"]').click();
  assert.equal(await slide.locator('[data-cocreation-panel="intro"]').isVisible(),true);
  await page.locator('#annotate-slide-page').click();await page.locator('#note-text').fill('GGJ介绍页的意见');await page.locator('#save-note').click();
  await slide.locator('[data-cocreation-key="0"]').click();await page.locator('.note-location').nth(1).click();await page.waitForTimeout(700);
  assert.equal(await slide.locator('[data-cocreation-panel="intro"]').isVisible(),true);
  await page.locator('#transcript-tab').click();
  await page.locator('.clip-location').nth(3).click();
  await frame.locator('.slide.is-current [data-gaze-toggle]').click();
  assert.equal(await frame.locator('.slide.is-current [data-gaze-status]').isVisible(),true);
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'qa.json'),JSON.stringify({checks,reviewStateRestored:true,errors,version:'v26'},null,2));console.log({states:checks.length,reviewStateRestored:true,errors,version:'v26'});
 }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
