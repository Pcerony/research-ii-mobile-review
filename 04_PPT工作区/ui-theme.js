(()=>{
 'use strict';
 const key='researchII.ui.theme',root=document.documentElement,media=matchMedia('(prefers-color-scheme: dark)'),valid=v=>['system','light','dark'].includes(v);
 let preference='system';try{const saved=localStorage.getItem(key);if(valid(saved))preference=saved;}catch{}
 function apply(){const dark=preference==='dark'||preference==='system'&&media.matches;root.dataset.theme=dark?'dark':'light';root.style.colorScheme=dark?'dark':'light';document.querySelectorAll('[data-theme-select]').forEach(s=>s.value=preference);document.querySelector('meta[name="theme-color"]')?.setAttribute('content',dark?'#191d1b':'#fafbf8');}
 function set(value,broadcast=true){if(!valid(value))return;preference=value;apply();if(broadcast){try{localStorage.setItem(key,value);}catch{}for(const frame of document.querySelectorAll('iframe'))frame.contentWindow?.postMessage({type:'ui-theme',value},location.origin==='null'?'*':location.origin);if(parent!==window)parent.postMessage({type:'ui-theme',value},location.origin==='null'?'*':location.origin);}}
 apply();media.addEventListener('change',apply);
 window.addEventListener('storage',e=>{if(e.key===key)set(valid(e.newValue)?e.newValue:'system',false);});
 window.addEventListener('message',e=>{if(e.origin!==location.origin||e.data?.type!=='ui-theme'||!valid(e.data.value))return;if(e.source===parent&&parent!==window)set(e.data.value,false);else if([...document.querySelectorAll('iframe')].some(f=>f.contentWindow===e.source))set(e.data.value);});
 document.addEventListener('DOMContentLoaded',()=>{
  const host=document.querySelector('.slide-review-tools,.script-tools');if(!host)return;
  const control=document.createElement('details');control.className='theme-control';
  // Lucide sun-moon paths, locally vendored under assets/LICENSE.lucide.
  control.innerHTML='<summary title="界面主题" aria-label="界面主题"><svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42"/><circle cx="12" cy="12" r="4"/></svg></summary><label class="theme-menu">界面主题<select data-theme-select aria-label="界面主题"><option value="system">跟随系统</option><option value="light">浅色</option><option value="dark">深色</option></select></label>';
  host.append(control);control.querySelector('select').onchange=e=>{set(e.target.value);control.open=false;};
  const position=()=>{const r=control.getBoundingClientRect(),menu=control.querySelector('.theme-menu');menu.style.left=Math.max(8,Math.min(innerWidth-172,r.right-156))+'px';menu.style.top=Math.max(8,Math.min(innerHeight-120,r.bottom+4))+'px';};control.addEventListener('toggle',position);window.addEventListener('resize',position);
  document.addEventListener('pointerdown',e=>{if(!control.contains(e.target))control.open=false;});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&control.open){control.open=false;control.querySelector('summary').focus();e.stopPropagation();}},true);apply();
 });
})();
