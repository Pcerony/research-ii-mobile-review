const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {chromium}=require('playwright');
async function main(){
  const out='05_输出/qa/workflow-v12';fs.mkdirSync(out,{recursive:true});
  const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
  const checks=[],errors=[];
  try{
    const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));
    for(const [name,size]of [['desktop',{width:1440,height:1000}],['narrow',{width:390,height:844}]]){
      await page.setViewportSize(size);
      for(const lang of ['ja','zh']){
        await page.goto(pathToFileURL(path.resolve('04_PPT工作区/index.html')).href+'?lang='+lang);
        await page.waitForFunction(()=>window.__goSlide);
        await page.addStyleTag({content:'#deck,.slide,.slide-shell{transition:none!important}'});
        const slide=page.locator('#deck .operating-panorama');
        const tabs=slide.locator('[data-workflow-step]');
        assert.equal(await tabs.count(),4,'Four independently selectable workflow steps are required.');
        const index=await slide.evaluate(el=>el.closest('.slide').dataset.index);
        await page.evaluate(i=>window.__goSlide(Number(i)),index);
        for(let step=0;step<4;step++){
          await tabs.nth(step).click();
          assert.equal(await tabs.nth(step).getAttribute('aria-selected'),'true');
          const panels=slide.locator('[data-workflow-panel]:visible');
          assert.equal(await panels.count(),1);
          assert.equal(await panels.getAttribute('data-workflow-panel'),String(step));
          assert.ok(await panels.locator('img').evaluateAll(imgs=>imgs.length>0&&imgs.every(i=>i.complete&&i.naturalWidth>0)));
          const overflow=await panels.evaluate(panel=>{
            const r=panel.getBoundingClientRect();return [...panel.querySelectorAll('img,h3,p,dt,dd')].some(n=>{const b=n.getBoundingClientRect();return b.right>r.right+2||b.bottom>r.bottom+2||b.left<r.left-2||b.top<r.top-2;});
          });
          assert.equal(overflow,false,`${name}/${lang}/step${step} content fits`);
          await page.screenshot({path:path.join(out,`${name}-${lang}-${step+1}.png`)});
          checks.push(`${name}/${lang}/step${step+1}`);
        }
        await tabs.nth(0).focus();await page.keyboard.press('ArrowRight');
        assert.equal(await tabs.nth(1).getAttribute('aria-selected'),'true');
        assert.equal(await page.locator('#indicator-page').textContent(),'01 / 1');
        await page.keyboard.press('End');assert.equal(await tabs.nth(3).getAttribute('aria-selected'),'true');
        await page.keyboard.press('Home');assert.equal(await tabs.nth(0).getAttribute('aria-selected'),'true');
        await page.locator('#overview-toggle').click();await page.locator('[data-language="'+(lang==='ja'?'zh':'ja')+'"]').click();await page.locator('#overview-close').click();
        assert.equal(await tabs.nth(0).getAttribute('aria-selected'),'true');
      }
    }
    assert.deepEqual(errors,[]);
  }finally{await browser.close();}
  fs.writeFileSync(path.join(out,'qa.json'),JSON.stringify({checks,errors,keyboard:true,languageSwitch:true},null,2));
  console.log({checks:checks.length,errors,keyboard:true,languageSwitch:true});
}
main().catch(e=>{console.error(e);process.exitCode=1;});
