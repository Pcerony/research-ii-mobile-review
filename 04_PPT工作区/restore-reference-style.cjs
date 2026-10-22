// One-time migration. Inputs are explicit files, never runtime dependencies.
const fs = require('fs');
const [referencePath, targetPath] = process.argv.slice(2);
if (!referencePath || !targetPath) throw new Error('Expected reference HTML and target HTML');
const reference = fs.readFileSync(referencePath, 'utf8');
const target = fs.readFileSync(targetPath, 'utf8');
if (target.includes('id="reference-style"')) throw new Error('Already migrated; edit index.html directly.');
const css = reference.match(/<style>([\s\S]*?)<\/style>/)[1];
const ascii = reference.slice(reference.lastIndexOf('<script>'), reference.lastIndexOf('</script>') + 9);
const slides = [...target.matchAll(/<section class="slide\b[\s\S]*?<\/section>/g)].map(x => x[0]);
if (slides.length !== 14) throw new Error(`Expected 14 slides, found ${slides.length}`);
fs.mkdirSync('05_输出/qa', {recursive:true});
fs.writeFileSync('05_输出/qa/rejected-first-version.html', target);
const chapters = [1,1,1,1,2,2,3,3,3,4,4,4,5,5];
const layouts = ['SWISS-COVER-ASCII','S02','S16','S05','S05','S16','S16','S16','S16','S06','S20','S21','S05','SWISS-CLOSING-ASCII'];
const converted = slides.map((source, i) => {
  let s = source.replace(/class="slide[^"]*"/, `class="slide${i === 0 ? ' accent' : ''}"`)
    .replace(/data-chapter="[^"]*"/, `data-chapter="${chapters[i]}" data-layout="${layouts[i]}"`)
    .replace(/class="heatmap-card"/g, 'class="paired-heatmap"')
    .replace(/<h2 /g, '<h2 class="h-xl-zh" ')
    .replace(/<h3/g, '<h3')
    .replace(/style="margin-top:2vh;max-width:45ch"/g, 'style="margin-top:24px;max-width:45ch"');
  const openEnd = s.indexOf('>') + 1;
  s = s.slice(0, openEnd) + '<div class="canvas-card">' + s.slice(openEnd, -10) + '</div></section>';
  if (i === 0) {
    const title = source.match(/<h1[\s\S]*?<\/h1>/)[0];
    const subtitle = source.match(/<p class="subtitle"[\s\S]*?<\/p>/)[0];
    s = s.slice(0, s.indexOf('<div class="canvas-card">')) + `<div class="canvas-card">
      <canvas class="ascii-bg" aria-hidden="true"></canvas>
      <div class="reference-cover">
        <div class="t-meta cover-kicker">RESEARCH II · NON-CONTACT EYE-TRACKING</div>
        <div class="cover-title">${title}${subtitle}</div>
        <div class="cover-bottom"><div class="lead">SIGN Visual Attention</div><div class="cover-author"><span>王 平成 · 九州大学芸術工学府</span><span>2026 · 芸術工学会</span></div></div>
      </div></div></section>`;
  }
  return s;
});
const adapter = fs.readFileSync('04_PPT工作区/reference-adapter.css', 'utf8');
const runtime = fs.readFileSync('04_PPT工作区/reference-navigation.js', 'utf8');
const output = `<!DOCTYPE html>
<html lang="ja" data-lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>研究Ⅱ · 非接触型視線計測評価ツール</title><link rel="icon" href="data:,">
<!-- Original web-deck CSS, reused verbatim. Only content-specific adapters follow. -->
<style id="reference-style">${css}</style><style id="content-adapter">${adapter}</style></head>
<body class="canvas-mode card-reduction-mode">
<main id="presentation-stage"><header id="presentation-indicator"><div class="indicator-timeline-container"><div id="indicator-timeline-chapters"></div></div></header>
<div id="deck">${converted.join('\n')}</div>
<footer id="presentation-footer"><span id="indicator-title" class="chapter-sub-zh"></span><button id="prev" title="Previous slide" aria-label="Previous slide">←</button><span id="indicator-page" class="indicator-page-wrapper"></span><button id="next" title="Next slide" aria-label="Next slide">→</button><button id="overview-toggle" title="Overview" aria-label="Overview">▦</button><div class="language-switch"><button data-language="ja">JA</button><button data-language="zh">ZH</button></div></footer></main>
<dialog id="overview"><div class="overview-heading"><h2 data-ja="ページ総覧" data-zh="页面总览">ページ総覧</h2><button id="overview-close" aria-label="Close">×</button></div><div id="overview-grid"></div></dialog>
<script>${runtime}</script>${ascii}</body></html>`;
fs.writeFileSync(targetPath, output);
console.log('Migrated 14 slides; original CSS and ASCII canvas copied verbatim.');
