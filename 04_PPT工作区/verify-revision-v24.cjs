const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url'),{chromium}=require('playwright');
async function main(){
 const out='05_输出/qa/technical-method-v26';fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 const checks=[],errors=[];
 try{
  const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));
  for(const width of [1440,390])for(const lang of ['ja','zh']){
   await page.setViewportSize({width,height:width===1440?1000:844});
   await page.goto(pathToFileURL(path.resolve('04_PPT工作区/index.html')).href+'?lang='+lang);await page.waitForFunction(()=>window.__goSlide);
   for(const index of [7,8,9]){
    await page.evaluate(i=>window.__goSlide(i),index);await page.waitForTimeout(1000);
    const slide=page.locator('.slide.is-current');
    const audit=await slide.evaluate(s=>{
     const bounds=s.getBoundingClientRect(),bad=[],texts=[];
     for(const el of s.querySelectorAll('h2,h3,p,dt,dd,figure,figcaption,small,img')){
      if(el.closest('[hidden],[aria-hidden="true"]'))continue;const r=el.getBoundingClientRect();
      if(r.width&&r.height&&(r.left<bounds.left-1||r.right>bounds.right+1||r.top<bounds.top-1||r.bottom>bounds.bottom+1))bad.push(el.textContent.slice(0,50));
     }
     const walker=document.createTreeWalker(s,NodeFilter.SHOW_TEXT);let n;
     while(n=walker.nextNode()){
      if(!n.textContent.trim()||n.parentElement.closest('[hidden],[aria-hidden="true"]'))continue;
      const range=document.createRange();range.selectNodeContents(n);const r=range.getBoundingClientRect();
      if(r.width&&r.height)texts.push({text:n.textContent.trim(),l:r.left,r:r.right,t:r.top,b:r.bottom});
     }
     const overlap=[];for(let i=0;i<texts.length;i++)for(let j=i+1;j<texts.length;j++){
      const a=texts[i],b=texts[j];if(Math.min(a.r,b.r)-Math.max(a.l,b.l)>.5&&Math.min(a.b,b.b)-Math.max(a.t,b.t)>.5)overlap.push([a.text,b.text]);
     }
     return {bad,overlap,missing:[...s.querySelectorAll('img')].filter(i=>!i.naturalWidth).length};
    });assert.deepEqual(audit,{bad:[],overlap:[],missing:0},JSON.stringify({index,width,lang,audit}));
    if(index===7){assert.equal(await slide.locator('.software-functions>div').count(),3);assert.equal(await slide.locator('.paper-route-projection').count(),1);}
    if(index===8){assert.equal(await slide.locator('.mapping-details>div').count(),2);assert.equal(await slide.locator('.mapping-constraint').isVisible(),true);}
    if(index===9){
     const boxes=await slide.locator('.static-workflow figure').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return{x:r.x,y:r.y};}));
     assert.equal(boxes.length,4);assert.ok(Math.abs(boxes[0].y-boxes[1].y)<1);assert.ok(Math.abs(boxes[2].y-boxes[3].y)<1);
     assert.ok(boxes[2].y>boxes[0].y+20);assert.ok(Math.abs(boxes[0].x-boxes[2].x)<1);assert.equal(await slide.locator('.workflow-step-copy dl>div').count(),8);
    }
    await page.screenshot({path:path.join(out,`${lang}-${width}-${index+1}.png`)});checks.push({index,width,lang,...audit});
   }
  }
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'qa.json'),JSON.stringify({checks,errors},null,2));console.log({checks:checks.length,errors});
 }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
