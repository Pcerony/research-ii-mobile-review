const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {chromium} = require('playwright');

// Read external references only; retain counts and anonymous selector labels, not images.
async function main() {
  const base = process.argv[2];
  if (!base) throw new Error('Pass the reference project directory.');
  const files = ['ppt/index.html', 'dist/index.html', 'src/content/slides/s16-heatmap-overview.json', '实验论文资料汇总/05_幻灯片结构化数据/slides/s16-heatmap-overview.json'];
  const browser = await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true});
  const results = [];
  try {
    const page = await browser.newPage({javaScriptEnabled:false});
    await page.route('**/*', route => route.abort());
    for (const file of files) {
      const raw = fs.readFileSync(path.join(base,file),'utf8');
      let markup = file.endsWith('.json') ? JSON.parse(raw).markup : raw;
      markup = markup.replace(/<script\b[\s\S]*?<\/script>/gi, '').replace(/\bsrc="[^"]*"/g, 'src=""');
      await page.setContent(markup);
      const views = await page.locator('[data-heatmap-overview]').evaluateAll(nodes => nodes.map(node => {
        const picks = [...node.querySelectorAll('[data-heatmap-pick]')];
        const cards = [...node.querySelectorAll('[data-heatmap-card]')];
        const sides = ['control','intervention'].map(side => {
          const ids = [...node.querySelectorAll(`[data-heatmap-card="${side}"]`)].map(card => Number(card.getAttribute('data-heatmap-index')));
          return {side, count:ids.length, indices:ids};
        });
        return {selectorCount:picks.length, selectorIndices:picks.map(p=>Number(p.getAttribute('data-heatmap-pick'))), anonymousLabels:picks.map(p=>p.textContent.trim()).filter(p=>/^P\d{2}$/.test(p)), cardCount:cards.length, sides};
      }));
      results.push({file, sha256:crypto.createHash('sha256').update(raw).digest('hex'), views});
    }
  } finally { await browser.close(); }
  fs.mkdirSync('05_输出/qa/sample-count', {recursive:true});
  fs.writeFileSync('05_输出/qa/sample-count/reference-counts.json',JSON.stringify(results,null,2));
  console.log(JSON.stringify(results,null,2));
}
main().catch(error => {console.error(error);process.exitCode=1;});
