(() => {
  'use strict';
  const $=id=>document.getElementById(id),core=window.ScriptEditorCore,tools=window.ScriptEditorTools,data=window.SCRIPT_DATA,deck=window.REVIEW_DATA;
  const scope=new URLSearchParams(location.search).get('scope')==='supplement'?'supplement':'main',cache=new Map();
  const embedded=new URLSearchParams(location.search).get('layout')==='review'&&parent!==window;let embeddedReady=false;
  if(embedded){document.body.classList.add('is-embedded');document.querySelectorAll('[data-script-language]').forEach(b=>b.textContent=b.dataset.scriptLanguage==='ja'?'日本語':'中文');}
  let language='ja',pageIndex=0,ready=false,activeIndex=0,readingMode=false;
  const viewKey=`researchII.script.view.${data.deckHash}.${scope}`;
  // Lucide icon paths, vendored locally under assets/LICENSE.lucide.
  const paths={
    'undo-2':'<path d="M9 14 4 9l5-5"/><path d="M4 9h10a7 7 0 0 1 7 7v4"/>',
    'redo-2':'<path d="m15 14 5-5-5-5"/><path d="M20 9H10a7 7 0 0 0-7 7v4"/>',
    'arrow-left':'<path d="m12 19-7-7 7-7M5 12h14"/>','chevron-left':'<path d="m15 18-6-6 6-6"/>','chevron-right':'<path d="m9 18 6-6-6-6"/>',
    save:'<path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M17 21v-7H7v7M7 3v5h8"/>',
    download:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    upload:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
    share:'<path d="M12 16V3m-5 5 5-5 5 5M20 16.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-3.5"/>',
    'download-cloud':'<path d="M12 13v8m-4-4 4 4 4-4M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/>',
    'file-down':'<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7zM14 2v6h6M12 12v6m-3-3 3 3 3-3"/>'
  };
  document.querySelectorAll('[data-icon]').forEach(button=>{button.innerHTML=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[button.dataset.icon]}</svg>`;});
  function message(text,error=false){$('script-save-status').textContent=text;$('script-save-status').dataset.error=String(error);}
  function state(){
    const key=core.storageKey(data,language,scope);
    if(!cache.has(key)){
      const edition=core.edition(data,language,scope),s={key,edition,drafts:{},dirty:new Set(),bases:new Map(),histories:new Map(),available:true,conflict:false};
      try{s.drafts=core.sanitizeDrafts(JSON.parse(localStorage.getItem(key)||'{}'),edition.clips);}catch{s.available=false;}
      cache.set(key,s);
    }
    return cache.get(key);
  }
  function status(){const s=state(),n=Object.keys(s.drafts).length;message(s.conflict?'另一窗口草稿冲突，未覆盖，请导出':s.available?(n?`已存本机 · ${n}段修改`:'原稿 · 已存本机'):'本机保存不可用，请导出',!s.available||s.conflict);syncTools();}
  function history(s,i){if(!s.histories.has(i))s.histories.set(i,tools.history());return s.histories.get(i);}
  function syncTools(){const s=state(),h=history(s,activeIndex);$('script-undo').disabled=s.conflict||!h.past.length;$('script-redo').disabled=s.conflict||!h.future.length;$('script-readings').disabled=language!=='ja';$('script-readings').checked=language==='ja'&&readingMode;}
  function snapshot(input){return {text:input.value,start:input.selectionStart,end:input.selectionEnd};}
  function reading(target,text){target.replaceChildren();for(const token of tools.readings(text)){
    if(!token.reading){target.append(document.createTextNode(token.text));continue;}
    const ruby=document.createElement('ruby'),rt=document.createElement('rt');ruby.append(document.createTextNode(token.text));rt.textContent=token.reading;ruby.append(rt);target.append(ruby);
  }}
  function travel(direction){
    const s=state(),h=history(s,activeIndex);if(s.conflict)return;
    const step=direction==='undo'?h.past.at(-1):h.future.at(-1);if(!step)return;
    const expected=direction==='undo'?step.after.text:step.before.text;
    if(core.draftText(s.edition.clips,s.drafts,activeIndex)!==expected){s.histories.delete(activeIndex);syncTools();return;}
    const next=tools[direction](h);update(activeIndex,next.text,s);
    const input=$('script-fields').querySelector(`[data-clip-index="${activeIndex}"]`);if(input){input.value=next.text;input.dispatchEvent(new Event('history-restored'));input.setSelectionRange(next.start,next.end);if(!input.hidden)input.focus();reading(input.nextElementSibling,next.text);}syncTools();
  }
  function persist(s=state()){
    try{
      const result=core.mergeWrite(localStorage,s.key,s.edition.clips,s.drafts,s.dirty,s.bases);
      s.conflict=!result.ok;if(result.ok)s.drafts=result.drafts;s.available=true;
    }catch{s.available=false;}
    if(s===state())status();return s.available;
  }
  function update(i,text,s){
    if(!s.dirty.has(i))s.bases.set(i,core.draftText(s.edition.clips,s.drafts,i));
    if(text===s.edition.clips[i].text)delete s.drafts[i];else s.drafts[i]={text,updatedAt:new Date().toISOString()};s.dirty.add(i);persist(s);
  }
  function saveView(){try{localStorage.setItem(viewKey,JSON.stringify({language,slide:core.pages(state().edition.clips)[pageIndex].slide}));}catch{}}
  try{const saved=JSON.parse(localStorage.getItem(viewKey)||'null');if(saved&&['ja','zh'].includes(saved.language)){language=saved.language;pageIndex=Math.max(0,core.pages(state().edition.clips).findIndex(p=>p.slide===saved.slide));}}catch{}
  function cue(){const page=core.pages(state().edition.clips)[pageIndex];if(embedded){if(embeddedReady)parent.postMessage({type:'script-editor-change',slide:page.slide,language},location.protocol==='file:'||location.origin==='null'?'*':location.origin);return;}if(ready)$('script-frame').contentWindow.postMessage({type:'script-cue',slide:page.slide,language,interactive:innerWidth>=1025},'*');}
  function render(){
    const s=state(),pages=core.pages(s.edition.clips);pageIndex=Math.max(0,Math.min(pageIndex,pages.length-1));
    const page=pages[pageIndex];$('script-page').replaceChildren();
    if(!page.indices.includes(activeIndex))activeIndex=page.indices[0];
    pages.forEach((p,i)=>{const option=document.createElement('option');option.value=i;option.textContent=`${String(p.slide+1).padStart(2,'0')} · ${p.heading}`;$('script-page').append(option);});
    $('script-page').value=pageIndex;$('script-previous').disabled=pageIndex===0;$('script-next').disabled=pageIndex===pages.length-1;
    $('preview-label').textContent=`${language==='ja'?'日本語':'中文'} · ${String(page.slide+1).padStart(2,'0')} / ${deck.slideCount}${window.PUBLIC_REDACTED?' · 公开版':''}`;
    $('script-count').textContent=`${pageIndex+1} / ${pages.length}`;
    document.querySelectorAll('[data-script-language]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.scriptLanguage===language)));
    $('script-fields').replaceChildren();
    page.indices.forEach((i,n)=>{
      const row=document.createElement('section');row.className='script-paragraph';const label=document.createElement('label');label.htmlFor=`script-input-${i}`;label.textContent=`${n+1} / ${page.indices.length}`;
      const input=document.createElement('textarea');input.id=label.htmlFor;input.className='script-input';input.dataset.clipIndex=i;input.lang=language==='ja'?'ja':'zh-CN';input.spellcheck=false;input.setAttribute('aria-label',`第${page.slide+1}页${language==='ja'?'日文':'中文'}讲稿${page.indices.length>1?' · 第'+(n+1)+'段':''}`);input.value=core.draftText(s.edition.clips,s.drafts,i);
      const guide=document.createElement('div');guide.className='script-reading';guide.lang='ja';guide.setAttribute('aria-label','片假名注音讲稿');guide.tabIndex=0;
      const annotated=language==='ja'&&readingMode;input.hidden=annotated;guide.hidden=!annotated;if(annotated)reading(guide,input.value);
      let before=snapshot(input),composing=false,compositionBefore=null;
      input.addEventListener('history-restored',()=>{before=snapshot(input);});
      input.onfocus=()=>{activeIndex=i;before=snapshot(input);syncTools();};
      guide.onfocus=()=>{activeIndex=i;syncTools();};
      input.onbeforeinput=e=>{if(e.inputType==='historyUndo'||e.inputType==='historyRedo'){e.preventDefault();activeIndex=i;travel(e.inputType==='historyUndo'?'undo':'redo');return;}if(!composing)before=snapshot(input);};
      input.addEventListener('compositionstart',()=>{composing=true;compositionBefore=snapshot(input);});
      input.addEventListener('compositionend',()=>{composing=false;tools.record(history(s,i),compositionBefore||before,snapshot(input),'composition');before=snapshot(input);update(i,input.value,s);});
      input.oninput=e=>{if(input.isConnected&&s===state()&&core.pages(s.edition.clips)[pageIndex].indices.includes(i))activeIndex=i;const after=snapshot(input);if(!composing&&!e.isComposing)tools.record(history(s,i),before,after,e.inputType||'replace');before=after;update(i,input.value,s);};
      row.append(label,input,guide);$('script-fields').append(row);
    });
    $('script-fields').scrollTop=0;saveView();status();cue();
  }
  function navigate(next){persist();document.activeElement?.blur();pageIndex=next;render();}
  $('script-page').onchange=()=>navigate(Number($('script-page').value));$('script-previous').onclick=()=>navigate(pageIndex-1);$('script-next').onclick=()=>navigate(pageIndex+1);
  document.querySelectorAll('[data-script-language]').forEach(b=>b.onclick=()=>{persist();document.activeElement?.blur();language=b.dataset.scriptLanguage;render();});
  document.querySelectorAll('[data-scope]').forEach(link=>link.setAttribute('aria-current',link.dataset.scope===scope?'page':'false'));
  $('back-review').href=scope==='supplement'?'review.html?scope=supplement':'review.html';
  $('script-save').onclick=()=>{persist();document.activeElement?.blur();};
  for(const direction of ['undo','redo']){$('script-'+direction).onpointerdown=e=>e.preventDefault();$('script-'+direction).onclick=()=>travel(direction);}
  $('script-readings').onchange=()=>{readingMode=$('script-readings').checked;document.activeElement?.blur();render();resize();};
  document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&!e.altKey&&!e.isComposing&&e.key.toLowerCase()==='z'&&document.activeElement?.matches('.script-input')){e.preventDefault();travel(e.shiftKey?'redo':'undo');}});
  const pack=()=>core.package(data,language,scope,state().drafts);
  const filename=extension=>`研究Ⅱ_${language==='ja'?'日本語':'中文'}_${scope==='main'?'正文':'补充'}_讲稿修订.${extension}`;
  function download(content,type,name){const url=URL.createObjectURL(new Blob([content],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  $('script-export-json').onclick=()=>download(JSON.stringify(pack(),null,2),'application/json',filename('json'));
  $('script-export-md').onclick=()=>download(core.markdown(pack()),'text/markdown;charset=utf-8',filename('md'));
  $('script-share').onclick=async()=>{
    const p=pack(),files=[new File([JSON.stringify(p,null,2)],filename('json'),{type:'application/json'}),new File([core.markdown(p)],filename('md'),{type:'text/markdown'})];
    try{if(navigator.canShare?.({files}))await navigator.share({files,title:'研究Ⅱ讲稿修订'});else $('script-export-json').click();}
    catch(error){if(error.name!=='AbortError'){$('script-export-json').click();message('分享失败，已改为下载修改文件');}}
  };
  $('script-import').onclick=()=>$('script-import-file').click();
  $('script-import-file').onchange=async()=>{
    const file=$('script-import-file').files[0];$('script-import-file').value='';if(!file)return;
    try{
      if(file.size>5*1024*1024)throw Error('文件过大');
      const incoming=core.importEdits(JSON.parse(await file.text()),data,language,scope),s=state();
      const conflicts=Object.keys(incoming).filter(i=>Object.hasOwn(s.drafts,i)&&s.drafts[i].text!==incoming[i].text);
      if(conflicts.length&&!confirm(`本机有${conflicts.length}段不同草稿。是否用导入文件替换这些段落？`)){message('未导入，保留本机草稿');return;}
      for(const [i,draft] of Object.entries(incoming)){const index=Number(i),original=core.draftText(s.edition.clips,s.drafts,index);tools.record(history(s,index),{text:original,start:0,end:0},{text:draft.text,start:0,end:0},'import');if(!s.dirty.has(index))s.bases.set(index,original);if(draft.text===s.edition.clips[i].text)delete s.drafts[i];else s.drafts[i]=draft;s.dirty.add(index);}
      persist(s);render();if(s.available&&!s.conflict)message(`已导入 · ${Object.keys(incoming).length}段修改`);
    }catch(error){message('导入失败：'+error.message,true);}
  };
  window.addEventListener('storage',event=>{
    const s=state();if(event.key!==s.key||s.dirty.size)return;
    if(document.activeElement?.matches('.script-input')){
      try{const latest=core.sanitizeDrafts(JSON.parse(event.newValue||'{}'),s.edition.clips),i=Number(document.activeElement.dataset.clipIndex);
        if(core.draftText(s.edition.clips,latest,i)!==core.draftText(s.edition.clips,s.drafts,i)){s.conflict=true;status();return;}
        for(const [index,h] of s.histories)if(core.draftText(s.edition.clips,latest,index)!==core.draftText(s.edition.clips,s.drafts,index))s.histories.delete(index);
        s.drafts=latest;document.querySelectorAll('.script-input').forEach(input=>{if(input!==document.activeElement){input.value=core.draftText(s.edition.clips,s.drafts,Number(input.dataset.clipIndex));input.dispatchEvent(new Event('history-restored'));}});status();
      }catch{message('另一窗口草稿无法读取，请导出当前版本',true);}return;
    }
    cache.delete(s.key);render();
  });
  function fitPreview(){const stage=$('preview-stage'),frame=$('script-frame'),scale=Math.min(stage.clientWidth/1200,stage.clientHeight/900);frame.style.transform=`translate(${(stage.clientWidth-1200*scale)/2}px,${(stage.clientHeight-900*scale)/2}px) scale(${scale})`;}
  const resize=()=>{const height=window.visualViewport?.height||innerHeight;document.documentElement.style.setProperty('--script-height',height+'px');document.body.classList.toggle('is-typing',height<600&&!!document.activeElement?.matches('.script-input'));fitPreview();cue();};
  new ResizeObserver(fitPreview).observe($('preview-stage'));window.visualViewport?.addEventListener('resize',resize);window.addEventListener('resize',resize);
  document.addEventListener('focusin',()=>{if(document.activeElement?.matches('.script-input'))resize();});document.addEventListener('focusout',()=>setTimeout(resize,200));
  window.addEventListener('pagehide',()=>{for(const s of cache.values())persist(s);});
  window.addEventListener('message',e=>{if(e.source===$('script-frame').contentWindow&&e.data?.type==='script-preview-ready'){ready=true;cue();}});
  window.addEventListener('message',e=>{if(embedded||e.source!==$('script-frame').contentWindow||e.data?.type!=='script-preview-change'||!Number.isInteger(e.data.slide))return;const next=core.pages(state().edition.clips).findIndex(p=>p.slide===e.data.slide);if(next<0||next===pageIndex)return;persist();document.activeElement?.blur();pageIndex=next;render();});
  const bridge=`<script>addEventListener('message',e=>{if(e.source!==parent||e.data?.type!=='script-cue')return;const d=e.data;document.body.classList.toggle('preview-interactive',!!d.interactive);if(['ja','zh'].includes(d.language))document.querySelector('[data-language="'+d.language+'"]')?.click();if(Number.isInteger(d.slide)&&d.slide>=0&&d.slide<${deck.slideCount})window.__goSlide(d.slide);});parent.postMessage({type:'script-preview-ready'},'*');<\/script>`;
  if(!embedded)$('script-frame').srcdoc=deck.deckHtml.replace('<head>',`<head><base href="${new URL('.',location.href).href}">`).replace('</head>','<style>#presentation-footer{display:none!important}.preview-interactive #presentation-footer{display:flex!important}#supplement-toggle,#overview [data-language]{display:none!important}*{transition:none!important}</style></head>').replace('</body>',bridge+'<script src="deck-page-sync.js" data-mode="script"><\/script></body>');
  if(embedded)window.addEventListener('message',event=>{
    if(event.source!==parent||event.data?.type!=='review-editor-cue')return;const d=event.data;if(!['ja','zh'].includes(d.language))return;
    const pages=core.pages(core.edition(data,d.language,scope).clips),next=pages.findIndex(p=>p.slide===d.slide);if(next<0)return;embeddedReady=true;
    if(language===d.language&&pageIndex===next)return;persist();document.activeElement?.blur();language=d.language;pageIndex=next;render();
  });
  window.setupReviewOffline($('offline-save'),$('offline-status'));render();resize();
  if(embedded)parent.postMessage({type:'script-editor-ready',language},location.protocol==='file:'||location.origin==='null'?'*':location.origin);
})();
