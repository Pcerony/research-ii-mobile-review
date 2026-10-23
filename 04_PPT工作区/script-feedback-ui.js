(()=>{
 'use strict';
 const $=id=>document.getElementById(id),core=window.ScriptEditorCore,feedback=window.ScriptFeedback;
 function create(options){
  const {data,scope,getLanguage,getState,getPage,message}=options,local=new Map();let selected=null,editing=null,context=null,activeIndex=0;
  const buttons=document.createElement('div');buttons.className='script-selection-tools';buttons.innerHTML='<button id="script-delete-selection" class="icon" title="删除选中文字（可撤回）" aria-label="删除选中文字（可撤回）" disabled><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18M19 6v14H5V6M9 6V3h6v3M10 10v7M14 10v7"/></svg></button><button id="script-add-feedback" class="icon" title="批注或请求AI修改" aria-label="批注或请求AI修改"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a4 4 0 0 1-4 4H7l-4 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4zM8 8h8M8 12h6"/></svg></button>';
  document.querySelector('.script-reading-toggle').before(buttons);
  const list=document.createElement('details');list.className='script-feedback-list';list.id='script-feedback-list';const summary=document.createElement('summary'),items=document.createElement('div');list.append(summary,items);$('script-fields').after(list);
  const dialog=document.createElement('dialog');dialog.id='script-feedback-dialog';dialog.innerHTML='<form method="dialog"><h2>讲稿批注</h2><blockquote id="script-feedback-quote"></blockquote><label for="script-feedback-kind">类型</label><select id="script-feedback-kind"><option value="comment">批注</option><option value="request">请求AI修改</option></select><label for="script-feedback-text">中文意见或修改要求</label><textarea id="script-feedback-text" placeholder="例如：这句太难读，请改成简单日语，保留原意。" required></textarea><div class="script-feedback-actions"><button value="cancel" formnovalidate>取消</button><button id="script-feedback-save" value="save">保存</button></div></form>';
  document.body.append(dialog);
  const key=()=>core.storageKey(data,getLanguage(),scope)+'.feedback';
  function load(){const k=key();if(!local.has(k)){try{local.set(k,feedback.sanitize(JSON.parse(localStorage.getItem(k)||'[]'),getState().edition.clips));}catch{local.set(k,[]);message('批注本机存储不可用，请及时导出',true);}}return local.get(k);}
  function write(change){const k=key();let notes=load();try{notes=feedback.sanitize(JSON.parse(localStorage.getItem(k)||'[]'),getState().edition.clips);}catch{}
   const next=change(notes);local.set(k,next);try{localStorage.setItem(k,JSON.stringify(next));return true;}catch{message('批注未存本机，请导出保留',true);return false;}
  }
  function textAt(i){const s=getState();return core.draftText(s.edition.clips,s.drafts,i);}
  function action(){if(parent!==window)parent.postMessage({type:'script-review-action'},location.protocol==='file:'||location.origin==='null'?'*':location.origin);}
  function plain(fragment){const node=fragment.cloneNode(true);node.querySelectorAll('rt,rp').forEach(n=>n.remove());return node.textContent;}
  function capture(){
   const input=document.activeElement;let next=null;
   if(input?.matches('.script-input')&&input.selectionEnd>input.selectionStart){const i=Number(input.dataset.clipIndex);next={index:i,selection:feedback.selection(input.value,input.selectionStart,input.selectionEnd)};}
   else{const sel=getSelection();if(sel?.rangeCount&&!sel.isCollapsed){const range=sel.getRangeAt(0),element=range.commonAncestorContainer.nodeType===1?range.commonAncestorContainer:range.commonAncestorContainer.parentElement,guide=element.closest?.('.script-reading');
    const inReading=node=>(node.nodeType===1?node:node.parentElement)?.closest('rt,rp');
    if(guide&&!inReading(range.startContainer)&&!inReading(range.endContainer)&&guide.contains(range.startContainer)&&guide.contains(range.endContainer)){const prefix=range.cloneRange();prefix.selectNodeContents(guide);prefix.setEnd(range.startContainer,range.startOffset);const start=plain(prefix.cloneContents()).length,quote=plain(range.cloneContents()),i=Number(guide.previousElementSibling.dataset.clipIndex);if(quote&&textAt(i).slice(start,start+quote.length)===quote)next={index:i,selection:feedback.selection(textAt(i),start,start+quote.length)};}
   }}
   selected=next;$('script-delete-selection').disabled=!selected||getState().conflict;
  }
  document.addEventListener('selectionchange',capture);$('script-fields').addEventListener('select',capture,true);$('script-fields').addEventListener('keyup',capture);$('script-fields').addEventListener('pointerup',capture);
  $('script-fields').addEventListener('focusin',e=>{const input=e.target.closest('.script-input,.script-reading');if(input)activeIndex=Number((input.matches('.script-input')?input:input.previousElementSibling).dataset.clipIndex);});
  buttons.querySelectorAll('button').forEach(b=>b.onpointerdown=e=>e.preventDefault());
  $('script-delete-selection').onclick=()=>{if(!selected)return;try{const {index,selection}=selected,result=feedback.remove(textAt(index),selection);if(getState().conflict)throw Error('草稿有冲突，请先导出');action();options.commit(index,result.text,selection.start,selection.end);}catch(e){message(e.message,true);}};
  function open(note=null){
   const index=note?.clipIndex??selected?.index??(getPage().indices.includes(activeIndex)?activeIndex:getPage().indices[0]);
   const text=textAt(index);editing=note;context={index,text,selection:note?(feedback.locate(note,text)?{...feedback.locate(note,text),quote:note.quote}:null):selected?.selection||null,key:key()};
   if(note&&note.quote&&!context.selection){message('批注原文已经变化，保留旧批注，请重新选文后新增',true);return;}
   $('script-feedback-quote').textContent=context.selection?.quote||text||'（空段落）';$('script-feedback-kind').value=note?.kind||'comment';$('script-feedback-text').value=note?.instruction||'';dialog.returnValue='';action();dialog.showModal();$('script-feedback-text').focus();
  }
  $('script-add-feedback').onclick=()=>open();
  dialog.addEventListener('close',()=>{if(dialog.returnValue!=='save')return;try{
   if(context.key!==key()||textAt(context.index)!==context.text)throw Error('原文或页面已经变化，请重新批注');
   const note=feedback.make(getState().edition.clips,context.index,context.text,context.selection,$('script-feedback-kind').value,$('script-feedback-text').value);
   if(editing){note.id=editing.id;const latest=load().find(n=>n.id===editing.id);if(latest&&latest.updatedAt!==editing.updatedAt)throw Error('另一窗口修改了此批注，请重新打开');}
   write(notes=>{if(editing){const latest=notes.find(n=>n.id===editing.id);if(!latest||latest.updatedAt!==editing.updatedAt)throw Error('批注已在另一窗口变化，请重新打开');}return [...notes.filter(n=>n.id!==note.id),note];});list.open=true;renderList();
  }catch(e){message(e.message,true);}});
  function renderList(){
   const notes=load().filter(n=>getPage().indices.includes(n.clipIndex));summary.textContent=`本页批注 ${notes.length}`;items.replaceChildren();
   for(const note of notes){const row=document.createElement('section');row.className='script-feedback-item';const label=document.createElement('strong');label.textContent=note.kind==='request'?'AI修改请求':'批注';const quote=document.createElement('blockquote');quote.textContent=note.quote||'整段';const content=document.createElement('p');content.textContent=note.instruction;const actions=document.createElement('div');
    const modify=document.createElement('button');modify.textContent='修改';modify.onclick=()=>open(note);const remove=document.createElement('button');remove.textContent='删除批注';remove.onclick=()=>{try{write(notes=>{const latest=notes.find(n=>n.id===note.id);if(!latest||latest.updatedAt!==note.updatedAt)throw Error('批注已在另一窗口变化，未删除，请重新打开');return notes.filter(n=>n.id!==note.id);});renderList();}catch(e){local.delete(key());renderList();message(e.message,true);}};
    const copy=document.createElement('button');copy.textContent='复制给AI';copy.onclick=async()=>{const chinese=data.languages.zh[scope].clips.filter(c=>c.slide===note.slide-1).map(c=>c.text).join('\n\n'),prompt=feedback.prompt(note,chinese);try{await navigator.clipboard.writeText(prompt);message('已复制日语原文、中文对照和修改要求');}catch{dialog.returnValue='';editing=null;context=null;$('script-feedback-quote').textContent='AI修改请求';$('script-feedback-text').value=prompt;$('script-feedback-save').hidden=true;dialog.showModal();$('script-feedback-text').select();message('无法直接复制，可选择请求文字复制');}};
    const stale=document.createElement('span');stale.textContent=feedback.locate(note,textAt(note.clipIndex))?'':'原文已变化，未自动重新定位';actions.append(modify,copy,remove);row.append(label,quote,content,stale,actions);items.append(row);
   }
  }
  dialog.addEventListener('close',()=>{$('script-feedback-save').hidden=false;});
  window.addEventListener('storage',e=>{if(e.key===key()){local.delete(e.key);renderList();}});
  return {refresh:renderList,render(){selected=null;$('script-delete-selection').disabled=true;renderList();},package(p){return {...p,feedbackVersion:1,feedback:load()};},markdown(p){return p.feedback?.length?'\n\n## 批注与AI修改请求\n\n'+p.feedback.map(n=>`### 第${n.slide}页 · ${n.kind==='request'?'AI修改请求':'批注'}\n\n引用：${n.quote||'整段'}\n\n${n.instruction}`).join('\n\n')+'\n':'';},validateImport(p){if(p.feedback!==undefined&&(p.feedbackVersion!==1||!Array.isArray(p.feedback)||feedback.sanitize(p.feedback,getState().edition.clips).length!==p.feedback.length))throw Error('批注数据无效，未导入');},import(p){if(p.feedback)write(notes=>{const map=new Map(notes.map(n=>[n.id,n]));for(const note of p.feedback){const existing=map.get(note.id);if(!existing||String(note.updatedAt)>String(existing.updatedAt))map.set(note.id,note);}return [...map.values()];});}};
 }
 window.ScriptFeedbackUI={create};
})();
