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
  if($('note-text').value.trim()&&!$('notes-panel').hidden)setOpen(true);
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
  const scriptMode=document.createElement('a');scriptMode.href=new URLSearchParams(location.search).get('scope')==='supplement'?'script.html?scope=supplement':'script.html';scriptMode.className='script-mode-link';scriptMode.textContent='讲稿模式';scriptMode.title='竖屏直接编辑讲稿';document.querySelector('.slide-review-tools').append(scriptMode);
  document.querySelector('.slide-review-tools').append(offline,status);
  const viewport=()=>{
    const height=window.visualViewport?.height||innerHeight;
    document.documentElement.style.setProperty('--visible-height',`${height}px`);
    const compact=height<320&&!!document.activeElement?.matches('textarea'),wasCompact=document.body.classList.contains('keyboard-open');
    document.body.classList.toggle('keyboard-open',compact);
    if(compact&&!wasCompact&&document.activeElement===$('note-text'))$('notes-panel').scrollTop=0;
  };
  window.visualViewport?.addEventListener('resize',viewport);window.addEventListener('resize',viewport);
  document.addEventListener('focusin',()=>{if(document.activeElement?.matches('textarea'))viewport();});
  document.addEventListener('focusout',()=>setTimeout(viewport,200));viewport();
  window.setupReviewOffline(offline,status);
})();

if(window.PUBLIC_REDACTED)document.querySelector('.review-header h1 span').textContent='公开审查版';
