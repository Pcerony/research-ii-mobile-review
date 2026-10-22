const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const sharp = require('sharp');
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

// Author approved pixel-exact crops: exclude identity headers and unrelated statistics.
async function main() {
  const source = '03_图表与素材/02_眼动热力图';
  const out = '04_PPT工作区/assets/heatmaps';
  fs.mkdirSync(out, {recursive:true});
  const records = [];
  for (let i=1;i<=9;i++) for (const condition of ['control','intervention']) {
    const id = `P${String(i).padStart(2,'0')}`;
    const filename = `heatmap-${id.toLowerCase()}-${condition}.${i===8&&condition==='control'?'png':'jpg'}`;
    const from = path.join(source,filename);
    const bytes = fs.readFileSync(from);
    const {width,height} = await sharp(bytes).metadata();
    const crop = {left:Math.round(width*.064),top:Math.round(width*.096),width:Math.round(width*.872),height:Math.round(width*.616)};
    if (crop.top+crop.height>height) throw new Error(`Unexpected dimensions: ${id}`);
    const to = path.join(out,`${id}-${condition}.png`);
    const pixels = await sharp(bytes).extract(crop).removeAlpha().raw().toBuffer();
    await sharp(bytes).extract(crop).png().toFile(to);
    const decoded = await sharp(to).removeAlpha().raw().toBuffer();
    if (!pixels.equals(decoded)) throw new Error(`Pixel comparison failed: ${id}`);
    records.push({id,condition,source:from,sourceHash:digest(bytes),sourceSize:{width,height},crop,output:to,outputHash:digest(fs.readFileSync(to)),pixelExact:true});
  }
  fs.writeFileSync('04_PPT工作区/heatmap-preview-provenance.json',JSON.stringify({
    purpose:'Qualitative output previews only; not initial-10-second quantitative evidence.',
    warning:'Stimulus species and participant-to-analysis correspondence are not independently resolved.',
    authorization:'User approved deterministic identity-header and statistics-footer removal, 2026-10-21.',
    records
  },null,2));
  fs.mkdirSync('05_输出/qa/slide-v5',{recursive:true});
  const tiles=[];
  for(let i=0;i<records.length;i++) tiles.push({input:await sharp(records[i].output).resize({width:300,height:220,fit:'contain',background:'#ffffff'}).png().toBuffer(),left:(i%4)*300,top:Math.floor(i/4)*220});
  await sharp({create:{width:1200,height:1100,channels:3,background:'#ffffff'}}).composite(tiles).png().toFile('05_输出/qa/slide-v5/anonymized-contact.png');
  console.log({images:records.length,pixelExact:records.every(r=>r.pixelExact)});
}
main().catch(e=>{console.error(e);process.exitCode=1;});
