const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {pathToFileURL}=require('node:url'),{chromium}=require('playwright');
(async()=>{const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
try{const page=await browser.newPage();const out='05_输出/qa/states-v29';fs.mkdirSync(out,{recursive:true});
for(const size of [{width:1440,height:1000},{width:390,height:844}])for(const lang of ['ja','zh']){
 await page.setViewportSize(size);await page.goto(pathToFileURL(path.resolve('04_PPT工作区/index.html')).href+'?lang='+lang);
 await page.evaluate(()=>__goSlide(2));await page.waitForTimeout(850);
 assert.equal(await page.locator('#deck [data-cocreation-key="4"]').isDisabled(),true);
 await page.locator('#deck [data-cocreation-key="3"]').click();await page.waitForTimeout(850);
 assert.equal(await page.locator('#deck .co-verification-pair img').count(),2);
 assert.equal(await page.locator('#deck .co-owner-ii').getAttribute('role'),null);
 const animation=await page.locator('#deck .co-compare-symbol i').first().evaluate(n=>getComputedStyle(n).animationName);assert.equal(animation,'compare-question');
 await page.screenshot({path:path.join(out,`${lang}-${size.width}-comparison.png`)});
 await page.evaluate(()=>__goSlide(3));await page.waitForTimeout(850);await page.locator('#deck [data-gaze-toggle]').click();await page.waitForTimeout(650);
 const audit=await page.locator('#deck .gaze-status-right').evaluate(n=>{const slide=n.closest('.slide').getBoundingClientRect();const nodes=[...n.querySelectorAll('strong,dt,dd')].map(el=>{const r=el.getBoundingClientRect();return {text:el.textContent,l:r.left,r:r.right,t:r.top,b:r.bottom};});return {count:n.querySelectorAll('.gaze-data-meaning dt').length,overflow:nodes.filter(r=>r.l<slide.left||r.r>slide.right||r.t<slide.top||r.b>slide.bottom),rows:[...n.querySelectorAll('.gaze-principle>div')].map(e=>e.getBoundingClientRect().top)}});
 assert.equal(audit.count,4);assert.deepEqual(audit.overflow,[]);assert.ok(audit.rows[0]<audit.rows[1]&&audit.rows[1]<audit.rows[2]);
 await page.screenshot({path:path.join(out,`${lang}-${size.width}-gaze.png`)});
}
console.log('8 expanded states: disabled future step, prototype comparison and three-row gaze flow passed.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
