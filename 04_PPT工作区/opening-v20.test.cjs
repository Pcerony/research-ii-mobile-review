const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const opening=require('./opening-slides.cjs');
const co=require('./cocreation-content.cjs');
const rows=require('./research-content.cjs');
const t=(ja,zh,tag='span',cls='')=>`<${tag} class="${cls}">${ja}|${zh}</${tag}>`;
const pages=opening({t,h:(...args)=>t(...args,'h2'),sub:()=>'',image:src=>`<img src="${src}">`,caption:(...args)=>t(...args,'figcaption'),source:()=>''});
test('background has two real photos and no redundant caption',()=>{
  assert.match(pages[0][1],/garden\.jpg/);
  assert.match(pages[0][1],/sign-context\.jpg/);
  assert.doesNotMatch(pages[0][1],/植物与解说标识处于同一场景/);
  assert.match(pages[0][1],/共创工作坊/);
});
test('workshop has a gallery, exact research spans and ownership below the rail',()=>{
  const html=pages[1][1];
  assert.match(html,/共创工作坊流程/);
  assert.match(html,/co-hero-gallery/);
  assert.equal((html.match(/data-cocreation-intro=/g)||[]).length,0);
  assert.doesNotMatch(html,/co-summary|co-hero-note|co-process-label/);
  assert.match(html,/co-owner-i/);assert.match(html,/co-owner-ii/);
  assert.match(fs.readFileSync('04_PPT工作区/conference-slides.css','utf8'),/\.co-owner-ii\{grid-column:7\/8\}/);
  assert.ok(html.indexOf('co-process-rail')<html.indexOf('co-research-spans'));
  assert.ok(html.indexOf('co-hero-gallery')<html.indexOf('co-process-wrap'));
});
test('speech complements the diagram and uses the confirmed start year',()=>{
  assert.match(co.intro.body[1],/两天/);
  assert.match(rows[2].zh,/研究Ⅰ研究调研和问题整理/);
  assert.doesNotMatch(rows[2].zh,/这一页|2013/);
  assert.match(rows[2].zh,/2016/);
  assert.match(rows[2].ja,/2016/);
  assert.equal(rows.filter(r=>!r.supplement).reduce((sum,r)=>sum+r.seconds,0),600);
});
