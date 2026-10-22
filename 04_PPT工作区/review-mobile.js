(() => {
  'use strict';
  const $=id=>document.getElementById(id),header=document.querySelector('.header-actions');
  const button=(id,label,text)=>{const b=document.createElement('button');b.id=id;b.type='button';b.className='icon-button';b.title=label;b.setAttribute('aria-label',label);b.textContent=text;return b;};
  const toggle=button('toggle-inspector','讲稿与意见','☰');toggle.setAttribute('aria-expanded','false');header.append(toggle);
  const close=button('close-inspector','收起面板','×');document.querySelector('.inspector-tabs').append(close);
  const setOpen=on=>{document.body.classList.toggle('inspector-open',on);toggle.setAttribute('aria-expanded',String(on));};
  toggle.onclick=()=>setOpen(!document.body.classList.contains('inspector-open'));close.onclick=()=>{setOpen(false);toggle.focus();};
  window.addEventListener('review-restore-pending',()=>setOpen(true));
  window.addEventListener('review-open-form',()=>setOpen(true));
  for(const id of ['add-note','annotate-slide-page','annotate-slide-text','notes-tab','transcript-tab'])$(id).addEventListener('click',()=>setOpen(true));
  $('note-text').addEventListener('focus',()=>setOpen(true));
  $('cancel-note').addEventListener('click',()=>setOpen(false));
  $('note-form').addEventListener('submit',()=>{if(!$('note-text').value.trim()){setOpen(false);document.activeElement?.blur();}});
  const share=button('share-notes','分享审查文件','↥'),importButton=button('import-notes','导入审查文件','↑');
  const file=document.createElement('input');file.type='file';file.id='import-file';file.accept='.json,application/json';file.hidden=true;
  document.querySelector('.notes-tools').append(share,importButton,file);
  share.onclick=()=>window.dispatchEvent(new Event('review-share'));
  importButton.onclick=()=>file.click();file.onchange=()=>{if(file.files[0])window.dispatchEvent(new CustomEvent('review-import',{detail:file.files[0]}));file.value='';};
  const offline=button('offline-save','下载离线资料','⇩'),status=document.createElement('span');status.id='offline-status';status.role='status';status.textContent='未下载离线';
  document.querySelector('.slide-review-tools').append(offline,status);
  const viewport=()=>{if(window.visualViewport)document.documentElement.style.setProperty('--visible-height',`${visualViewport.height}px`);};
  visualViewport?.addEventListener('resize',viewport);viewport();
  if(!('serviceWorker' in navigator)||!['https:','http:'].includes(location.protocol)){status.textContent='离线下载需HTTPS入口';offline.disabled=true;return;}
  let worker,busy=false;
  const ready=navigator.serviceWorker.register('review-sw.js').then(async registration=>{await navigator.serviceWorker.ready;worker=registration.active;return worker;});
  ready.then(()=>worker.postMessage({type:'offline-status'})).catch(()=>{status.textContent='离线初始化失败，可重试';});
  navigator.serviceWorker.addEventListener('message',e=>{
    if(e.data?.type==='offline-status'){status.textContent=e.data.ready?'离线已就绪':'未下载离线';return;}
    if(e.data?.type!=='offline-progress')return;
    status.textContent=e.data.error?'下载失败，请重试':e.data.done?'离线已就绪':`离线 ${e.data.current}/${e.data.total}`;
    if(e.data.done||e.data.error){busy=false;offline.disabled=false;}
  });
  offline.onclick=async()=>{
    if(busy)return;busy=true;offline.disabled=true;status.textContent='准备离线资料…';
    try{await ready;await navigator.storage?.persist?.();worker.postMessage({type:'offline-save'});}
    catch{status.textContent='下载失败，请重试';busy=false;offline.disabled=false;}
  };
})();

if(window.PUBLIC_REDACTED)document.querySelector('.review-header h1 span').textContent='公开审查版';
