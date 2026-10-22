const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');const {chromium}=require('playwright');
async function main(){
  const out=path.resolve('05_输出/qa/fullscreen-stack-v26');fs.mkdirSync(out,{recursive:true});
  const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,timeout:45000});
  const errors=[],checks=[];
  try{
    console.log('Browser ready');
    const page=await browser.newPage();page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));
    const url=pathToFileURL(path.resolve('04_PPT工作区/index.html')).href;
    for(const viewport of [{width:1440,height:1000},{width:1920,height:1080},{width:390,height:844}]){
      await page.setViewportSize(viewport);
      for(const lang of ['ja','zh']){
        await page.goto(url+'?lang='+lang);await page.waitForFunction(()=>window.__goSlide);await page.waitForTimeout(850);
        for(const [index,name]of [[0,'cover'],[11,'heatmap'],[19,'closing']]){
          await page.evaluate(i=>window.__goSlide(i),index);await page.waitForTimeout(850);
          const box=await page.locator('#deck .slide.is-current').boundingBox();
          assert.ok(Math.abs(box.x)<2&&Math.abs(box.y)<2&&Math.abs(box.width-viewport.width)<2&&Math.abs(box.height-viewport.height)<2,JSON.stringify({name,viewport,box}));
          assert.equal(await page.locator('#deck .slide.is-current').evaluate(n=>getComputedStyle(n).borderRadius),'0px');
          const overflow=await page.locator('#deck .slide.is-current').evaluate(slide=>{
            const s=slide.getBoundingClientRect();return [...slide.querySelectorAll('h1,h2,.cover-author,.preview-boundary,.heatmap-wheel,.conclusion-findings,.potential-applications,.research-value-core,.conference-thanks')].filter(n=>{const r=n.getBoundingClientRect();return r.left<s.left-1||r.right>s.right+1||r.top<s.top-1||r.bottom>s.bottom+1}).map(n=>n.className);
          });assert.deepEqual(overflow,[],name+' content bounds');
          if(name==='heatmap'){
            await page.locator('#deck [data-heatmap-pick="4"]').click();await page.waitForTimeout(400);
            const loaded=await page.locator('#deck [data-heatmap-card] img').evaluateAll(imgs=>imgs.every(i=>i.complete&&i.naturalWidth>0));assert.ok(loaded);
          }
          await page.screenshot({path:path.join(out,`${lang}-${viewport.width}-${name}.png`)});
          console.log(`${lang}/${viewport.width}/${name}: full viewport verified`);
          checks.push({lang,viewport,name,fullViewport:true});
        }
        await page.keyboard.press('ArrowRight');assert.equal(await page.locator('#indicator-page').textContent(),'20 / 20');
        await page.evaluate(()=>window.__goSlide(1));await page.waitForTimeout(850);
        const normal=await page.locator('#deck .slide.is-current').boundingBox();assert.ok(normal.width<viewport.width&&normal.height<viewport.height);
        assert.equal(await page.locator('body').evaluate(b=>b.classList.contains('full-bleed')),false);
      }
    }
    await page.setViewportSize({width:1440,height:1000});await page.goto(url);await page.evaluate(()=>window.__goSlide(11));await page.waitForTimeout(850);
    for(let i=0;i<9;i++){
      await page.locator(`#deck [data-heatmap-pick="${i}"]`).click();await page.waitForTimeout(400);
      assert.equal(await page.locator('#deck [data-heatmap-current]').textContent(),`P${String(i+1).padStart(2,'0')}`);
      const active=page.locator('#deck [data-heatmap-card].active');assert.equal(await active.count(),2);
      assert.deepEqual(await active.evaluateAll(nodes=>nodes.map(n=>Number(n.dataset.heatmapIndex))),[i,i]);
      for(const condition of ['control','intervention'])assert.equal(await page.locator(`#deck [data-heatmap-stack="${condition}"] [data-heatmap-card]`).count(),9);
    }
    const card=page.locator('#deck [data-heatmap-card="control"][data-heatmap-index="4"]');
    await page.locator('#deck [data-heatmap-pick="4"]').click();await page.waitForTimeout(60);
    const middle=await card.evaluate(n=>getComputedStyle(n).transform);
    const reference=await page.locator('#deck [data-heatmap-card="control"][data-heatmap-index="0"]').evaluate(n=>({y:n.style.getPropertyValue('--heat-y'),rx:n.style.getPropertyValue('--heat-rx'),scale:n.style.getPropertyValue('--heat-scale'),z:n.style.zIndex}));
    assert.equal(reference.y,'-104px');assert.equal(Number.parseFloat(reference.rx),8.8);assert.equal(Number(reference.scale),.78);assert.equal(reference.z,'96');
    await page.waitForTimeout(400);assert.notEqual(await card.evaluate(n=>getComputedStyle(n).transform),middle,'Stack must visibly interpolate, not just swap images');
    await page.locator('#deck [data-heatmap-pick="4"]').press('ArrowDown');assert.equal(await page.locator('#deck [data-heatmap-current]').textContent(),'P06');
    await page.locator('#deck [data-heatmap-pick="0"]').hover();await page.waitForTimeout(180);assert.equal(await page.locator('#deck [data-heatmap-current]').textContent(),'P01');
    await page.locator('#deck [data-heatmap-pick="0"]').press('ArrowRight');assert.equal(await page.locator('#indicator-page').textContent(),'13 / 20');
    await page.locator('#overview-toggle').click();assert.equal(await page.locator('.overview-card').count(),20);await page.locator('#overview-close').click();
    await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>window.__goSlide(10));
    assert.equal(await card.evaluate(n=>getComputedStyle(n).transitionDuration),'0s');
    await page.evaluate(()=>window.__goSlide(20));assert.equal(await page.locator('#indicator-page').textContent(),'01 / 2');
    assert.equal(await page.locator('#deck .slide.is-current').getAttribute('data-layout'),'operating-panorama');
    assert.deepEqual(errors,[]);
    const result={checks,allNinePaired:true,images:18,animatedInterpolation:true,keyboard:true,hover:true,normalCards:true,overview:true,reducedMotion:true,mainConclusionStops:true,supplementWorkflow:true,errors};
    fs.writeFileSync(path.join(out,'qa.json'),JSON.stringify(result,null,2));console.log(result);
  }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
