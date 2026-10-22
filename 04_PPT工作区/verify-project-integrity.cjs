const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const out='05_输出/qa/speech-v37';fs.mkdirSync(out,{recursive:true});
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
const legacy=audit('MANIFEST.sha256',true),previous=audit('00_项目管理/审查基线_第36稿.sha256');
assert.equal(legacy.missing.length,0);assert.equal(legacy.readOnlyChanged.length,0);assert.equal(previous.missing.length,0);
const expected=new Set(["AGENTS.md","README.md","00_项目管理/05_决策日志.md","00_项目管理/07_提交前QA清单.md","00_项目管理/08_工作会话记录.md","04_PPT工作区/build-public-archive.cjs","04_PPT工作区/build-review.cjs","04_PPT工作区/offline-files.json","04_PPT工作区/research-content.cjs","04_PPT工作区/review-audio-manifest.json","04_PPT工作区/review-data.js","04_PPT工作区/review-offline-config.js","04_PPT工作区/script-data.js","04_PPT工作区/verify-narrative.cjs","04_PPT工作区/verify-review.cjs","04_PPT工作区/write-current-baseline.cjs","04_PPT工作区/write-research-speech.cjs","04_PPT工作区/verify-project-integrity.cjs","04_PPT工作区/演讲稿_中文审查.md","04_PPT工作区/発表原稿_日本語.md","04_PPT工作区/补充稿_中文审查.md","04_PPT工作区/補足原稿_日本語.md"]);
for(const f of previous.changed)assert.ok(expected.has(f),`Unexpected baseline change: ${f}`);
const known=new Set(fs.readFileSync('00_项目管理/审查基线_第36稿.sha256','utf8').trim().split('\n').map(line=>line.slice(66))),added=[];
const expectedAdded=new Set(["00_项目管理/40_手机中文讲稿回交原文.md","00_项目管理/41_第37稿当前状态.md","04_PPT工作区/revision-v37.test.cjs","04_PPT工作区/assets/rehearsal/p01-b810c2149c44d5aa.wav","04_PPT工作区/assets/rehearsal/p02-e201690568b199f7.wav","04_PPT工作区/assets/rehearsal/p03-a79f481fb03a6c84.wav","04_PPT工作区/assets/rehearsal/p04-35f72f62e529e30b.wav","04_PPT工作区/assets/rehearsal/p05-cc30706d03484b67.wav"]);
function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=dir+'/'+entry.name;if(entry.name==='.DS_Store'||file.endsWith('.sha256'))continue;if(entry.isDirectory())walk(file);else if(!known.has(file)){added.push(file);assert.ok(expectedAdded.has(file),'Unexpected added file: '+file);}}}
for(const dir of ['00_项目管理','01_主稿参考','02_证据','03_图表与素材','04_PPT工作区'])walk(dir);
fs.writeFileSync(out+'/manifest-audit.json',JSON.stringify({legacy,previous,added},null,2));
console.log(JSON.stringify({legacy:{matched:legacy.matched.length,changed:legacy.changed.length,missing:legacy.missing.length,readOnlyChanged:legacy.readOnlyChanged.length},previous:{matched:previous.matched.length,changed:previous.changed},added},null,2));
