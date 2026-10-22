/* The configuration is generated from the exact current runtime dependencies. */
importScripts('review-offline-config.js');
const cacheName='researchII-offline-'+self.OFFLINE_PACK.version;
let saving=null;
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
async function rangeResponse(response,header){
  const bytes=await response.arrayBuffer(),size=bytes.byteLength,match=/^bytes=(\d*)-(\d*)$/.exec(header);
  if(!match||(!match[1]&&!match[2]))return new Response(null,{status:416,headers:{'Content-Range':`bytes */${size}`}});
  let start=match[1]?Number(match[1]):Math.max(0,size-Number(match[2]));
  let end=match[1]?(match[2]?Math.min(Number(match[2]),size-1):size-1):size-1;
  if(start>=size||start>end)return new Response(null,{status:416,headers:{'Content-Range':`bytes */${size}`}});
  const headers=new Headers(response.headers);headers.set('Content-Range',`bytes ${start}-${end}/${size}`);headers.set('Content-Length',String(end-start+1));headers.set('Accept-Ranges','bytes');
  return new Response(bytes.slice(start,end+1),{status:206,headers});
}
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
  event.respondWith((async()=>{
    const cache=await caches.open(cacheName),cached=await cache.match(event.request.url);
    if(cached)return event.request.headers.has('range')?rangeResponse(cached,event.request.headers.get('range')):cached;
    return fetch(event.request);
  })());
});
self.addEventListener('message',event=>{
  if(event.data?.type==='offline-status'){
    event.waitUntil((async()=>{const cache=await caches.open(cacheName);event.source?.postMessage({type:'offline-status',ready:!!await cache.match(new URL('offline-ready.json',self.registration.scope).href)});})());return;
  }
  if(event.data?.type!=='offline-save')return;
  const notify=message=>event.source?.postMessage({type:'offline-progress',...message});
  if(saving){notify({error:'下载已在进行'});return;}
  saving=(async()=>{
    const pack=self.OFFLINE_PACK,cache=await caches.open(cacheName);let current=0;
    try{
      await cache.delete(new URL('offline-ready.json',self.registration.scope).href);
      for(const file of pack.files){
        const url=new URL(file,self.registration.scope).href;
        const response=await fetch(url,{cache:'reload'});if(!response.ok)throw Error(file);
        await cache.put(url,response);notify({current:++current,total:pack.files.length});
      }
      await cache.put(new URL('offline-ready.json',self.registration.scope).href,new Response(JSON.stringify({version:pack.version}),{headers:{'Content-Type':'application/json'}}));
      notify({done:true,current,total:pack.files.length});
    }catch(error){notify({error:String(error)});}finally{saving=null;}
  })();event.waitUntil(saving);
});
