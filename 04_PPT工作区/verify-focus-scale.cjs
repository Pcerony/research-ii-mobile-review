const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url'),{chromium}=require('playwright');
async function main(){
  const out=path.resolve('05_输出/qa/focus-scale-v12');fs.mkdirSync(out,{recursive:true});
  const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,timeout:30000});
  const errors=[],checks=[];
  try{
    const page=await browser.newPage();page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));
    for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){
      await page.setViewportSize(viewport);await page.goto(pathToFileURL(path.resolve('04_PPT工作区/index.html')).href);
      await page.waitForFunction(()=>window.__goSlide);await page.waitForTimeout(900);
      for(const [special,neighbor]of [[0,1],[12,13],[20,19]]){
        const slide=page.locator(`#deck .slide[data-index="${special}"]`);
        await page.evaluate(i=>window.__goSlide(i),special);await page.waitForTimeout(900);
        const full=await slide.boundingBox();assert.ok(Math.abs(full.width-viewport.width)<2&&Math.abs(full.height-viewport.height)<2);
        await page.evaluate(i=>window.__goSlide(i),neighbor);await page.waitForTimeout(100);
        const middle=await slide.boundingBox();
        await page.screenshot({path:path.join(out,`${viewport.width}-${special}-shrinking.png`)});
        await page.waitForTimeout(800);
        const small=await slide.boundingBox(),ordinary=await page.locator(`#deck .slide[data-index="${neighbor}"]`).boundingBox();
        assert.ok(Math.abs(small.width-ordinary.width)<2&&Math.abs(small.height-ordinary.height)<2,'Inactive special page must be the same size as ordinary cards');
        assert.ok(middle.width>small.width+1&&middle.width<full.width-1,'Shrink must have a visible intermediate scale');
        assert.ok(Math.abs(ordinary.x-(viewport.width-ordinary.width)/2)<2,'Ordinary card must remain centered');
        assert.notEqual(await slide.evaluate(n=>getComputedStyle(n).borderRadius),'0px');
        await page.screenshot({path:path.join(out,`${viewport.width}-${special}-card.png`)});
        await page.evaluate(i=>window.__goSlide(i),special);await page.waitForTimeout(100);
        const growing=await slide.boundingBox();assert.ok(growing.width>small.width+1&&growing.width<full.width-1);
        await page.waitForTimeout(800);const restored=await slide.boundingBox();
        assert.ok(Math.abs(restored.x)<2&&Math.abs(restored.y)<2&&Math.abs(restored.width-viewport.width)<2&&Math.abs(restored.height-viewport.height)<2);
        checks.push({viewport,special,neighbor,shrink:true,grow:true,centered:true});
      }
      await page.evaluate(()=>{window.__goSlide(12);window.__goSlide(13);window.__goSlide(0);window.__goSlide(1);});
      await page.waitForTimeout(900);
      const rapid=await page.locator('#deck .slide.is-current').boundingBox();assert.ok(Math.abs(rapid.x-(viewport.width-rapid.width)/2)<2);
      await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>window.__goSlide(12));await page.waitForTimeout(40);
      assert.equal(await page.locator('#deck .slide.is-current').evaluate(n=>getComputedStyle(n).transitionDuration),'0s');
      await page.emulateMedia({reducedMotion:'no-preference'});
    }
    assert.deepEqual(errors,[]);const result={checks,rapidNavigation:true,reducedMotion:true,errors};
    fs.writeFileSync(path.join(out,'qa.json'),JSON.stringify(result,null,2));console.log(result);
  }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
