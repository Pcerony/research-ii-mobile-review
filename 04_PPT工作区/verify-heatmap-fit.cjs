const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const {pathToFileURL}=require('node:url');
const {chromium}=require('playwright');
(async()=>{
  const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
  const out=path.resolve('05_输出/qa/heatmap-fit-v27');fs.mkdirSync(out,{recursive:true});
  try{
    const page=await browser.newPage();
    await page.goto(pathToFileURL(path.resolve('04_PPT工作区/index.html')).href);
    for(const viewport of [{width:1804,height:958},{width:1440,height:1000},{width:390,height:844}]){
      await page.setViewportSize(viewport);
      await page.evaluate(()=>window.__goSlide(10));await page.waitForTimeout(850);
      await page.evaluate(()=>window.__goSlide(11));await page.waitForTimeout(1100);
      for(const index of [0,7,8]){
        await page.locator(`#deck [data-heatmap-pick="${index}"]`).click();await page.waitForTimeout(450);
        const cards=await page.locator('#deck [data-heatmap-card].active').evaluateAll(nodes=>nodes.map(n=>{
          const s=n.parentElement,r=n.getBoundingClientRect(),p=s.getBoundingClientRect(),img=n.querySelector('img');
          return {centerError:Math.abs((r.left+r.right-p.left-p.right)/2),widthError:Math.abs(n.offsetWidth-Math.min(s.clientWidth*.94,(s.clientHeight-42)*img.naturalWidth/img.naturalHeight))};
        }));
        cards.forEach(c=>{assert.ok(c.centerError<2,JSON.stringify({viewport,index,...c}));assert.ok(c.widthError<2,JSON.stringify({viewport,index,...c}));});
      }
      await page.screenshot({path:path.join(out,`${viewport.width}.png`)});
    }
    assert.match(await page.locator('#deck .heatmap-color-labels').innerText(),/緑|绿/);
    console.log('Heatmap centering, final sizing, nine-person selection endpoints and green legend passed.');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
