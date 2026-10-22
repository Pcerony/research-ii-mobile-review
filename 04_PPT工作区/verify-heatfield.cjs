const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const {chromium} = require('playwright');

async function main() {
  const output = path.resolve('05_输出/qa/heatfield');
  fs.mkdirSync(output, {recursive: true});
  const browser = await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true});
  const errors = [], results = [];
  try {
    const page = await browser.newPage();
    page.on('pageerror', error => errors.push(error.message));
    const url = pathToFileURL(path.resolve('04_PPT工作区/heatfield-preview.html')).href;
    const pixels = () => page.locator('canvas').evaluate(canvas => {
      const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
      let sum = 0; for(let i=0;i<data.length;i+=13) sum += data[i]; return sum;
    });
    for (const viewport of [{width:1440,height:1000},{width:390,height:844}]) {
      await page.setViewportSize(viewport);
      for (const lang of ['ja','zh']) {
        await page.goto(url + (lang === 'zh' ? '?lang=zh' : ''));
        await page.waitForTimeout(200);
        const bounds = await page.locator('.stage').boundingBox();
        assert.ok(bounds.x >= -1 && bounds.y >= -1 && bounds.x + bounds.width <= viewport.width + 1 && bounds.y + bounds.height <= viewport.height + 1);
        const overflow = await page.locator('.content').evaluate(el => [...el.querySelectorAll('h1,p,span')].filter(n => n.scrollWidth > n.clientWidth + 2).map(n => n.textContent));
        assert.deepEqual(overflow, []);
        await page.screenshot({path:path.join(output, `${lang}-${viewport.width}.png`)});
        results.push({lang, viewport, fits:true});
      }
    }
    await page.setViewportSize({width:1440,height:1000});
    await page.goto(url);
    const first = await pixels();
    await page.waitForTimeout(2500);
    const second = await pixels();
    assert.notEqual(first, second, 'Canvas must be nonstatic');
    await page.keyboard.press('Space');
    const paused = await pixels(); await page.waitForTimeout(300);
    assert.equal(await pixels(), paused, 'Pause must freeze the field');
    await page.keyboard.press('Space');
    await page.waitForTimeout(300);
    assert.notEqual(await pixels(), paused, 'Resume must restart the field');
    await page.screenshot({path:path.join(output, 'ja-moving.png')});
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.reload();
    const still = await pixels(); await page.waitForTimeout(300);
    assert.equal(await pixels(), still, 'Reduced motion must remain still');
    assert.deepEqual(errors, []);
    const report = {results, animation:true, pause:true, reducedMotion:true, errors};
    fs.writeFileSync(path.join(output, 'qa.json'), JSON.stringify(report,null,2));
    console.log(report);
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
