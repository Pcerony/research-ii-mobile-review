const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url'),{chromium}=require('playwright');
async function main(){
  const rows=require('./research-content.cjs');
  assert.deepEqual(rows.slice(1,8).map(r=>r.group[1]),['研究背景','研究对象与研究目的','研究对象','先行研究','课题','方法','方法']);
  const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
  const out='05_输出/qa/section-headings-v18';fs.mkdirSync(out,{recursive:true});
  const checks=[],errors=[];
  try{
    const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));
    for(const size of [{width:1440,height:1000},{width:390,height:844}])for(const lang of ['ja','zh']){
      await page.setViewportSize(size);await page.goto(pathToFileURL(path.resolve('04_PPT工作区/index.html')).href+'?lang='+lang);
      await page.waitForFunction(()=>window.__goSlide);
      assert.deepEqual(await page.locator('#deck .slide').evaluateAll(s=>s.slice(1,5).map(n=>n.dataset.layout)),['learning-background','research-scope','evaluation-gap','gaze-prior']);
      assert.equal(await page.locator('#deck .slide-head .kicker').count(),0);
      const geometry=i=>page.locator('#deck .slide').nth(i).evaluate(s=>{
        const head=s.querySelector('.slide-head').getBoundingClientRect(),label=s.querySelector('.slide-head .chapter').getBoundingClientRect();
        return {left:Math.abs(label.left-head.left),right:Math.abs(label.right-head.right),text:s.querySelector('.chapter').textContent};
      });
      for(let i=1;i<8;i++){
        await page.evaluate(i=>window.__goSlide(i),i);await page.waitForTimeout(1200);
        assert.ok((await geometry(i)).left<2,'Current heading is left aligned');
        if(i<7)assert.ok((await geometry(i+1)).left<2,'Upcoming heading is left aligned');
        if(i>1)assert.ok((await geometry(i-1)).right<2,'Passed heading is right aligned');
      }
      await page.evaluate(()=>window.__goSlide(1));await page.waitForTimeout(1200);
      assert.ok((await geometry(1)).left<2,'Returning restores heading to left');
      const expected=lang==='ja'?'研究背景':'研究背景';assert.equal((await geometry(1)).text,expected);
      await page.evaluate(()=>window.__goSlide(2));await page.waitForTimeout(220);
      const moving=await geometry(1);
      assert.ok(moving.left>1&&moving.right>1,'Heading passes through an intermediate position');
      await page.waitForTimeout(1200);
      assert.ok((await geometry(1)).right<2);
      await page.screenshot({path:path.join(out,`${lang}-${size.width}.png`)});
      checks.push({lang,size,firstEight:true,previousRight:true,upcomingLeft:true,returnLeft:true});
    }
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.evaluate(()=>window.__goSlide(3));await page.waitForTimeout(80);
    assert.equal(await page.locator('#deck .slide.is-prev .chapter').evaluate(n=>getComputedStyle(n).transitionDuration),'0s');
    assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'qa.json'),JSON.stringify({checks,errors},null,2));console.log({checks,errors});
  }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
