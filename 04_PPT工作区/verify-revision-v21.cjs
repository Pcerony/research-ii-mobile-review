const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url'),{chromium}=require('playwright');
async function main(){
  const out='05_输出/qa/revision-v26';fs.mkdirSync(out,{recursive:true});
  const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
  const errors=[],checks=[];
  try{
    const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));
    for(const width of [1440,390])for(const lang of ['ja','zh']){
      await page.setViewportSize({width,height:width===1440?1000:844});
      await page.goto(pathToFileURL(path.resolve('04_PPT工作区/index.html')).href+'?lang='+lang);
      await page.waitForFunction(()=>window.__goSlide);
      for(const index of [3,4,10,21]){
        await page.evaluate(i=>window.__goSlide(i),index);await page.waitForTimeout(900);
        const slide=page.locator('.slide.is-current');
        if(index===3)await slide.locator('[data-gaze-toggle]').click();
        const audit=await slide.evaluate(s=>{
          const b=s.getBoundingClientRect(),bad=[];
          for(const el of s.querySelectorAll('h2,h3,p,strong,span,dd,figure,img')){
            if(el.closest('[hidden],[aria-hidden="true"]'))continue;
            const r=el.getBoundingClientRect();
            if(r.width&&r.height&&(r.left<b.left-2||r.right>b.right+2||r.top<b.top-2||r.bottom>b.bottom+2))bad.push(el.textContent.slice(0,60));
          }
          return {bad,missing:[...s.querySelectorAll('img')].filter(i=>!i.naturalWidth).length};
        });assert.deepEqual(audit,{bad:[],missing:0},JSON.stringify({index,width,lang,audit}));
        if(index===3){
          assert.equal(await slide.locator('[data-gaze-status]').isVisible(),true);
          const panel=await slide.locator('[data-gaze-status]').boundingBox(),columns=await slide.locator('.method-columns').boundingBox();
          const right=await slide.locator('.method-columns>div').nth(1).boundingBox();
          assert.ok(panel.width<columns.width*.51);assert.ok(Math.abs(panel.x-right.x)<2);assert.ok(panel.x+panel.width<=right.x+right.width+2);
          await page.screenshot({path:path.join(out,`${lang}-${width}-methods-expanded.png`)});
          await slide.locator('[data-gaze-toggle]').click();assert.equal(await slide.locator('[data-gaze-status]').isVisible(),false);
        }else await page.screenshot({path:path.join(out,`${lang}-${width}-${index+1}.png`)});
        checks.push({index,width,lang,...audit});
      }
    }
    assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'qa.json'),JSON.stringify({checks,errors},null,2));console.log({checks:checks.length,errors});
  }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
