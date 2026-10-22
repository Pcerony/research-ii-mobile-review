const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=__dirname,files=new Set(['review.html','review.html?scope=supplement','index.html','review.css','review.js','review-mobile.js','review-core.js','review-slide.js','review-data.js','review.webmanifest']);
for(const file of ['script.html','script.html?scope=supplement','script-editor.js','script-editor.css','script-data.js','script-core.js','script.webmanifest','review-offline.js'])files.add(file);
const manifest=JSON.parse(fs.readFileSync(path.join(root,'review-audio-manifest.json')));
for(const c of [...manifest.clips,...manifest.appendixClips])files.add(c.audio);
for(const f of ['index.html','review.css','review-mobile.js']){
 const text=fs.readFileSync(path.join(root,f),'utf8');
 for(const m of text.matchAll(/(?:["'(])(assets\/[a-zA-Z0-9_./-]+)/g))files.add(m[1]);
}
files.add('assets/review-icon.png');files.add('assets/review-icon-512.png');
// Inline scripts can refer to numbered heatmaps; all eighteen are needed.
for(let i=1;i<=9;i++)for(const condition of ['control','intervention'])files.add(`assets/heatmaps/P0${i}-${condition}.png`);
const hash=crypto.createHash('sha256');let bytes=0;
for(const f of [...files].sort()){const b=fs.readFileSync(path.join(root,f.split('?')[0]));hash.update(f).update(b);bytes+=b.length;}
const pack={version:hash.digest('hex').slice(0,16),bytes,files:[...files].sort()};
fs.writeFileSync(path.join(root,'offline-files.json'),JSON.stringify(pack,null,2)+'\n');
fs.writeFileSync(path.join(root,'review-offline-config.js'),'self.OFFLINE_PACK='+JSON.stringify(pack)+';\n');
console.log(JSON.stringify({files:files.size,bytes,version:pack.version}));
