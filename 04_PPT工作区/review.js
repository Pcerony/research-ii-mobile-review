(() => {
  'use strict';
  const source=window.REVIEW_DATA,core=window.ReviewCore;
  const supplemental=new URLSearchParams(location.search).get('scope')==='supplement';
  const data=source&&{...source,clips:supplemental?source.appendixClips:source.clips,duration:supplemental?source.appendixDuration:source.duration,speechHash:supplemental?source.appendixSpeechHash:source.speechHash};
  const $=id=>document.getElementById(id);
  if(!data||!core){$('status').textContent='审查数据缺失，请重新生成。';return;}
  document.querySelectorAll('[data-review-scope]').forEach(link=>link.setAttribute('aria-current',link.dataset.reviewScope===(supplemental?'supplement':'main')?'page':'false'));
  const clips=data.clips,audio=$('narration'),frame=$('deck-frame');
  const storageKey=`researchII.review.${data.speechHash}.${data.deckHash}`;
  const draftKey=storageKey+'.drafts';
  let index=0,wantPlay=false,loading=true,complete=false,frameReady=false,language='zh',token=0,seeking=false;
  let notes=[],noteContext=null,storageAvailable=true;
  let drafts={},draftStorageAvailable=true,editing=false,pendingSelection=null,editingNoteId=null;
  const draftDirty=new Set(),draftBases=new Map();let draftConflict=false;
  let slideReview=null,slideStateOverride=null,restoredPending=null;
  const clock=seconds=>`${String(Math.floor(Math.max(0,seconds)/60)).padStart(2,'0')}:${String(Math.floor(Math.max(0,seconds)%60)).padStart(2,'0')}`;
  const globalTime=()=>core.elapsedBefore(clips,index)+(Number.isFinite(audio.currentTime)?audio.currentTime:0);
  try{const saved=JSON.parse(localStorage.getItem(storageKey)||'[]');notes=Array.isArray(saved)?saved.filter(n=>n&&typeof n.text==='string'&&Number.isInteger(n.clipIndex)&&n.clipIndex>=0&&n.clipIndex<clips.length):[];}catch{storageAvailable=false;}
  try{
    const saved=JSON.parse(localStorage.getItem(draftKey)||'{}');
    if(saved&&typeof saved==='object')for(const [key,value]of Object.entries(saved)){
      if(/^\d+$/.test(key)&&Number(key)<clips.length&&typeof value?.text==='string')drafts[key]={text:value.text,updatedAt:value.updatedAt};
    }
  }catch{draftStorageAvailable=false;}
  document.querySelector('.review-meta').textContent=`中文讲稿 · 第${data.speechVersion}稿`;
  const draftText=i=>Object.hasOwn(drafts,i)?drafts[i].text:clips[i].text;
  function renderDraftStatus(){
    const count=Object.keys(drafts).length;
    $('draft-status').textContent=draftConflict?'另一窗口草稿冲突，未覆盖，请导出':draftStorageAvailable?(count?`已存本机 · ${count}段已修改`:'原稿'):'本机保存不可用，请导出';
    clips.forEach((clip,i)=>{
      const row=document.querySelector(`.clip-row[data-clip="${i}"]`);
      let badge=row?.querySelector('[data-draft-badge]');
      if(Object.hasOwn(drafts,i)){
        if(!badge){badge=document.createElement('span');badge.className='draft-badge';badge.dataset.draftBadge=i;row.append(badge);}
        badge.textContent='已修改 · 音频为原稿';
      }else badge?.remove();
    });
  }
  function persistDrafts(){
    try{const result=window.ScriptEditorCore.mergeWrite(localStorage,draftKey,clips,drafts,draftDirty,draftBases);draftConflict=!result.ok;if(result.ok)drafts=result.drafts;draftStorageAvailable=true;}catch{draftStorageAvailable=false;}
    renderDraftStatus();
  }
  function markDraft(i){if(!draftDirty.has(i))draftBases.set(i,draftText(i));draftDirty.add(i);}
  window.addEventListener('storage',event=>{
    if(event.key!==draftKey)return;
    try{
      const latest=window.ScriptEditorCore.sanitizeDrafts(JSON.parse(event.newValue||'{}'),clips),active=document.activeElement;
      if(active?.matches('.clip-edit')){const i=Number(active.dataset.editor);if(window.ScriptEditorCore.draftText(clips,latest,i)!==draftText(i)){markDraft(i);draftConflict=true;}}
      for(const i of draftDirty){if(Object.hasOwn(drafts,i))latest[i]=drafts[i];else delete latest[i];}drafts=latest;
      document.querySelectorAll('.clip-edit').forEach((input,i)=>{if(input!==active)input.value=draftText(i);});
      renderDraftStatus();if(!editing)renderAnnotations();
    }catch{draftStorageAvailable=false;renderDraftStatus();}
  });
  function renderAnnotations(){
    if(editing)return;
    document.querySelectorAll('[data-editor]').forEach(el=>{
      const i=Number(el.dataset.editor),text=draftText(i);
      const ranges=notes.filter(n=>n.clipIndex===i&&n.anchor).map(note=>({note,range:core.resolveAnchor(text,note.anchor)})).filter(x=>x.range);
      const cuts=[...new Set([0,text.length,...ranges.flatMap(x=>[x.range.start,x.range.end])])].sort((a,b)=>a-b);
      el.replaceChildren();
      for(let k=1;k<cuts.length;k++){
        const start=cuts[k-1],end=cuts[k],cover=ranges.filter(x=>x.range.start<=start&&x.range.end>=end);
        if(!cover.length){el.append(document.createTextNode(text.slice(start,end)));continue;}
        const mark=document.createElement('mark');mark.textContent=text.slice(start,end);mark.tabIndex=0;mark.role='button';
        mark.title=cover.map(x=>x.note.text).join('\n');mark.setAttribute('aria-label',`批注：${cover[0].note.text}`);
        mark.onclick=()=>openNote(cover[0].note);
        mark.onkeydown=e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();openNote(cover[0].note);}};
        el.append(mark);
      }
    });
  }
  function setEditing(on){
    if(on)pause();editing=on;pendingSelection=null;$('annotate-selection').disabled=true;
    $('edit-script').setAttribute('aria-pressed',String(on));$('edit-script').textContent=on?'完成编辑':'编辑讲稿';
    document.querySelectorAll('.clip-row').forEach((row,i)=>{
      const display=row.querySelector('.clip-text'),input=row.querySelector('.clip-edit');
      display.hidden=on;input.hidden=!on;delete display.dataset.editor;delete input.dataset.editor;
      if(on){input.dataset.editor=i;input.value=draftText(i);input.style.height='auto';input.style.height=input.scrollHeight+'px';}
      else display.dataset.editor=i;
    });
    if(!on){renderAnnotations();renderNotes();}
  }
  function contextAt(i){return i===index?captureContext():{clipIndex:i,clipId:clips[i].id,slide:clips[i].slide+1,offset:0,time:core.elapsedBefore(clips,i)};}
  function showNoteForm(context,note=null){
    const currentText=$('note-text').value.trim(),saved=notes.find(n=>n.id===editingNoteId);
    if(currentText&&(!saved||$('note-text').value!==saved.text)){
      selectTab('notes');window.dispatchEvent(new Event('review-open-form'));$('note-text').focus();$('storage-status').textContent='当前意见尚未保存，请先保存或取消';return false;
    }
    pause();noteContext=context;editingNoteId=note?.id||null;
    const anchor=context.anchor||context.target?.anchor;
    $('note-context').textContent=contextLabel(context);$('note-quote').hidden=!anchor;
    $('note-quote').textContent=anchor?.quote||'';$('note-text').value=note?.text||'';
    $('save-note').disabled=!$('note-text').value.trim();selectTab('notes');window.dispatchEvent(new Event('review-open-form'));$('note-text').focus();
    savePending();
    return true;
  }
  function jumpNote(note){
    if(note.target&&core.validSlideTarget(note.target)){
      language=note.target.language;
      document.querySelectorAll('[data-deck-language]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.deckLanguage===language)));
      loadClip(note.clipIndex,note.offset,false);slideStateOverride=note.target.state;send();slideReview?.showTarget(note.target);
    }else loadClip(note.clipIndex,note.offset,false);
  }
  function openNote(note){if(showNoteForm({...note},note))jumpNote(note);}
  function downloadFile(text,type,filename){
    const url=URL.createObjectURL(new Blob([text],{type})),link=document.createElement('a');
    link.href=url;link.download=filename;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function send(){
    if(!frameReady)return;
    const workflow=slideStateOverride?.workflow==null?clips[index].workflowStep:Number(slideStateOverride.workflow),heatmap=slideStateOverride?.heatmap?Number(slideStateOverride.heatmap.slice(1))-1:core.heatmapAt(clips[index].slide,audio.currentTime,clips[index].duration,data.heatmapSlide);
    frame.contentWindow.postMessage({type:'review-cue',slide:clips[index].slide,language,workflow,heatmap},'*');
  }
  function render(){
    $('play').disabled=!frameReady;
    $('play').textContent=wantPlay?'Ⅱ':'▶';
    $('play').title=wantPlay?'暂停':'播放';$('play').setAttribute('aria-label',$('play').title);
    $('status').textContent=complete?'播放完成':loading?'载入音频…':wantPlay?'正在播放':'已暂停';
    $('position').textContent=`第${String(clips[index].slide+1).padStart(2,'0')}页 · 第${String(index+1).padStart(2,'0')}段 / ${clips.length}`;
    $('elapsed').textContent=clock(globalTime());
    if(!seeking)$('seek').value=globalTime();
    $('previous').disabled=index===0;$('next-clip').disabled=index===clips.length-1;
    document.querySelectorAll('.clip-row').forEach((node,i)=>{node.classList.toggle('active',i===index);node.setAttribute('aria-current',i===index?'true':'false');});
  }
  function failure(message){wantPlay=false;loading=false;audio.pause();render();$('status').textContent=message;}
  async function startAudio(){
    try{await audio.play();if(!wantPlay)audio.pause();render();}catch(error){if(error.name!=='AbortError')failure('播放未开始，请再次点击播放。');}
  }
  function loadClip(next,offset=0,play=wantPlay){
    if(!Number.isInteger(next)||next<0||next>=clips.length)return;
    slideReview?.reset();slideStateOverride=null;
    const ticket=++token;
    audio.pause();index=next;wantPlay=play;complete=false;loading=true;
    audio.onloadedmetadata=()=>{
      if(ticket!==token)return;
      audio.currentTime=Math.max(0,Math.min(offset,audio.duration));
      audio.playbackRate=Number($('rate').value);loading=false;send();render();
      if(wantPlay)startAudio();
    };
    audio.src=clips[index].audio;audio.load();send();render();
    const row=document.querySelectorAll('.clip-row')[index];
    if(row&&$('transcript-tab').getAttribute('aria-selected')==='true')row.scrollIntoView({block:'nearest'});
  }
  function pause(){wantPlay=false;audio.pause();render();}
  function toggle(){
    if(wantPlay){pause();return;}
    slideReview?.reset();slideStateOverride=null;send();
    if(complete){loadClip(0,0,true);return;}
    wantPlay=true;render();if(!loading)startAudio();
  }
  function selectTab(name){
    for(const panel of ['transcript','notes']){
      $(panel+'-panel').hidden=panel!==name;
      $(panel+'-tab').setAttribute('aria-selected',String(panel===name));
    }
  }
  function captureContext(){return {clipIndex:index,clipId:clips[index].id,slide:clips[index].slide+1,offset:audio.currentTime||0,time:globalTime()};}
  function contextLabel(n){const type={'slide-text':'选文','slide-region':'区域','slide-page':'整页'}[n.target?.type];return `${type?'Slide · '+type+' · ':''}第${String(n.slide).padStart(2,'0')}页 · ${clock(n.time)} · 第${n.clipIndex+1}段`;}
  function persistNotes(){
    try{localStorage.setItem(storageKey,JSON.stringify(notes));storageAvailable=true;}catch{storageAvailable=false;}
    $('storage-status').textContent=storageAvailable?'已存本机':'本机保存不可用，请导出';
  }
  function renderNotes(){
    $('notes-count').textContent=notes.length;
    $('notes-list').replaceChildren();
    if(!notes.length){const el=document.createElement('p');el.className='empty-note';el.textContent='暂无意见';$('notes-list').append(el);}
    for(const note of notes){
      const entry=document.createElement('article');entry.className='note-entry';
      const header=document.createElement('header');
      const jump=document.createElement('button');jump.type='button';jump.className='note-location';jump.textContent=contextLabel(note);jump.title='回到这一处';jump.onclick=()=>openNote(note);
      const remove=document.createElement('button');remove.className='delete-note';remove.title='删除这条意见';remove.setAttribute('aria-label','删除这条意见');remove.textContent='×';remove.onclick=()=>{
        slideReview?.reset();
        notes=notes.filter(n=>n.id!==note.id);
        if(editingNoteId===note.id){editingNoteId=null;noteContext=null;$('note-text').value='';$('save-note').disabled=true;$('note-quote').hidden=true;try{localStorage.removeItem(storageKey+'.pending');}catch{}}
        persistNotes();renderNotes();
      };
      const edit=document.createElement('button');edit.className='edit-note';edit.textContent='编辑';edit.title='编辑这条意见';edit.onclick=()=>openNote(note);
      const actions=document.createElement('div');actions.className='note-actions';actions.append(edit,remove);
      const body=document.createElement('p');body.textContent=note.text;header.append(jump,actions);entry.append(header);
      const noteAnchor=note.anchor||note.target?.anchor;
      if(noteAnchor){
        const quote=document.createElement('blockquote');quote.textContent=noteAnchor.quote;entry.append(quote);
        if(note.anchor&&!core.resolveAnchor(draftText(note.clipIndex),note.anchor)){
          const status=document.createElement('small');status.className='note-anchor-status';status.textContent='原文已变更，保留原选文';entry.append(status);
        }
      }
      entry.append(body);$('notes-list').append(entry);
    }
    renderAnnotations();
  }
  clips.forEach((clip,i)=>{
    const row=document.createElement('article');row.className='clip-row';row.dataset.clip=i;
    const label=document.createElement('button');label.type='button';label.className='clip-location';label.textContent=`${String(i+1).padStart(2,'0')} · 第${clip.slide+1}页 · ${clip.heading}`;label.title='定位这一段';
    const text=document.createElement('div');text.className='clip-text';text.dataset.editor=i;text.textContent=draftText(i);text.setAttribute('aria-label',`第${i+1}段讲稿`);
    const input=document.createElement('textarea');input.className='clip-edit';input.hidden=true;input.setAttribute('aria-label',`第${i+1}段讲稿`);input.spellcheck=false;
    input.oninput=()=>{
      if(!editing)return;
      const value=input.value;
      markDraft(i);
      if(value===clip.text)delete drafts[i];else drafts[i]={text:value,updatedAt:new Date().toISOString()};
      persistDrafts();input.style.height='auto';input.style.height=input.scrollHeight+'px';
    };
    row.append(label,text,input);row.onclick=e=>{if(!e.target.closest('.clip-text,.clip-edit'))loadClip(i,0,wantPlay);};$('clip-list').append(row);
  });
  $('edit-script').onclick=()=>setEditing(!editing);
  document.addEventListener('selectionchange',()=>{
    pendingSelection=null;$('annotate-selection').disabled=true;
    const input=document.activeElement;
    if(editing&&input.matches('.clip-edit')){
      const {selectionStart:start,selectionEnd:end,value:text}=input;
      if(start<end&&text.slice(start,end).trim()){
        pendingSelection={...contextAt(Number(input.dataset.editor)),anchor:core.createAnchor(text,start,end)};
        $('annotate-selection').disabled=false;
      }
      return;
    }
    const selection=getSelection();
    if(!selection?.rangeCount||selection.isCollapsed)return;
    const range=selection.getRangeAt(0),node=range.startContainer.nodeType===Node.TEXT_NODE?range.startContainer.parentElement:range.startContainer;
    const el=node.closest?.('[data-editor]');
    if(!el||!el.contains(range.endContainer))return;
    const prefix=range.cloneRange();prefix.selectNodeContents(el);prefix.setEnd(range.startContainer,range.startOffset);
    const start=prefix.toString().length,end=start+range.toString().length,text=el.textContent;
    if(start===end||end>text.length||!text.slice(start,end).trim())return;
    pendingSelection={...contextAt(Number(el.dataset.editor)),anchor:core.createAnchor(text,start,end)};
    $('annotate-selection').disabled=false;
  });
  $('annotate-selection').onpointerdown=e=>e.preventDefault();
  $('annotate-selection').onclick=()=>{if(!pendingSelection)return;const context=pendingSelection;if(editing)setEditing(false);showNoteForm(context);};
  $('export-script').onclick=()=>{
    const blocks=clips.map((clip,i)=>`## ${String(clip.slide+1).padStart(2,'0')}｜审查修订稿｜${clip.heading}\n\n${draftText(i)}`);
    downloadFile(`# 研究Ⅱ・中文${supplemental?'补充':'讲稿'}审查修订稿\n\n本机草稿；配套音频仍为原稿。来源版本：${data.speechVersion}，讲稿哈希：${data.speechHash}。\n\n${blocks.join('\n\n')}\n`,'text/markdown;charset=utf-8',`研究Ⅱ_${supplemental?'补充':'讲稿'}_审查修订稿.md`);
  };
  $('transcript-tab').onclick=()=>selectTab('transcript');
  $('notes-tab').onclick=()=>{selectTab('notes');if(!noteContext){noteContext=captureContext();$('note-context').textContent=contextLabel(noteContext);}};
  $('add-note').onclick=()=>showNoteForm(captureContext());
  $('cancel-note').onclick=()=>{slideReview?.reset();editingNoteId=null;noteContext=null;$('note-text').value='';$('save-note').disabled=true;$('note-quote').hidden=true;selectTab('transcript');};
  function savePending(){
    try{localStorage.setItem(storageKey+'.pending',JSON.stringify({context:noteContext,id:editingNoteId,text:$('note-text').value}));}catch{$('storage-status').textContent='未提交意见无法暂存，请导出';}
  }
  $('note-text').oninput=()=>{$('save-note').disabled=!$('note-text').value.trim();savePending();};
  $('cancel-note').addEventListener('click',()=>{try{localStorage.removeItem(storageKey+'.pending');}catch{}});
  $('note-form').onsubmit=event=>{
    event.preventDefault();const text=$('note-text').value.trim();if(!text)return;
    if(editingNoteId){notes=notes.map(n=>n.id===editingNoteId?{...n,text,updatedAt:new Date().toISOString()}:n);}
    else notes.push({...noteContext||captureContext(),id:crypto.randomUUID(),text,createdAt:new Date().toISOString()});
    persistNotes();renderNotes();editingNoteId=null;$('note-text').value='';$('save-note').disabled=true;$('note-quote').hidden=true;noteContext=captureContext();$('note-context').textContent=contextLabel(noteContext);
    try{localStorage.removeItem(storageKey+'.pending');}catch{}
  };
  function exportPayload(){
    const edits=Object.entries(drafts).map(([i,draft])=>({clipIndex:Number(i),clipId:clips[i].id,slide:clips[i].slide+1,originalText:clips[i].text,...draft}));
    const pending=$('note-text').value.trim()?{...noteContext||captureContext(),id:editingNoteId,text:$('note-text').value}:null;
    return {version:2,scope:supplemental?'supplement':'main',speechVersion:data.speechVersion,language:'zh-CN',speechHash:data.speechHash,deckHash:data.deckHash,audioVoice:data.voice,audioMatchesDraft:edits.length===0,edits,notes,pending};
  }
  $('export-notes').onclick=()=>downloadFile(JSON.stringify(exportPayload(),null,2),'application/json','研究Ⅱ_模拟审查意见.json');
  window.addEventListener('review-share',async()=>{
    const file=new File([JSON.stringify(exportPayload(),null,2)],'研究Ⅱ_模拟审查意见.json',{type:'application/json'});
    try{if(navigator.canShare?.({files:[file]}))await navigator.share({files:[file],title:'研究Ⅱ审查意见'});else $('export-notes').click();}
    catch(error){if(error.name!=='AbortError'){$('storage-status').textContent='分享失败，改为下载';$('export-notes').click();}}
  });
  window.addEventListener('review-import',async event=>{
    try{
      if(event.detail.size>5*1024*1024)throw Error('文件过大');
      const incoming=JSON.parse(await event.detail.text());
      if(incoming.deckHash!==data.deckHash||incoming.speechHash!==data.speechHash||incoming.scope!==(supplemental?'supplement':'main'))throw Error('版本或范围不符，未导入');
      if(!Array.isArray(incoming.notes)||!Array.isArray(incoming.edits))throw Error('文件格式不符');
      for(const n of incoming.notes)if(typeof n.id!=='string'||typeof n.text!=='string'||!Number.isInteger(n.clipIndex)||!clips[n.clipIndex]||n.slide!==clips[n.clipIndex].slide+1||(n.target&&(!core.validSlideTarget(n.target)||n.target.slideIndex!==clips[n.clipIndex].slide)))throw Error('意见定位无效');
      for(const e of incoming.edits)if(!Number.isInteger(e.clipIndex)||!clips[e.clipIndex]||typeof e.text!=='string'||e.originalText!==clips[e.clipIndex].text)throw Error('讲稿修改无效');
      const merged=new Map(notes.map(n=>[n.id,n]));let conflicts=0;
      for(const n of incoming.notes){const old=merged.get(n.id);if(old&&old.text!==n.text){merged.set(crypto.randomUUID(),{...n,id:crypto.randomUUID()});conflicts++;}else merged.set(n.id,n);}
      for(const e of incoming.edits){if(drafts[e.clipIndex]&&drafts[e.clipIndex].text!==e.text)throw Error('讲稿草稿有冲突，请先导出本机副本');}
      notes=[...merged.values()];for(const e of incoming.edits){markDraft(e.clipIndex);drafts[e.clipIndex]={text:e.text,updatedAt:e.updatedAt};}
      persistNotes();persistDrafts();setEditing(editing);renderNotes();
      $('storage-status').textContent=`已合并 ${incoming.notes.length} 条意见${conflicts?'，冲突保留双份':''}`;
      if(incoming.pending?.text&&typeof incoming.pending.text==='string'&&clips[incoming.pending.clipIndex]&&!$('note-text').value.trim())showNoteForm(incoming.pending,{text:incoming.pending.text});
    }catch(error){$('storage-status').textContent=error.message==='Unexpected end of JSON input'?'文件无效':`导入失败：${error.message}`;}
  });
  try{
    const pending=JSON.parse(localStorage.getItem(storageKey+'.pending')||'null');
    if(pending?.text&&pending.context&&clips[pending.context.clipIndex]){
      restoredPending=pending.context;
      const saved=pending.id?notes.find(n=>n.id===pending.id):null;
      showNoteForm(pending.context,{...saved,text:pending.text});
      if(['ja','zh'].includes(pending.context.target?.language))language=pending.context.target.language;
      document.querySelectorAll('[data-deck-language]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.deckLanguage===language)));
      requestAnimationFrame(()=>window.dispatchEvent(new Event('review-restore-pending')));
    }
  }catch{}
  $('play').onclick=toggle;$('previous').onclick=()=>loadClip(index-1);$('next-clip').onclick=()=>loadClip(index+1);$('replay').onclick=()=>loadClip(index,0,true);
  $('rate').onchange=()=>{audio.playbackRate=Number($('rate').value);};
  $('seek').max=data.duration;$('duration').textContent=clock(data.duration);
  $('seek').oninput=()=>{seeking=true;$('elapsed').textContent=clock(Number($('seek').value));};
  $('seek').onchange=()=>{const point=core.locateTime(clips,Number($('seek').value));seeking=false;loadClip(point.index,point.offset);};
  audio.ontimeupdate=()=>{render();send();};audio.onplay=render;audio.onpause=render;
  audio.onerror=()=>failure(`音频加载失败：第${index+1}段`);
  audio.onended=()=>{if(!wantPlay)return;if(index+1<clips.length)loadClip(index+1,0,true);else{wantPlay=false;complete=true;render();}};
  document.querySelectorAll('[data-deck-language]').forEach(button=>button.onclick=()=>{slideReview?.reset();slideStateOverride=null;language=button.dataset.deckLanguage;document.querySelectorAll('[data-deck-language]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));send();});
  $('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{$('status').textContent='当前窗口不支持全屏';}};
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!event.target.closest('textarea,input,select,[contenteditable]')){if(frame.contentWindow.__slideReviewCancel?.()){event.preventDefault();return;}event.preventDefault();pause();frame.contentWindow.__toggleOverview?.();return;}if(event.code==='Space'&&!event.target.closest('textarea,input,select,button,[contenteditable="plaintext-only"],[contenteditable="true"],[role="textbox"]')){event.preventDefault();toggle();}});
  window.addEventListener('message',event=>{
    if(event.source!==frame.contentWindow)return;
    if(event.data?.type==='review-ready'){frameReady=true;$('loading-frame').hidden=true;send();render();if(restoredPending?.target){slideReview?.showTarget(restoredPending.target);restoredPending=null;}}
    if(event.data?.type==='review-toggle')toggle();
    if(event.data?.type==='review-menu')pause();
    if(event.data?.type==='review-seek-slide'){const i=clips.findIndex(c=>c.slide===event.data.slide);if(i>=0)loadClip(i,0,false);}
    if(event.data?.type==='review-language'&&['ja','zh'].includes(event.data.language))document.querySelector('[data-deck-language="'+event.data.language+'"]').click();
  });
  const base=new URL('.',location.href).href;
  slideReview=window.createSlideReview({frame,core,getContext:captureContext,getLanguage:()=>language,pause,openForm:showNoteForm,setStatus:text=>$('slide-review-status').textContent=text});
  // The audio controls own page navigation; in-slide tabs remain interactive.
  const navigationGuard=`<script>addEventListener('keydown',e=>{if(e.key==='Escape'&&window.__slideReviewCancel?.()){e.preventDefault();e.stopImmediatePropagation();return;}if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();parent.postMessage({type:'review-menu'},'*');window.__toggleOverview?.();return;}if(e.target.closest('[data-workflow-step],[data-cocreation-step]'))return;if(['ArrowRight','ArrowLeft','PageUp','PageDown','Home','End','Escape'].includes(e.key)){e.preventDefault();e.stopImmediatePropagation();}},true);addEventListener('wheel',e=>{e.preventDefault();e.stopImmediatePropagation();},{capture:true,passive:false});addEventListener('touchend',e=>e.stopImmediatePropagation(),true);<\/script>`;
  const bridge=`<script>(()=>{let lastSlide=-1,lastLanguage='',lastHeatmap=-1,lastWorkflow=-1;addEventListener('message',e=>{if(e.source!==parent||e.data?.type!=='review-cue')return;const d=e.data;if(['ja','zh'].includes(d.language)&&lastLanguage!==d.language){document.querySelector('button[data-language="'+d.language+'"]').click();lastLanguage=d.language;}if(Number.isInteger(d.slide)&&d.slide>=0&&d.slide<${data.slideCount}&&lastSlide!==d.slide){window.__goSlide(d.slide);lastSlide=d.slide;}if(Number.isInteger(d.heatmap)&&d.heatmap>=0&&d.heatmap<9&&lastHeatmap!==d.heatmap){document.querySelector('#deck [data-heatmap-pick="'+d.heatmap+'"]').click();lastHeatmap=d.heatmap;}const w=Number.isInteger(d.workflow)&&d.workflow>=0&&d.workflow<4?d.workflow:-1;if(w>=0&&lastWorkflow!==w)document.querySelector('#deck [data-workflow-step="'+w+'"]').click();lastWorkflow=w;});addEventListener('click',e=>{if(!e.isTrusted)return;const card=e.target.closest('#overview .overview-card'),lang=e.target.closest('#overview [data-language]');if(card){e.preventDefault();e.stopImmediatePropagation();document.querySelector('#overview').close();parent.postMessage({type:'review-seek-slide',slide:Number(card.dataset.slideIndex)},'*');return;}if(lang){e.preventDefault();e.stopImmediatePropagation();parent.postMessage({type:'review-language',language:lang.dataset.language},'*');return;}if(e.target.closest('#overview-toggle'))parent.postMessage({type:'review-menu'},'*');if(!e.target.closest('[data-heatmap-pick],[data-workflow-step],[data-cocreation-step],[data-cocreation-intro],[data-gaze-toggle],#overview-toggle,#overview-close')){e.preventDefault();e.stopImmediatePropagation();}},true);addEventListener('keydown',e=>{if(e.code==='Space'&&!e.target.closest('[data-workflow-step],[data-cocreation-step],#overview')){e.preventDefault();e.stopImmediatePropagation();parent.postMessage({type:'review-toggle'},'*');}},true);parent.postMessage({type:'review-ready'},'*');})();<\/script>`;
  frame.srcdoc=data.deckHtml.replace('<head>',`<head><base href="${base}">`).replace('</head>','<style>#deck,.slide,.slide-shell{transition:none!important}</style></head>').replace('</body>',navigationGuard+bridge+'</body>');
  renderNotes();renderDraftStatus();if(!storageAvailable)$('storage-status').textContent='本机保存不可用，请导出';loadClip(restoredPending?.clipIndex||0,restoredPending?.offset||0,false);
})();
