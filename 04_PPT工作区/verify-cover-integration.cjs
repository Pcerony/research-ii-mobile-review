const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const {chromium} = require('playwright');
async function main(){
  const output=path.resolve('05_输出/qa/cover-integration');fs.mkdirSync(output,{recursive:true});
  const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
  const errors=[],checks=[];
  try{
    const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));
    const url=pathToFileURL(path.resolve('04_PPT工作区/index.html')).href;
    const pixels=()=>page.locator('#deck [data-heatfield]').evaluate(c=>{
      const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
      let sum=0;for(let i=0;i<d.length;i+=13)sum+=d[i];return sum;
    });
    for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){
      await page.setViewportSize(viewport);
      for(const lang of ['ja','zh']){
        await page.goto(url+'?lang='+lang);await page.waitForFunction(()=>window.__goSlide);
        await page.waitForFunction(({width,height})=>{
          const box=document.querySelector('#deck .conference-cover')?.getBoundingClientRect();
          return box&&box.x>=-1&&box.y>=-1&&box.right<=width+1&&box.bottom<=height+1;
        },viewport);
        assert.equal(await page.locator('#deck [data-heatfield]').count(),1);
        assert.equal(await page.locator('#deck .slide:not([data-supplement])').count(),21);
        assert.equal(await page.locator('#deck [data-supplement]').count(),1);
        const box=await page.locator('#deck .conference-cover').boundingBox();
        assert.ok(box.x>=-1&&box.y>=-1&&box.x+box.width<=viewport.width+1&&box.y+box.height<=viewport.height+1,JSON.stringify({lang,viewport,box}));
        assert.equal(await page.locator('#deck [data-heatfield]').evaluate(c=>getComputedStyle(c).position),'absolute');
        await page.screenshot({path:path.join(output,`${lang}-${viewport.width}.png`)});
        checks.push({lang,viewport,fits:true});
      }
    }
    await page.setViewportSize({width:1440,height:1000});await page.goto(url);
    const first=await pixels();await page.waitForTimeout(700);assert.notEqual(await pixels(),first);
    await page.keyboard.press('Space');assert.equal(await page.locator('#indicator-page').textContent(),'02 / 21');
    const away=await pixels();await page.waitForTimeout(250);assert.equal(await pixels(),away);
    await page.keyboard.press('Home');await page.waitForTimeout(250);assert.notEqual(await pixels(),away);
    await page.locator('#overview-toggle').click();
    const thumb=await page.locator('#overview [data-heatfield]').evaluate(c=>Array.from(c.getContext('2d').getImageData(0,0,1,1).data));
    assert.equal(thumb[3],255,'Overview cover must not be blank');
    await page.screenshot({path:path.join(output,'overview.png')});
    await page.locator('#overview-close').click();
    await page.emulateMedia({reducedMotion:'reduce'});await page.reload();
    const still=await pixels();await page.waitForTimeout(250);assert.equal(await pixels(),still);
    await page.goto(pathToFileURL(path.resolve('04_PPT工作区/review.html')).href);
    const iframe=page.frameLocator('iframe');
    await iframe.locator('#deck [data-heatfield]').waitFor();
    assert.equal(await iframe.locator('#deck [data-heatfield]').evaluate(c=>c.getContext('2d').getImageData(0,0,1,1).data[3]),255);
    assert.deepEqual(errors,[]);
    const result={checks,spaceNavigation:true,offSlidePause:true,overview:true,reducedMotion:true,reviewSnapshot:true,errors};
    fs.writeFileSync(path.join(output,'qa.json'),JSON.stringify(result,null,2));console.log(result);
  }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
