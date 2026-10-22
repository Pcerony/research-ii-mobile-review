const test=require('node:test'),assert=require('node:assert/strict');
const opening=require('./opening-slides.cjs');
const t=(ja,zh,tag='span',cls='')=>`<${tag} class="${cls}">${ja}|${zh}</${tag}>`;
const pages=opening({t,h:(...args)=>t(...args,'h2'),sub:()=>'',image:src=>`<img src="${src}">`,caption:(...args)=>t(...args,'figcaption'),source:()=>''});
test('workshop removes the return toolbar and aligns prototype comparison',()=>{
 const html=pages[1][1];assert.match(html,/共创工作坊流程的改善/);
 assert.doesNotMatch(html,/co-view-toolbar|data-cocreation-intro/);
 assert.ok(html.indexOf('co-process-rail')<html.indexOf('co-research-spans'));
 assert.match(html,/co-prototype-arrow/);assert.match(html,/当前的植物园标识设计/);
 assert.match(html,/基于研究Ⅰ的A\/R\/S原则优化后的设计/);
});
test('gaze detail explains recorded positions and co-creation use, not case studies',()=>{
 const html=pages[2][1];assert.match(html,/视线追踪作为定量方法的补充/);
 assert.match(html,/gaze-data-meaning/);assert.match(html,/gaze-principle/);
 assert.doesNotMatch(html,/gaze-data-bottom/);assert.doesNotMatch(html,/gaze-application-pair/);
 assert.equal((html.match(/class="method-output"/g)||[]).length,8);
 assert.doesNotMatch(pages[3][1],/class="gaze-principle"/);
 assert.match(pages[3][1],/主流的两条视线追踪技术路径/);
 assert.match(pages[4][1],/非穿戴・实地评价方法的开发/);
});
