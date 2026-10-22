(function(root){
  function parseNarrative(markdown){
    const source=markdown.split('\n---')[0];
    const sections=[...source.matchAll(/## (\d{2})｜[^\n]*｜([^\n]+)\n([\s\S]*?)(?=\n## |$)/g)];
    const rows=sections.flatMap(m=>m[3].trim().split(/\n\s*\n/).map(text=>({section:m[1],heading:m[2],text:text.trim(),slide:Number(m[1])-1})));
    if(!rows.length)throw new Error('讲稿中没有可用的正文段落。');
    return rows.map((r,i)=>({...r,id:`p${String(i+1).padStart(2,'0')}`}));
  }
  function elapsedBefore(clips,index){return clips.slice(0,index).reduce((n,c)=>n+c.duration,0);}
  function locateTime(clips,seconds){
    let offset=Math.max(0,Number(seconds)||0);
    for(let index=0;index<clips.length;index++){
      if(offset<clips[index].duration||index===clips.length-1)return {index,offset:Math.min(offset,clips[index].duration)};
      offset-=clips[index].duration;
    }
    return {index:0,offset:0};
  }
  function spokenText(text){return text.replace(/([\d.]+)%/g,'百分之$1').replaceAll('AOI','A O I').replaceAll('GGJ','G G J').replaceAll('WebGazer.js','Web Gazer').replaceAll('研究Ⅱ','研究二').replaceAll('研究Ⅰ','研究一');}
  function heatmapAt(slide,offset,duration,heatmapSlide){return slide===heatmapSlide?(offset/duration<.36?0:offset/duration<.7?3:7):null;}
  function createAnchor(text,start,end){
    if(!Number.isInteger(start)||!Number.isInteger(end)||start<0||end>text.length||start>=end)throw new RangeError('Invalid text selection');
    return {start,end,quote:text.slice(start,end),prefix:text.slice(Math.max(0,start-32),start),suffix:text.slice(end,end+32),sourceText:text};
  }
  function resolveAnchor(text,anchor){
    if(!anchor||typeof anchor.quote!=='string'||!anchor.quote)return null;
    if(text===anchor.sourceText&&text.slice(anchor.start,anchor.end)===anchor.quote)return {start:anchor.start,end:anchor.end};
    const matches=[];
    for(let start=text.indexOf(anchor.quote);start>=0;start=text.indexOf(anchor.quote,start+1)){
      const end=start+anchor.quote.length;
      let score=0;
      for(let i=1;i<=Math.min((anchor.prefix||'').length,start);i++){if(text[start-i]!==anchor.prefix[anchor.prefix.length-i])break;score++;}
      for(let i=0;i<Math.min((anchor.suffix||'').length,text.length-end);i++){if(text[end+i]!==anchor.suffix[i])break;score++;}
      matches.push({start,end,score});
    }
    matches.sort((a,b)=>b.score-a.score);
    if(!matches.length||(matches.length>1&&matches[0].score===matches[1].score))return null;
    return {start:matches[0].start,end:matches[0].end};
  }
  function normalizeSlideRect(bounds,a,b){
    if(![bounds.left,bounds.top,bounds.width,bounds.height,a.x,a.y,b.x,b.y].every(Number.isFinite)||bounds.width<=0||bounds.height<=0)throw new RangeError('Invalid slide bounds');
    const clamp=n=>Math.max(0,Math.min(1,n)),x1=clamp((Math.min(a.x,b.x)-bounds.left)/bounds.width),y1=clamp((Math.min(a.y,b.y)-bounds.top)/bounds.height),x2=clamp((Math.max(a.x,b.x)-bounds.left)/bounds.width),y2=clamp((Math.max(a.y,b.y)-bounds.top)/bounds.height);
    const round=n=>Math.round(n*1e8)/1e8;
    return {x:round(x1),y:round(y1),width:round(x2-x1),height:round(y2-y1)};
  }
  function validSlideTarget(t){
    if(!t||!Number.isInteger(t.slideIndex)||t.slideIndex<0||!['ja','zh'].includes(t.language))return false;
    if(t.type==='slide-page')return true;
    if(t.type==='slide-text')return Array.isArray(t.path)&&t.path.every(n=>Number.isInteger(n)&&n>=0)&&typeof t.anchor?.quote==='string'&&!!t.anchor.quote;
    if(t.type!=='slide-region')return false;
    const r=t.rect;return !!r&&[r.x,r.y,r.width,r.height].every(Number.isFinite)&&r.x>=0&&r.y>=0&&r.width>0&&r.height>0&&r.x+r.width<=1.00000001&&r.y+r.height<=1.00000001;
  }
  const api={parseNarrative,elapsedBefore,locateTime,spokenText,heatmapAt,createAnchor,resolveAnchor,normalizeSlideRect,validSlideTarget};
  if(typeof module!=='undefined')module.exports=api;
  else root.ReviewCore=api;
})(globalThis);
