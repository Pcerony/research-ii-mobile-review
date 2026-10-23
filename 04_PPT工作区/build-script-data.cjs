const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),core=require('./review-core.js');
const root=__dirname,hash=b=>crypto.createHash('sha256').update(b).digest('hex');
require('./verify-bilingual-alignment.cjs').validate(require('./research-content.cjs'),require('./bilingual-alignment.json'));
const manifest=JSON.parse(fs.readFileSync(path.join(root,'review-audio-manifest.json')));
const data={version:1,speechVersion:manifest.speechVersion,translationVersion:56,deckHash:manifest.deckHash,languages:{}};
for(const [language,names] of Object.entries({ja:['発表原稿_日本語.md','補足原稿_日本語.md'],zh:['演讲稿_中文审查.md','补充稿_中文审查.md']})){
 data.languages[language]={};
 for(const [i,scope] of ['main','supplement'].entries()){
  const bytes=fs.readFileSync(path.join(root,names[i])),clips=core.parseNarrative(bytes.toString('utf8')).map((c,k)=>({...c,id:(i?'q':'p')+String(k+1).padStart(2,'0')}));
  const audio=i?manifest.appendixClips:manifest.clips;
  require('./verify-bilingual-alignment.cjs').validateClips(require('./research-content.cjs'),clips,language,scope);
  if(clips.length!==audio.length||clips.some((c,k)=>c.slide!==audio[k].slide))throw Error('讲稿与Slide/段落对应不一致：'+language+'/'+scope);
  data.languages[language][scope]={speechHash:hash(bytes),clips};
 }
}
if(data.languages.zh.main.speechHash!==manifest.speechHash||data.languages.zh.supplement.speechHash!==manifest.appendixSpeechHash)throw Error('中文原稿已改变，请先重建审查数据');
fs.writeFileSync(path.join(root,'script-data.js'),'window.SCRIPT_DATA='+JSON.stringify(data)+';\n');
console.log('Script editor data: ja/zh, 19 main + 5 supplement paragraphs each.');
