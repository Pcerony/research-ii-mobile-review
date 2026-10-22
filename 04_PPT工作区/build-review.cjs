const fs=require('node:fs');
const path=require('node:path');
const cp=require('node:child_process');
const crypto=require('node:crypto');
const core=require('./review-core.js');
const base='04_PPT工作区';
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const speech=fs.readFileSync(path.join(base,'演讲稿_中文审查.md'),'utf8');
const supplementSpeech=fs.readFileSync(path.join(base,'补充稿_中文审查.md'),'utf8');
const deck=fs.readFileSync(path.join(base,'index.html'),'utf8');
const rows=[...core.parseNarrative(speech),...core.parseNarrative(supplementSpeech).map((r,i)=>({...r,id:`q${String(i+1).padStart(2,'0')}`}))];
const voice='Tingting',rate=190;
const temp='05_输出/qa/review-audio-temp';
const out=path.join(base,'assets/rehearsal');
fs.mkdirSync(out,{recursive:true});fs.mkdirSync(temp,{recursive:true});
function wavDuration(file){
  const b=fs.readFileSync(file);
  if(b.toString('ascii',0,4)!=='RIFF')throw new Error('Expected RIFF WAV');
  let bytesPerSecond=0,dataBytes=0,energy=0;
  for(let i=12;i+8<=b.length;){
    const id=b.toString('ascii',i,i+4),size=b.readUInt32LE(i+4),start=i+8;
    if(id==='fmt ')bytesPerSecond=b.readUInt32LE(start+8);
    if(id==='data'){
      dataBytes=size;
      for(let j=start;j+1<Math.min(b.length,start+size);j+=200)energy+=Math.abs(b.readInt16LE(j));
    }
    i=start+size+(size%2);
  }
  if(!bytesPerSecond||!dataBytes||!energy)throw new Error('Empty or silent WAV');
  return dataBytes/bytesPerSecond;
}
for(const row of rows){
  const spoken=core.spokenText(row.text);
  const key=hash(JSON.stringify({spoken,voice,rate})).slice(0,16);
  const filename=`${row.id}-${key}.wav`;
  const dest=path.join(out,filename);
  const cached=fs.readdirSync(out).find(name=>name.endsWith(`-${key}.wav`));
  if(!fs.existsSync(dest)&&cached)fs.copyFileSync(path.join(out,cached),dest);
  if(!fs.existsSync(dest)){
    const aiff=path.join(temp,`${row.id}.aiff`);
    cp.execFileSync('/usr/bin/say',['-v',voice,'-r',String(rate),'-o',aiff,spoken],{timeout:120000});
    cp.execFileSync('/usr/bin/afconvert',['-f','WAVE','-d','LEI16','-c','1',aiff,dest],{timeout:30000});
    fs.unlinkSync(aiff);
  }
  row.audio=`assets/rehearsal/${filename}`;
  row.duration=wavDuration(dest);
  row.spokenText=spoken;
  row.audioHash=hash(fs.readFileSync(dest));
  console.log(`${row.id} slide ${row.slide+1}: ${row.duration.toFixed(1)} s`);
}
const sections=[...deck.matchAll(/<section class="slide\b[\s\S]*?<\/section>/g)].map(m=>m[0]);
const slideCount=sections.length,heatmapSlide=sections.findIndex(s=>s.includes('data-layout="heatmap-explorer"'));
const workflowSlide=sections.findIndex(s=>s.includes('data-layout="operating-panorama"'));
const mainSlideCount=sections.filter(s=>!s.includes('data-supplement="true"')).length;
const workflowClips=rows.filter(r=>r.slide===workflowSlide);
if(workflowClips.length!==4)throw new Error('Each workflow step needs its own audio segment.');
workflowClips.forEach((row,i)=>row.workflowStep=i);
if(rows.some(r=>r.slide>=slideCount))throw new Error('Speech points outside the deck.');
const clips=rows.filter(r=>r.slide<mainSlideCount),appendixClips=rows.filter(r=>r.slide>=mainSlideCount);
const data={version:3,speechVersion:38,slideCount,mainSlideCount,heatmapSlide,workflowSlide,language:'zh-CN',voice,rate,deckHash:hash(deck),speechHash:hash(speech),appendixSpeechHash:hash(supplementSpeech),duration:clips.reduce((n,r)=>n+r.duration,0),appendixDuration:appendixClips.reduce((n,r)=>n+r.duration,0),clips,appendixClips,deckHtml:deck};
// A script payload, rather than fetch, lets the review page run directly from file://.
fs.writeFileSync(path.join(base,'review-data.js'),'window.REVIEW_DATA='+JSON.stringify(data)+';\n');
const {deckHtml,...manifest}=data;
fs.writeFileSync(path.join(base,'review-audio-manifest.json'),JSON.stringify(manifest,null,2));
console.log(JSON.stringify({mainClips:clips.length,appendixClips:appendixClips.length,duration:data.duration,appendixDuration:data.appendixDuration,voice,deckHash:data.deckHash},null,2));
require('./build-script-data.cjs');
