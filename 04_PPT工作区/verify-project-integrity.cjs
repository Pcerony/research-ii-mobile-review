const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const out='05_输出/qa/script-v36';fs.mkdirSync(out,{recursive:true});
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
const legacy=audit('MANIFEST.sha256',true),previous=audit('00_项目管理/审查基线_第35稿.sha256');
assert.equal(legacy.missing.length,0);assert.equal(legacy.readOnlyChanged.length,0);assert.equal(previous.missing.length,0);
const expected=new Set(['AGENTS.md','README.md',...['05_决策日志.md','06_变更日志.md','07_提交前QA清单.md','08_工作会话记录.md','09_文件清单与校验.md','README.md'].map(f=>'00_项目管理/'+f),...['build-review.cjs','build-offline.cjs','build-public-archive.cjs','review.html','review.js','review-mobile.js','review.css','review.webmanifest','review-sw.js','write-current-baseline.cjs','verify-project-integrity.cjs','offline-files.json','review-offline-config.js','手机离线审查.md'].map(f=>'04_PPT工作区/'+f)]);
for(const f of previous.changed)assert.ok(expected.has(f),`Unexpected baseline change: ${f}`);
const known=new Set(fs.readFileSync('00_项目管理/审查基线_第35稿.sha256','utf8').trim().split('\n').map(line=>line.slice(66))),added=[];
const expectedAdded=new Set(['00_项目管理/38_手机讲稿编辑设计与实施.md','00_项目管理/39_第36稿当前状态.md',...['build-script-data.cjs','review-offline.js','script-core.js','script-data.js','script-editor.css','script-editor.js','script-editor.test.cjs','script.html','script.webmanifest','verify-script-editor.cjs'].map(f=>'04_PPT工作区/'+f)]);
function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=dir+'/'+entry.name;if(entry.name==='.DS_Store'||file.endsWith('.sha256'))continue;if(entry.isDirectory())walk(file);else if(!known.has(file)){added.push(file);assert.ok(expectedAdded.has(file),'Unexpected added file: '+file);}}}
for(const dir of ['00_项目管理','01_主稿参考','02_证据','03_图表与素材','04_PPT工作区'])walk(dir);
fs.writeFileSync(out+'/manifest-audit.json',JSON.stringify({legacy,previous,added},null,2));
console.log(JSON.stringify({legacy:{matched:legacy.matched.length,changed:legacy.changed.length,missing:legacy.missing.length,readOnlyChanged:legacy.readOnlyChanged.length},previous:{matched:previous.matched.length,changed:previous.changed},added},null,2));
