(function(root){
 'use strict';
 const anchors=typeof module!=='undefined'&&module.exports?require('./review-core.js'):root.ReviewCore;
 function selection(text,start,end){if(!Number.isInteger(start)||!Number.isInteger(end)||start<0||end<=start||end>text.length)throw Error('选区无效');return {start,end,quote:text.slice(start,end)};}
 function remove(text,sel){if(!sel||text.slice(sel.start,sel.end)!==sel.quote)throw Error('原文已经变化，请重新选择');return {text:text.slice(0,sel.start)+text.slice(sel.end),start:sel.start};}
 function make(clips,index,text,sel,kind,instruction){
  if(!clips[index]||!['comment','request'].includes(kind)||!instruction.trim())throw Error('批注内容无效');
  const clip=clips[index],selected=sel||{start:0,end:text.length,quote:text};
  if(text.slice(selected.start,selected.end)!==selected.quote)throw Error('原文已经变化，请重新选择');
  return {id:typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():Date.now()+'-'+Math.random().toString(36).slice(2),clipIndex:index,clipId:clip.id,slide:clip.slide+1,kind,instruction:instruction.trim(),quote:selected.quote,contextText:text,anchor:selected.quote?anchors.createAnchor(text,selected.start,selected.end):null,updatedAt:new Date().toISOString()};
 }
 function sanitize(value,clips){if(!Array.isArray(value))return [];const seen=new Set();return value.filter(n=>{const c=clips[n?.clipIndex];if(!Number.isInteger(n?.clipIndex)||!c||n.clipId!==c.id||n.slide!==c.slide+1||typeof n.id!=='string'||seen.has(n.id)||!['comment','request'].includes(n.kind)||typeof n.instruction!=='string'||!n.instruction.trim()||typeof n.quote!=='string'||typeof n.contextText!=='string'||typeof n.updatedAt!=='string'||!Number.isFinite(Date.parse(n.updatedAt)))return false;seen.add(n.id);return !n.quote||(n.anchor&&n.anchor.quote===n.quote&&!!locate(n,n.contextText));}).map(n=>({id:n.id,clipIndex:n.clipIndex,clipId:n.clipId,slide:n.slide,kind:n.kind,instruction:n.instruction,quote:n.quote,contextText:n.contextText,anchor:n.anchor,updatedAt:n.updatedAt}));}
 function locate(note,text){if(!note.quote)return text===note.contextText?{start:0,end:0}:null;const found=anchors.resolveAnchor(text,note.anchor);if(!found||text===note.contextText)return found;
  const prefix=(note.anchor.prefix||'').slice(-12),suffix=(note.anchor.suffix||'').slice(0,12);
  return (prefix&&text.slice(Math.max(0,found.start-prefix.length),found.start)===prefix)||(suffix&&text.slice(found.end,found.end+suffix.length)===suffix)?found:null;
 }
 function prompt(note,chinese){return `请协助修改研究Ⅱ第${note.slide}页日语讲稿。只提出修改建议，不自动覆盖原稿。保留研究事实、数字、限定与中日信息对应，使用简单日语。\n\n日语上下文：\n${note.contextText}\n\n修改对象：\n${note.quote||'整段'}\n\n中文对照：\n${chinese}\n\n作者要求：\n${note.instruction}\n\n请给出建议日语与中文说明；若涉及内容变化，也给出对应中文修改。`;}
 const api={selection,remove,make,sanitize,locate,prompt};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.ScriptFeedback=api;
})(typeof window==='undefined'?globalThis:window);
