(() => {
  'use strict';
  window.setupReviewOffline=(offline,status)=>{
    if(!('serviceWorker' in navigator)||!['https:','http:'].includes(location.protocol)){status.textContent='离线下载需HTTPS入口';offline.disabled=true;return;}
    let worker,busy=false;
    status.setAttribute('aria-busy','true');
    const registration=navigator.serviceWorker.register('review-sw.js',{updateViaCache:'none'});
    async function currentWorker(){
      const reg=await registration;await navigator.serviceWorker.ready;
      if(navigator.onLine)try{await reg.update();}catch{if(!reg.active)throw Error('Worker update failed');}
      const pending=reg.installing||reg.waiting;
      if(pending&&pending.state!=='activated')await new Promise((resolve,reject)=>{
        const timer=setTimeout(()=>{pending.removeEventListener('statechange',changed);reject(Error('Worker activation timed out'));},15000);
        function changed(){if(pending.state==='activated'||pending.state==='redundant'){clearTimeout(timer);pending.removeEventListener('statechange',changed);pending.state==='activated'?resolve():reject(Error('Worker became redundant'));}}
        pending.addEventListener('statechange',changed);changed();
      });
      worker=reg.active;if(!worker)throw Error('Worker unavailable');return worker;
    }
    currentWorker().then(active=>active.postMessage({type:'offline-status'})).catch(()=>{status.setAttribute('aria-busy','false');status.textContent='离线初始化失败，可重试';});
    navigator.serviceWorker.addEventListener('message',e=>{
      if(e.data?.type==='offline-status'){status.setAttribute('aria-busy','false');status.textContent=e.data.scriptEditor!==true?'离线资料版本较旧，请联网更新':e.data.ready?'离线已就绪':'未下载离线';return;}
      if(e.data?.type!=='offline-progress')return;
      status.textContent=e.data.error?'下载失败，请重试':e.data.done?(e.data.scriptEditor===true?'离线已就绪':'离线资料版本较旧，请联网更新'):`离线 ${e.data.current}/${e.data.total}`;
      if(e.data.done||e.data.error){busy=false;offline.disabled=false;status.setAttribute('aria-busy','false');}
    });
    offline.onclick=async()=>{
      if(busy)return;busy=true;offline.disabled=true;status.setAttribute('aria-busy','true');status.textContent='准备离线资料…';
      try{const active=await currentWorker();await navigator.storage?.persist?.();active.postMessage({type:'offline-save'});}
      catch{status.textContent='下载失败，请重试';status.setAttribute('aria-busy','false');busy=false;offline.disabled=false;}
    };
  };
})();
