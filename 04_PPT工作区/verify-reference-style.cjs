const fs = require('fs');
const path = require('path');
const {pathToFileURL} = require('url');
const {chromium} = require('playwright');
const sharp = require('sharp');
const hashing = require('node:crypto');
const digest = value => hashing.createHash('sha256').update(value).digest('hex');
const referenceHashes = {css:'d479cf8e9043839915a77778b0de84641dbae216e18be4a2121ee3594a03bc0f',ascii:'c230557540df0c33b2629c318c7ea398640a5523960c9c3015fb21086e637be2'};
const out = path.resolve('05_输出/qa/research-v10');
const source=fs.readFileSync('04_PPT工作区/index.html','utf8');
const sections=[...source.matchAll(/<section class="slide\b[\s\S]*?<\/section>/g)].map(m=>m[0]);
const slideCount=sections.length;
const mainCount=sections.filter(s=>!s.includes('data-supplement="true"')).length;
const heatmapIndex=sections.findIndex(s=>s.includes('data-layout="heatmap-explorer"'));
fs.mkdirSync(out,{recursive:true});
(async () => {
  const browser = await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
  try {
    const page = await browser.newPage({viewport:{width:1440,height:1000}});
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    const results = [];
    const heatmapChecks=[];
    for (const [name,size] of [['desktop',{width:1440,height:1000}],['narrow',{width:390,height:844}]]) {
      await page.setViewportSize(size);
      for (const lang of ['ja','zh']) {
        await page.goto(pathToFileURL(path.resolve('04_PPT工作区/index.html')).href + `?lang=${lang}`,{waitUntil:'domcontentloaded'});
        await page.waitForFunction(() => typeof window.__goSlide === 'function');
        await page.addStyleTag({content:'#deck,.slide,.slide-shell{transition:none!important}'});
        await page.evaluate(() => Promise.all([...document.images].map(i => i.decode().catch(() => {}))));
        for (let index = 0; index < slideCount; index++) {
          await page.evaluate(i => window.__goSlide(i),index);
          await page.waitForTimeout(100);
          const audit = await page.evaluate(() => {
            const slide = document.querySelector('.slide.is-current');
            const r = slide.getBoundingClientRect();
            const bad = [];
            for (const el of slide.querySelectorAll('*:not(canvas):not(img)')) {
              const b = el.getBoundingClientRect();
              if (b.width && b.height && (b.left < r.left - 2 || b.right > r.right + 2 || b.top < r.top - 2 || b.bottom > r.bottom + 2)) bad.push({tag:el.tagName,cls:el.className,text:el.textContent.slice(0,35)});
            }
            const text = slide.textContent.replace(/\s+/g,'');
            const longParagraphs = [...slide.querySelectorAll('p')].filter(el=>el.textContent.length>100).map(el=>el.textContent);
            const fragments=[];
            const walker=document.createTreeWalker(slide,NodeFilter.SHOW_TEXT);
            while(walker.nextNode()) {
              const node=walker.currentNode;
              if(!node.textContent.trim()||node.parentElement.closest('title,script,style'))continue;
              const range=document.createRange();range.selectNodeContents(node);
              const b=range.getBoundingClientRect();
              if(b.width>0&&b.height>0)fragments.push({text:node.textContent.trim(),left:b.left,right:b.right,top:b.top,bottom:b.bottom});
            }
            const textOverlaps=[];
            for(let i=0;i<fragments.length;i++)for(let j=i+1;j<fragments.length;j++){
              const a=fragments[i],b=fragments[j];
              if(Math.min(a.right,b.right)-Math.max(a.left,b.left)>.5&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>.5)textOverlaps.push([a.text,b.text]);
            }
            return {ratio:r.width/r.height,bad,textCharacters:text.length,longParagraphs,textOverlaps,inside:r.left>=0&&r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight,missing:[...slide.querySelectorAll('img')].filter(i=>!i.naturalWidth).map(i=>i.getAttribute('src'))};
          });
          results.push({name,lang,index:index+1,...audit});
          await page.screenshot({path:path.join(out,`${name}-${lang}-${String(index+1).padStart(2,'0')}.png`)});
        }
        await page.evaluate(i=>window.__goSlide(i),heatmapIndex);
        for(let index=0;index<9;index++){
          await page.locator(`#deck [data-heatmap-pick="${index}"]`).click();
          await page.evaluate(()=>Promise.all([...document.querySelectorAll('#deck .heatmap-screen img')].map(img=>img.decode())));
          const state=await page.locator('#deck .heatmap-explorer').evaluate(el=>({
            label:el.querySelector('[data-heatmap-current]').textContent,
            loaded:[...el.querySelectorAll('img')].every(img=>img.naturalWidth>0),
            active:el.querySelectorAll('[aria-pressed="true"]').length,
            sources:[...el.querySelectorAll('img')].map(img=>img.getAttribute('src'))
          }));
          heatmapChecks.push({name,lang,index,...state});
          await page.screenshot({path:path.join(out,`heatmap-${name}-${lang}-${index+1}.png`)});
        }
      }
    }
    fs.writeFileSync(path.join(out,'layout-audit.json'),JSON.stringify(results,null,2));
    await page.setViewportSize({width:1440,height:1000});
    await page.evaluate(() => window.__goSlide(11));
    await page.waitForTimeout(800);
    const pairs = await page.locator('#deck [data-participant]').evaluateAll(nodes=>nodes.map(n=>({id:n.dataset.participant,control:Number(n.dataset.control),intervention:Number(n.dataset.intervention)})));
    const mean = key => Number((pairs.reduce((s,p)=>s+p[key],0)/pairs.length).toFixed(1));
    const pairAudit = {count:pairs.length,control:mean('control'),intervention:mean('intervention'),up:pairs.filter(p=>p.intervention>p.control).length,down:pairs.filter(p=>p.intervention<p.control).length};
    await page.locator('button[data-language="ja"]').click();
    const japaneseSwitch = await page.locator('html').getAttribute('lang') === 'ja';
    await page.locator('button[data-language="zh"]').click();
    const chineseSwitch = await page.locator('html').getAttribute('lang') === 'zh-CN';
    await page.locator('#overview-toggle').click();
    const overview = await page.locator('#overview').evaluate((el,count) => el.open && el.querySelectorAll('.overview-card').length === count,mainCount);
    await page.screenshot({path:path.join(out,'overview.png')});
    await page.locator('#overview-close').click();
    await page.keyboard.press('Home');
    await page.keyboard.press('ArrowRight');
    const keyboard = await page.locator('#indicator-page').textContent();
    const current = fs.readFileSync('04_PPT工作区/index.html','utf8');
    const cssSame = digest(current.match(/<style id="reference-style">([\s\S]*?)<\/style>/)[1]) === referenceHashes.css;
    const asciiSame = digest(current.slice(current.lastIndexOf('<script>'),current.lastIndexOf('</script>')+9)) === referenceHashes.ascii;
    const layouts=await page.locator('#deck .slide').evaluateAll(nodes=>nodes.map(n=>n.dataset.layout));
    const summary = {cssSame,asciiSame,uniqueLayouts:new Set(layouts).size,layouts,errors:[...errors],pairAudit,japaneseSwitch,chineseSwitch,overview,keyboard,checks:results.length,heatmapChecks:heatmapChecks.length,heatmapFailures:heatmapChecks.filter(r=>!r.loaded||r.active!==1||r.label!==`P${String(r.index+1).padStart(2,'0')}`),failures:results.filter(r=>r.bad.length||r.missing.length||r.longParagraphs.length||r.textOverlaps.length||!r.inside||Math.abs(r.ratio-4/3)>.001)};
    fs.writeFileSync(path.join(out,'qa.json'),JSON.stringify({summary,results},null,2));
    for(const lang of ['ja','zh']) {
      const tiles = [];
      for (let i=1;i<=slideCount;i++) {
        tiles.push({input:await sharp(path.join(out,`desktop-${lang}-${String(i).padStart(2,'0')}.png`)).resize(360,250).png().toBuffer(),left:((i-1)%4)*360,top:Math.floor((i-1)/4)*250});
      }
      await sharp({create:{width:1440,height:Math.ceil(slideCount/4)*250,channels:3,background:'#eceeeb'}}).composite(tiles).png().toFile(path.join(out,`contact-sheet-${lang}.png`));
    }
    // Capture the actual reference, including its original navigation and cover.
    if(process.argv[2]) {
      await page.route('https://**/*',route=>route.abort());
      await page.goto(pathToFileURL(path.resolve(process.argv[2])).href,{waitUntil:'domcontentloaded'});
      await page.waitForTimeout(1500);
      await page.evaluate(() => document.body.classList.remove('motion-boot'));
      await page.screenshot({path:path.join(out,'original-cover.png')});
    }
    console.log(JSON.stringify(summary,null,2));
    if(summary.failures.length||summary.heatmapFailures.length||errors.length||!cssSame||!asciiSame||new Set(layouts).size!==slideCount||pairAudit.count!==9||!overview||!japaneseSwitch||!chineseSwitch)process.exitCode=1;
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
