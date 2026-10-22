(() => {
  'use strict';
  const $=id=>document.getElementById(id),core=window.ScriptEditorCore,data=window.SCRIPT_DATA,deck=window.REVIEW_DATA;
  const scope=new URLSearchParams(location.search).get('scope')==='supplement'?'supplement':'main',cache=new Map();
  let language='ja',pageIndex=0,ready=false;
  const viewKey=`researchII.script.view.${data.deckHash}.${scope}`;
  // Lucide icon paths, vendored locally under assets/LICENSE.lucide.
  const paths={
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
      const edition=core.edition(data,language,scope),s={key,edition,drafts:{},dirty:new Set(),bases:new Map(),available:true,conflict:false};
      try{s.drafts=core.sanitizeDrafts(JSON.parse(localStorage.getItem(key)||'{}'),edition.clips);}catch{s.available=false;}
      cache.set(key,s);
    }
    return cache.get(key);
  }
  function status(){const s=state(),n=Object.keys(s.drafts).length;message(s.conflict?'另一窗口草稿冲突，未覆盖，请导出':s.available?(n?`已存本机 · ${n}段修改`:'原稿 · 已存本机'):'本机保存不可用，请导出',!s.available||s.conflict);}
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
  function cue(){if(ready){const page=core.pages(state().edition.clips)[pageIndex];$('script-frame').contentWindow.postMessage({type:'script-cue',slide:page.slide,language},'*');}}
  function render(){
    const s=state(),pages=core.pages(s.edition.clips);pageIndex=Math.max(0,Math.min(pageIndex,pages.length-1));
    const page=pages[pageIndex];$('script-page').replaceChildren();
    pages.forEach((p,i)=>{const option=document.createElement('option');option.value=i;option.textContent=`${String(p.slide+1).padStart(2,'0')} · ${p.heading}`;$('script-page').append(option);});
    $('script-page').value=pageIndex;$('script-previous').disabled=pageIndex===0;$('script-next').disabled=pageIndex===pages.length-1;
    $('preview-label').textContent=`${language==='ja'?'日本語':'中文'} · ${String(page.slide+1).padStart(2,'0')} / ${deck.slideCount}${window.PUBLIC_REDACTED?' · 公开版':''}`;
    $('script-count').textContent=`${pageIndex+1} / ${pages.length}`;
    document.querySelectorAll('[data-script-language]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.scriptLanguage===language)));
    $('script-fields').replaceChildren();
    page.indices.forEach((i,n)=>{
      const row=document.createElement('section');row.className='script-paragraph';const label=document.createElement('label');label.htmlFor=`script-input-${i}`;label.textContent=`${n+1} / ${page.indices.length}`;
      const input=document.createElement('textarea');input.id=label.htmlFor;input.className='script-input';input.dataset.clipIndex=i;input.lang=language==='ja'?'ja':'zh-CN';input.spellcheck=false;input.setAttribute('aria-label',`第${page.slide+1}页${language==='ja'?'日文':'中文'}讲稿${page.indices.length>1?' · 第'+(n+1)+'段':''}`);input.value=core.draftText(s.edition.clips,s.drafts,i);
      input.oninput=()=>update(i,input.value,s);row.append(label,input);$('script-fields').append(row);
    });
    $('script-fields').scrollTop=0;saveView();status();cue();
  }
  function navigate(next){persist();document.activeElement?.blur();pageIndex=next;render();}
  $('script-page').onchange=()=>navigate(Number($('script-page').value));$('script-previous').onclick=()=>navigate(pageIndex-1);$('script-next').onclick=()=>navigate(pageIndex+1);
  document.querySelectorAll('[data-script-language]').forEach(b=>b.onclick=()=>{persist();document.activeElement?.blur();language=b.dataset.scriptLanguage;render();});
  document.querySelectorAll('[data-scope]').forEach(link=>link.setAttribute('aria-current',link.dataset.scope===scope?'page':'false'));
  $('back-review').href=scope==='supplement'?'review.html?scope=supplement':'review.html';
  $('script-save').onclick=()=>{persist();document.activeElement?.blur();};
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
      for(const [i,draft] of Object.entries(incoming)){const index=Number(i);if(!s.dirty.has(index))s.bases.set(index,core.draftText(s.edition.clips,s.drafts,index));if(draft.text===s.edition.clips[i].text)delete s.drafts[i];else s.drafts[i]=draft;s.dirty.add(index);}
      persist(s);render();if(s.available&&!s.conflict)message(`已导入 · ${Object.keys(incoming).length}段修改`);
    }catch(error){message('导入失败：'+error.message,true);}
  };
  window.addEventListener('storage',event=>{
    const s=state();if(event.key!==s.key||s.dirty.size)return;
    if(document.activeElement?.matches('.script-input')){
      try{const latest=core.sanitizeDrafts(JSON.parse(event.newValue||'{}'),s.edition.clips),i=Number(document.activeElement.dataset.clipIndex);
        if(core.draftText(s.edition.clips,latest,i)!==core.draftText(s.edition.clips,s.drafts,i)){s.conflict=true;status();return;}
        s.drafts=latest;document.querySelectorAll('.script-input').forEach(input=>{if(input!==document.activeElement)input.value=core.draftText(s.edition.clips,s.drafts,Number(input.dataset.clipIndex));});status();
      }catch{message('另一窗口草稿无法读取，请导出当前版本',true);}return;
    }
    cache.delete(s.key);render();
  });
  function fitPreview(){const stage=$('preview-stage'),frame=$('script-frame'),scale=Math.min(stage.clientWidth/1200,stage.clientHeight/900);frame.style.transform=`translate(${(stage.clientWidth-1200*scale)/2}px,${(stage.clientHeight-900*scale)/2}px) scale(${scale})`;}
  const resize=()=>{const height=window.visualViewport?.height||innerHeight;document.documentElement.style.setProperty('--script-height',height+'px');document.body.classList.toggle('is-typing',height<600&&!!document.activeElement?.matches('.script-input'));fitPreview();};
  new ResizeObserver(fitPreview).observe($('preview-stage'));window.visualViewport?.addEventListener('resize',resize);window.addEventListener('resize',resize);
  document.addEventListener('focusin',()=>{if(document.activeElement?.matches('.script-input'))resize();});document.addEventListener('focusout',()=>setTimeout(resize,200));
  window.addEventListener('pagehide',()=>{for(const s of cache.values())persist(s);});
  window.addEventListener('message',e=>{if(e.source===$('script-frame').contentWindow&&e.data?.type==='script-preview-ready'){ready=true;cue();}});
  const bridge=`<script>addEventListener('message',e=>{if(e.source!==parent||e.data?.type!=='script-cue')return;const d=e.data;if(['ja','zh'].includes(d.language))document.querySelector('[data-language="'+d.language+'"]')?.click();if(Number.isInteger(d.slide)&&d.slide>=0&&d.slide<${deck.slideCount})window.__goSlide(d.slide);});parent.postMessage({type:'script-preview-ready'},'*');<\/script>`;
  $('script-frame').srcdoc=deck.deckHtml.replace('<head>',`<head><base href="${new URL('.',location.href).href}">`).replace('</head>','<style>#presentation-footer{display:none!important}*{transition:none!important}</style></head>').replace('</body>',bridge+'</body>');
  window.setupReviewOffline($('offline-save'),$('offline-status'));render();resize();
})();
