const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url'),{chromium}=require('playwright');
async function main(){
const out='05_输出/qa/feedback-v28';fs.mkdirSync(out,{recursive:true});
  const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
  const checks=[],errors=[];
  try{
    const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));
    for(const [name,size]of [['desktop',{width:1440,height:1000}],['narrow',{width:390,height:844}]])for(const lang of ['ja','zh']){
      await page.setViewportSize(size);await page.goto(pathToFileURL(path.resolve('04_PPT工作区/index.html')).href+'?lang='+lang);await page.waitForFunction(()=>window.__goSlide);
      await page.addStyleTag({content:'#deck,.slide,.slide-shell{transition:none!important}'});
      const structures=await page.locator('#deck .slide').evaluateAll(slides=>slides.map(s=>{const tree=n=>n.tagName+'('+[...n.children].map(tree).join(',')+')';return tree(s.querySelector('.composition')||s.querySelector('.reference-cover'));}));
      assert.equal(structures.length,22);assert.equal(new Set(structures).size,22);
      for(const i of [2,6,7]){
        await page.evaluate(i=>window.__goSlide(i),i);await page.waitForTimeout([11,19,20,21].includes(i)?1000:100);
        const audit=await page.locator('#deck .slide.is-current').evaluate(s=>{
          const r=s.getBoundingClientRect(),bad=[],fragments=[];
          for(const el of s.querySelectorAll('h2,h3,p,span,strong,dd,dt,figure,a')){
            if(el.closest('[data-title-compact],[aria-hidden="true"]'))continue;
            const b=el.getBoundingClientRect();if(b.width&&b.height&&(b.left<r.left-2||b.right>r.right+2||b.top<r.top-2||b.bottom>r.bottom+2))bad.push(el.textContent.slice(0,50));
          }
          const walker=document.createTreeWalker(s,NodeFilter.SHOW_TEXT);let n;
          while(n=walker.nextNode()){if(!n.textContent.trim()||n.parentElement.closest('[data-title-compact],[aria-hidden="true"]'))continue;const range=document.createRange();range.selectNodeContents(n);const b=range.getBoundingClientRect();if(b.width&&b.height)fragments.push({text:n.textContent.trim(),l:b.left,r:b.right,t:b.top,b:b.bottom});}
          const overlap=[];for(let a=0;a<fragments.length;a++)for(let b=a+1;b<fragments.length;b++){const x=fragments[a],y=fragments[b];if(Math.min(x.r,y.r)-Math.max(x.l,y.l)>.5&&Math.min(x.b,y.b)-Math.max(x.t,y.t)>.5)overlap.push([x.text,y.text]);}
          return {bad,overlap,missing:[...s.querySelectorAll('img')].filter(i=>!i.naturalWidth).map(i=>i.src)};
        });
        assert.deepEqual(audit,{bad:[],overlap:[],missing:[]},JSON.stringify({name,lang,page:i+1,audit}));
        await page.screenshot({path:path.join(out,`${name}-${lang}-${i+1}.png`)});checks.push({name,lang,page:i+1,...audit});
      }
    }
    assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'qa.json'),JSON.stringify({checks,errors,uniqueStructures:22},null,2));console.log({checks:checks.length,errors,uniqueStructures:22});
  }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
