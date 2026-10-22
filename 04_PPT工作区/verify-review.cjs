const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {pathToFileURL}=require('node:url');
const {chromium}=require('playwright');
const out=process.env.QA_OUT||'05_输出/qa/review-v32';fs.mkdirSync(out,{recursive:true});
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
async function main(){
  const m=JSON.parse(fs.readFileSync('04_PPT工作区/review-audio-manifest.json'));
  assert.equal(m.speechVersion,31);assert.equal(m.clips.length,19);assert.equal(m.appendixClips.length,5);
  assert.equal(hash(fs.readFileSync('04_PPT工作区/index.html')),m.deckHash);
  assert.equal(hash(fs.readFileSync('04_PPT工作区/演讲稿_中文审查.md')),m.speechHash);
  assert.equal(hash(fs.readFileSync('04_PPT工作区/补充稿_中文审查.md')),m.appendixSpeechHash);
  assert.deepEqual(m.appendixClips.filter(c=>c.workflowStep!==undefined).map(c=>c.workflowStep),[0,1,2,3]);
  const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
  const errors=[],checks=[];
  try{
    const context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true});
    const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
    await page.goto(pathToFileURL(path.resolve('04_PPT工作区/review.html')).href);
    await page.locator('#play:not([disabled])').waitFor();
    const frame=page.frameLocator('#deck-frame');
    await page.waitForFunction(()=>document.getElementById('narration').readyState>=1);
    await frame.locator('body').press('ArrowRight');await frame.locator('body').dispatchEvent('wheel',{deltaY:100});
    assert.equal(await frame.locator('#indicator-page').textContent(),'01 / 19');checks.push('main page stays synchronized');
    const metadata=await page.evaluate(async files=>{
      const rows=[];for(const file of files){const audio=new Audio();const duration=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Metadata timeout: '+file)),15000);audio.onloadedmetadata=()=>{clearTimeout(timer);resolve(audio.duration);};audio.onerror=()=>{clearTimeout(timer);reject(new Error(file));};audio.preload='metadata';audio.src=file;audio.load();});rows.push({file,duration});audio.removeAttribute('src');audio.load();}return rows;
    },[...m.clips,...m.appendixClips].map(c=>c.audio));
    assert.equal(metadata.length,24);assert.ok(metadata.every(c=>c.duration>0));checks.push('all twenty-four main and supplement clips decode');
    await page.locator('#play').click();await page.waitForFunction(()=>document.getElementById('narration').currentTime>.25&&!document.getElementById('narration').paused);
    await page.locator('#play').click();const paused=await page.locator('#narration').evaluate(a=>a.currentTime);await page.waitForTimeout(200);
    assert.ok(Math.abs(await page.locator('#narration').evaluate(a=>a.currentTime)-paused)<.05);checks.push('actual playback and pause');
    await page.locator('#play').click();await page.locator('#narration').evaluate(a=>{a.currentTime=a.duration-.12;});
    await page.waitForFunction(()=>document.getElementById('deck-frame').contentWindow.document.getElementById('indicator-page').textContent==='02 / 19');
    await page.locator('#play').click();checks.push('actual ended advances main slide');
    const resultIndex=m.clips.findIndex(c=>c.text.includes('38.6'));
    await page.locator(`[data-clip="${resultIndex}"] .clip-location`).click();await page.waitForFunction(()=>document.getElementById('narration').readyState>=1);
    await page.locator('#rate').selectOption('1.25');assert.equal(await page.locator('#narration').evaluate(a=>a.playbackRate),1.25);
    const resultTime=m.clips.slice(0,resultIndex).reduce((n,c)=>n+c.duration,0)+3;
    await page.locator('#seek').evaluate((el,t)=>{el.value=t;el.dispatchEvent(new Event('input'));el.dispatchEvent(new Event('change'));},resultTime);
    await page.waitForFunction(()=>document.getElementById('deck-frame').contentWindow.document.getElementById('indicator-page').textContent==='14 / 19');checks.push('seek, paragraph jump and rate');
    await page.locator('[data-deck-language="ja"]').click();await page.waitForFunction(()=>document.getElementById('deck-frame').contentWindow.document.documentElement.lang==='ja');
    await page.locator('[data-deck-language="zh"]').click();checks.push('slide language switch');
    await page.locator('#add-note').click();await page.locator('#note-text').fill('QA：核对图文配合。');await page.locator('#save-note').click();
    assert.equal(await page.locator('.note-entry').count(),1);
    const download=page.waitForEvent('download');await page.locator('#export-notes').click();await(await download).saveAs(path.join(out,'test-notes-main.json'));
    const exported=JSON.parse(fs.readFileSync(path.join(out,'test-notes-main.json')));assert.equal(exported.scope,'main');assert.equal(exported.notes[0].slide,14);
    await page.reload();await page.locator('#play:not([disabled])').waitFor();await page.locator('#notes-tab').click();assert.equal(await page.locator('.note-entry').count(),1);
    await page.locator('.delete-note').click();assert.equal(await page.locator('.note-entry').count(),0);checks.push('anchored notes persist, export and delete');
    await page.locator('#transcript-tab').click();await page.locator('[data-clip="18"] .clip-location').click();await page.locator('#replay').click();
    await page.waitForFunction(()=>!document.getElementById('narration').paused);await page.locator('#narration').evaluate(a=>{a.currentTime=a.duration-.12;});
    await page.waitForFunction(()=>document.getElementById('status').textContent==='播放完成');
    assert.equal(await frame.locator('#indicator-page').textContent(),'19 / 19');assert.equal(await page.locator('.clip-row').count(),19);checks.push('main stops after conclusion, without autoplaying supplements');
    for(const [name,size]of [['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}]]){
      await page.setViewportSize(size);await page.waitForTimeout(150);
      const fit=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,bad:[...document.querySelectorAll('.player button,.review-header button,.review-header a')].filter(n=>{const r=n.getBoundingClientRect();return r.width&&(r.left<0||r.right>innerWidth||r.top<0||r.bottom>innerHeight);}).map(n=>n.outerHTML)}));
      assert.equal(fit.overflow,false);assert.deepEqual(fit.bad,[]);await page.screenshot({path:path.join(out,`${name}-main.png`)});
    }
    const heatIndex=m.clips.findIndex(c=>c.slide===m.heatmapSlide);
    await page.locator(`[data-clip="${heatIndex}"] .clip-location`).click();
    const heatTime=m.clips.slice(0,heatIndex).reduce((n,c)=>n+c.duration,0)+m.clips[heatIndex].duration*.5;
    await page.locator('#seek').evaluate((el,t)=>{el.value=t;el.dispatchEvent(new Event('input'));el.dispatchEvent(new Event('change'));},heatTime);
    await page.waitForFunction(()=>document.getElementById('deck-frame').contentWindow.document.querySelector('#deck [data-heatmap-current]').textContent==='P04');
    assert.equal(await frame.locator('#indicator-page').textContent(),'13 / 19');
    await frame.locator('#deck [data-heatmap-pick="8"]').click();assert.equal(await frame.locator('#deck [data-heatmap-current]').textContent(),'P09');
    assert.equal(await frame.locator('#deck [data-heatmap-card].active').count(),2);checks.push('main heatmap seek and paired stack choice');
    await page.setViewportSize({width:1440,height:1000});await page.locator('[data-review-scope="supplement"]').click();
    await page.locator('#play:not([disabled])').waitFor();
    await page.waitForFunction(()=>document.getElementById('deck-frame').contentWindow.document.querySelector('#deck .slide.is-current').dataset.index==='19');
    assert.equal(await page.locator('.clip-row').count(),5);checks.push('explicit supplement scope');
    for(let i=0;i<4;i++){
      await page.locator(`[data-clip="${i}"] .clip-location`).click();await page.waitForFunction(i=>document.getElementById('deck-frame').contentWindow.document.querySelector('#deck [data-workflow-step="'+i+'"]').getAttribute('aria-selected')==='true',i);
    }
    await frame.locator('#deck [data-workflow-step="0"]').click();await frame.locator('#deck [data-workflow-step="0"]').press('ArrowRight');
    assert.equal(await frame.locator('#deck [data-workflow-step="1"]').getAttribute('aria-selected'),'true');
    await page.locator('[data-clip="0"] .clip-location').click();await page.locator('#replay').click();await page.waitForFunction(()=>!document.getElementById('narration').paused);
    await page.locator('#narration').evaluate(a=>{a.currentTime=a.duration-.12;});
    await page.waitForFunction(()=>document.getElementById('deck-frame').contentWindow.document.querySelector('#deck [data-workflow-step="1"]').getAttribute('aria-selected')==='true');
    await page.locator('#play').click();checks.push('supplement workflow cues, clicks, keyboard and ended transition');
    await page.locator('[data-clip="3"] .clip-location').click();
    await page.locator('#replay').click();
    await page.waitForFunction(()=>!document.getElementById('narration').paused);
    await page.locator('#narration').evaluate(a=>{a.currentTime=a.duration-.12;});
    await page.waitForFunction(()=>document.getElementById('deck-frame').contentWindow.document.querySelector('#deck .slide.is-current').dataset.layout==='privacy-flow');
    assert.equal(await frame.locator('#indicator-page').textContent(),'02 / 2');
    await page.waitForFunction(()=>document.getElementById('narration').readyState>=1);
    await page.locator('#narration').evaluate(a=>{a.currentTime=a.duration-.12;});
    await page.waitForFunction(()=>document.getElementById('status').textContent==='播放完成');
    checks.push('fourth workflow clip advances to privacy and supplement stops');
    await page.screenshot({path:path.join(out,'desktop-supplement.png')});
    assert.deepEqual(errors,[]);assert.equal(hash(fs.readFileSync('04_PPT工作区/index.html')),m.deckHash);
    fs.writeFileSync(path.join(out,'qa.json'),JSON.stringify({checks,errors,metadata,mainDuration:m.duration,supplementDuration:m.appendixDuration,formalDeckUnchanged:true},null,2));
    console.log({checks,errors,mainDuration:m.duration,supplementDuration:m.appendixDuration});
  }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
