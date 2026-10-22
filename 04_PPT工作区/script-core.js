(function(root){
  'use strict';
  function pages(clips){
    const result=[];clips.forEach((clip,i)=>{let page=result.find(p=>p.slide===clip.slide);if(!page){page={slide:clip.slide,heading:clip.heading,indices:[]};result.push(page);}page.indices.push(i);});return result;
  }
  function edition(data,language,scope){const e=data.languages?.[language]?.[scope];if(!e)throw Error('讲稿语言或范围无效');return e;}
  function storageKey(data,language,scope){const e=edition(data,language,scope);return `${language==='zh'?'researchII.review':'researchII.script.ja'}.${e.speechHash}.${data.deckHash}.drafts`;}
  function sanitizeDrafts(value,clips){const result={};if(value&&typeof value==='object')for(const [key,draft] of Object.entries(value))if(/^\d+$/.test(key)&&Number(key)<clips.length&&typeof draft?.text==='string')result[key]={text:draft.text,updatedAt:draft.updatedAt};return result;}
  function draftText(clips,drafts,i){return Object.hasOwn(drafts,i)?drafts[i].text:clips[i].text;}
  function mergeWrite(storage,key,clips,drafts,dirty,bases){
    const latest=sanitizeDrafts(JSON.parse(storage.getItem(key)||'{}'),clips),conflicts=[];
    for(const i of dirty)if(draftText(clips,latest,i)!==bases.get(i)&&draftText(clips,latest,i)!==draftText(clips,drafts,i))conflicts.push(i);
    if(conflicts.length)return {ok:false,conflicts};
    for(const i of dirty){if(Object.hasOwn(drafts,i))latest[i]=drafts[i];else delete latest[i];}
    storage.setItem(key,JSON.stringify(latest));dirty.clear();bases.clear();return {ok:true,drafts:latest};
  }
  function makePackage(data,language,scope,drafts){
    const e=edition(data,language,scope),clips=e.clips.map((clip,i)=>({clipIndex:i,clipId:clip.id,slide:clip.slide+1,heading:clip.heading,originalText:clip.text,text:draftText(e.clips,drafts,i)}));
    const edits=clips.filter(c=>c.text!==c.originalText).map(c=>({...c,updatedAt:drafts[c.clipIndex]?.updatedAt||new Date().toISOString()}));
    return {version:3,type:'researchII-script-edit',speechVersion:data.speechVersion,scope,language,speechHash:e.speechHash,deckHash:data.deckHash,exportedAt:new Date().toISOString(),audioLanguage:'zh-CN',audioMatchesDraft:language==='zh'&&edits.length===0,clips,edits};
  }
  function markdown(pack){
    return `# 研究Ⅱ・${pack.language==='ja'?'日本語':'中文'}${pack.scope==='supplement'?'・补充':''}讲稿修订稿\n\n手机编辑草稿；尚未写回正式原稿。源版本：${pack.speechVersion}；源哈希：${pack.speechHash}。\n\n`+pages(pack.clips.map(c=>({...c,slide:c.slide-1}))).map(page=>`## ${String(page.slide+1).padStart(2,'0')}｜修订稿｜${page.heading}\n\n`+page.indices.map(i=>pack.clips[i].text).join('\n\n')).join('\n\n')+'\n';
  }
  function importEdits(pack,data,language,scope){
    const e=edition(data,language,scope);
    if(pack?.type!=='researchII-script-edit'||pack.version!==3||pack.language!==language||pack.scope!==scope||pack.speechHash!==e.speechHash||pack.deckHash!==data.deckHash)throw Error('版本、语言或范围不符，未导入');
    if(!Array.isArray(pack.edits))throw Error('修改文件格式无效');const result={},seen=new Set();
    for(const edit of pack.edits){
      const clip=e.clips[edit.clipIndex];
      if(!Number.isInteger(edit.clipIndex)||!clip||seen.has(edit.clipIndex)||edit.clipId!==clip.id||edit.originalText!==clip.text||edit.slide!==clip.slide+1||typeof edit.text!=='string')throw Error('修改位置或原文无效');
      seen.add(edit.clipIndex);result[edit.clipIndex]={text:edit.text,updatedAt:typeof edit.updatedAt==='string'?edit.updatedAt:new Date().toISOString()};
    }
    return result;
  }
  const api={pages,edition,storageKey,sanitizeDrafts,draftText,mergeWrite,package:makePackage,markdown,importEdits};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.ScriptEditorCore=api;
})(typeof window==='undefined'?globalThis:window);
