const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url'),{chromium}=require('playwright');
async function main(){
 const out='05_输出/qa/navigation-v18';fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 const errors=[];
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}});page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.resolve('04_PPT工作区/index.html')).href);
  await page.waitForFunction(()=>window.__goSlide);
  assert.equal(await page.locator('#indicator-title,#supplement-toggle').count(),0);
  assert.equal(await page.locator('#presentation-footer button').count(),3);
  await page.keyboard.press('Escape');assert.equal(await page.locator('#overview').evaluate(d=>d.open),true);
  await page.locator('#overview [data-language="zh"]').click();
  assert.equal(await page.locator('html').getAttribute('data-lang'),'zh');
  await page.keyboard.press('Escape');assert.equal(await page.locator('#overview').evaluate(d=>d.open),false);
  await page.keyboard.press('Escape');await page.locator('#overview [data-slide-index="4"]').click();
  assert.equal(await page.locator('#indicator-page').textContent(),'05 / 21');
  await page.evaluate(()=>window.__goSlide(1));await page.waitForTimeout(1000);
  assert.equal(await page.locator('#deck .slide.is-current .sub').count(),0);
  await page.screenshot({path:path.join(out,'desktop-footer.png')});
  await page.setViewportSize({width:390,height:844});await page.keyboard.press('Escape');
  assert.equal(await page.locator('#overview [data-language="zh"]').isVisible(),true);
  await page.screenshot({path:path.join(out,'mobile-menu.png')});
  await page.setViewportSize({width:1440,height:1000});await page.goto(pathToFileURL(path.resolve('04_PPT工作区/review.html')).href);
  await page.locator('#play:not([disabled])').waitFor();
  const frame=page.frameLocator('#deck-frame');
  await page.keyboard.press('Escape');await frame.locator('#overview[open]').waitFor();
  await page.keyboard.press('Escape');assert.equal(await frame.locator('#overview').evaluate(d=>d.open),false);
  await frame.locator('body').press('Escape');await frame.locator('#overview[open]').waitFor();
  await frame.locator('#overview [data-slide-index="4"]').click();
  await frame.locator('.slide.is-current[data-index="4"]').waitFor();assert.match(await page.locator('#position').textContent(),/第05页/);
  assert.equal(await page.locator('#narration').evaluate(a=>a.paused),true);
  await frame.locator('#overview-toggle').click();await frame.locator('#overview [data-language="ja"]').click();
  await frame.locator('html[data-lang="ja"]').waitFor();
  assert.equal(await page.locator('[data-deck-language="ja"]').getAttribute('aria-pressed'),'true');
  await frame.locator('#overview-close').click();
  await page.locator('#annotate-slide-region').click();await page.keyboard.press('Escape');
  assert.equal(await page.locator('#annotate-slide-region').getAttribute('aria-pressed'),'false');
  assert.equal(await frame.locator('#overview').evaluate(d=>d.open),false,'First Esc cancels annotation, not opens menu');
  await page.screenshot({path:path.join(out,'review-menu-seek.png')});
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'qa.json'),JSON.stringify({formalMenu:true,reviewMenu:true,synchronizedJump:true,language:true,escapeCancelsRegionFirst:true,errors},null,2));console.log({formalMenu:true,reviewMenu:true,synchronizedJump:true,errors});
 }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
