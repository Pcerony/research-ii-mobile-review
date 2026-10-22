const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url'),{chromium}=require('playwright');
async function main(){
  const out='05_输出/qa/title-peek';fs.mkdirSync(out,{recursive:true});
  const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
  const checks=[],errors=[];
  try{
    const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));
    await page.emulateMedia({reducedMotion:'reduce'});
    for(const viewport of [{width:1440,height:1000},{width:1920,height:1080},{width:390,height:844}])for(const lang of ['ja','zh']){
      await page.setViewportSize(viewport);await page.goto(pathToFileURL(path.resolve('04_PPT工作区/index.html')).href+'?lang='+lang);await page.waitForFunction(()=>window.__goSlide);
      assert.equal(await page.locator('#deck .bottom').count(),0,'No duplicate card footer');
      assert.equal(await page.locator('#presentation-footer #indicator-page').count(),1);
      for(let i=1;i<21;i++){
        await page.evaluate(i=>window.__goSlide(i),i);await page.waitForTimeout(40);
        if(![12,20].includes(i)){
          const clipped=await page.locator('#deck .slide').nth(i).evaluate(s=>{
            const bounds=s.getBoundingClientRect();
            return [...s.querySelectorAll('h2,h3,p,dt,dd,figure')].filter(n=>{
              const r=n.getBoundingClientRect();return r.width&&r.height&&(r.left<bounds.left-2||r.right>bounds.right+2||r.top<bounds.top-2||r.bottom>bounds.bottom+2);
            }).map(n=>n.textContent.slice(0,50));
          });
          assert.deepEqual(clipped,[],JSON.stringify({i,lang,viewport,clipped}));
        }
        const normal=await page.locator('#deck .slide').nth(i).locator('h2').evaluate(n=>({font:parseFloat(getComputedStyle(n).fontSize),text:n.textContent}));
        if(i===20)continue;
        await page.evaluate(i=>window.__goSlide(i+1),i);await page.waitForTimeout(40);
        const peek=await page.locator('#deck .slide').nth(i).locator('h2').evaluate(n=>{
          const parts=[...n.querySelectorAll('[data-title-line]')],rects=parts.map(p=>p.getBoundingClientRect()),slot=n.parentElement.getBoundingClientRect();
          return {font:parseFloat(getComputedStyle(n).fontSize)*new DOMMatrix(getComputedStyle(parts[0]).transform).a,lines:parts.length,right:Math.abs(Math.max(...rects.map(r=>r.right))-slot.right),left:Math.min(...rects.map(r=>r.left)),text:n.textContent,overflow:n.scrollWidth>n.clientWidth+1};
        });
        assert.ok(peek.font<normal.font);assert.ok(peek.lines<=3&&peek.lines>=1,JSON.stringify({i,lang,peek}));assert.ok(peek.right<2);assert.equal(peek.text,normal.text);assert.equal(peek.overflow,false);
        if(viewport.width>=1440&&![11,19].includes(i))assert.ok(peek.left>=-2,JSON.stringify({i,lang,viewport,peek}));
        if([1,6,9,12].includes(i))await page.screenshot({path:path.join(out,`${lang}-${viewport.width}-after-${i+1}.png`)});
      }
      await page.evaluate(()=>window.__goSlide(6));await page.waitForTimeout(40);
      assert.ok(await page.locator('#deck .slide').nth(6).locator('h2').evaluate(n=>parseFloat(getComputedStyle(n).fontSize)>=40),'Return restores large title');
      checks.push({viewport,lang,fullText:true,compactPast:true,returnRestores:true});
    }
    await page.emulateMedia({reducedMotion:'no-preference'});await page.setViewportSize({width:1440,height:1000});
    await page.evaluate(()=>window.__goSlide(1));await page.waitForTimeout(1200);
    const moving=await page.evaluate(async()=>{
      window.__goSlide(2);await new Promise(resolve=>setTimeout(resolve,250));
      const title=document.querySelector('#deck .slide.is-prev [data-title-line]'),s=getComputedStyle(title);
      return {scale:new DOMMatrix(s.transform).a,opacity:parseFloat(s.opacity),duration:s.transitionDuration};
    });
    assert.ok(moving.scale>.55&&moving.scale<1,'Same text visibly scales');assert.equal(moving.opacity,1,'No text cross-fade');
    await page.waitForTimeout(1200);await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>window.__goSlide(7));
    assert.equal(await page.locator('#deck .slide.is-prev [data-title-line]').first().evaluate(n=>getComputedStyle(n).transitionDuration),'0s');
    assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'qa.json'),JSON.stringify({checks,errors},null,2));console.log({checks,errors});
  }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
