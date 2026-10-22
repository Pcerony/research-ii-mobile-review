const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {chromium}=require('playwright');
async function main(){
  const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:1000}});
    await page.goto(pathToFileURL(path.resolve('04_PPT工作区/index.html')).href);
    await page.waitForFunction(()=>window.__goSlide);
    assert.equal(await page.locator('#deck .slide:not([data-supplement="true"])').count(),21,'Heatmap is part of the main talk.');
    assert.equal(await page.locator('#deck .slide[data-supplement="true"]').count(),1);
    assert.equal(await page.locator('#indicator-page').textContent(),'01 / 21');
    assert.match(await page.locator('#deck .slide').first().textContent(),/SIGN Visual Attention/);
    await page.keyboard.press('End');assert.equal(await page.locator('#indicator-page').textContent(),'21 / 21');
    await page.keyboard.press('ArrowRight');assert.equal(await page.locator('#indicator-page').textContent(),'21 / 21','Clicker cannot accidentally enter supplements.');
    assert.equal(await page.locator('#deck .slide:not([data-supplement="true"]) [data-workflow-step]').count(),0,'Main workflow is a static overview.');
    assert.equal(await page.locator('#deck .slide:not([data-supplement="true"]) [data-heatmap-pick]').count(),9);
    await page.evaluate(()=>window.__goSlide(21));
    assert.equal(await page.locator('#deck .slide.is-current').getAttribute('data-supplement'),'true');
    assert.equal(await page.locator('#deck [data-workflow-step]').count(),4);
    assert.equal(await page.locator('#deck [data-heatmap-pick]').count(),9);
    for(const [id,a,b]of [['A','33.7','26.4'],['R','5','21.4'],['S','31.3','33.5'],['other','30.1','18.7']]){
      const row=page.locator(`#deck [data-aoi="${id}"]`);
      assert.equal(await row.getAttribute('data-control'),a);assert.equal(await row.getAttribute('data-intervention'),b);
    }
    assert.equal(await page.locator('#deck [data-layout="privacy-flow"]').count(),1);
    assert.equal(await page.locator('#deck [data-layout="mapping-method"] [data-homography]').count(),1);
  }finally{await browser.close();}
  console.log({mainSlides:21,supplements:1,clickerBoundary:true,completeAoi:true,privacy:true,mapping:true});
}
main().catch(e=>{console.error(e);process.exitCode=1;});
