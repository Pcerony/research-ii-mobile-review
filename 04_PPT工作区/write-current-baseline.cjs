const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const target='00_项目管理/审查基线_第35稿.sha256',files=['AGENTS.md','README.md','MANIFEST.sha256'];
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(e.name==='.DS_Store'||e.name.endsWith('.sha256'))continue;const file=path.join(dir,e.name);if(e.isDirectory())walk(file);else files.push(file);}}
for(const dir of ['00_项目管理','01_主稿参考','02_证据','03_图表与素材','04_PPT工作区'])walk(dir);
fs.writeFileSync(target,files.sort().map(f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')+'  '+f).join('\n')+'\n');
console.log(JSON.stringify({target,files:files.length}));
