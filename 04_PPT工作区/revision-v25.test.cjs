const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
test('new feedback is incremental and scientific images are not cover-cropped',()=>{
 const s=fs.readFileSync('04_PPT工作区/opening-slides.cjs','utf8');assert.match(s,/KJ法/);assert.doesNotMatch(s,/出声思考|gaze-data-bottom|实环境・穿戴式/);
 const css=fs.readFileSync('04_PPT工作区/conference-slides.css','utf8');assert.match(css,/photo-fill/);
});
test('field page uses multiple field photographs and the heatmap has a color legend',()=>{
 const s=fs.readFileSync('04_PPT工作区/build-research-slides.cjs','utf8');assert.match(s,/field-photo-story/);
 assert.match(s,/experiment-scene.jpg/);assert.match(s,/field-observation.jpg/);
 const heat=require('./heatmap-stack-content.cjs')({t:(a,b)=>a+'|'+b,h:()=>'',sub:()=>''});
 assert.match(heat,/heatmap-color-legend/);assert.match(heat,/相对热强度/);assert.doesNotMatch(heat,/preview-boundary/);
});
test('questionnaire percentage conversion preserves the source counts and denominator',()=>{
 const survey=require('./questionnaire-summary.json');for(const item of survey.items){assert.equal(item.n,4);assert.equal(item.counts.reduce((s,n)=>s+n,0),4);assert.equal(item.counts.reduce((s,n)=>s+n/item.n*100,0),100);}
 const s=fs.readFileSync('04_PPT工作区/build-research-slides.cjs','utf8');assert.match(s,/data-percent/);assert.match(s,/item\.n/);assert.match(s,/回复比例/);
});
