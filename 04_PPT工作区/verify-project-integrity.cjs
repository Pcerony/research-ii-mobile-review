const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const out='05_输出/qa/mobile-v35';fs.mkdirSync(out,{recursive:true});
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
function audit(file,normalize=false){
 const result={matched:[],changed:[],missing:[],readOnlyChanged:[]};
 for(const line of fs.readFileSync(file,'utf8').trim().split('\n')){
  const match=/^([a-f0-9]{64})\s+(.+)$/.exec(line);assert.ok(match,line);
  const name=normalize?match[2].replace(/^08_发表用PPT工作包_研究Ⅱ_工具验证\//,''):match[2];
  if(!fs.existsSync(name))result.missing.push(name);
  else if(hash(name)===match[1])result.matched.push(name);
  else{result.changed.push(name);if(/^(01_主稿参考|02_证据|03_图表与素材)\//.test(name))result.readOnlyChanged.push(name);}
 }
 return result;
}
const legacy=audit('MANIFEST.sha256',true),previous=audit('00_项目管理/审查基线_第34稿.sha256');
assert.equal(legacy.missing.length,0);assert.equal(legacy.readOnlyChanged.length,0);assert.equal(previous.missing.length,0);
const expected=new Set(['04_PPT工作区/review.html','04_PPT工作区/review.js','04_PPT工作区/review.css','04_PPT工作区/review-slide.js','04_PPT工作区/verify-review.cjs']);
for(const f of previous.changed)assert.ok(expected.has(f),`Unexpected baseline change: ${f}`);
fs.writeFileSync(out+'/manifest-audit.json',JSON.stringify({legacy,previous},null,2));
console.log(JSON.stringify({legacy:{matched:legacy.matched.length,changed:legacy.changed.length,missing:legacy.missing.length,readOnlyChanged:legacy.readOnlyChanged.length},previous:{matched:previous.matched.length,changed:previous.changed}},null,2));
