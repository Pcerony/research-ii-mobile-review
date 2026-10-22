const fs=require('node:fs'),assert=require('node:assert/strict'),test=require('node:test'),vm=require('node:vm');
const read=f=>fs.readFileSync('04_PPT工作区/'+f,'utf8');
test('mobile controls and install entry are available',()=>{
  const html=read('review.html'),mobile=read('review-mobile.js');
  for(const id of ['toggle-inspector','close-inspector','offline-save','offline-status','share-notes','import-notes','import-file'])assert.ok(mobile.includes(`'${id}'`),id);
  assert.ok(html.includes('review.webmanifest'));assert.ok(html.includes('review-mobile.js'));
});
test('touch capture rejects extra pointers and has visible cancellation',()=>{
  const js=read('review-slide.js');assert.match(js,/isPrimary/);assert.match(js,/pointerId/);assert.match(js,/取消框选/);
});
test('offline build has a versioned complete dependency manifest',()=>{
  const pack=JSON.parse(read('offline-files.json'));
  assert.ok(pack.version);assert.ok(pack.files.includes('review.html?scope=supplement'));
  const manifest=JSON.parse(read('review-audio-manifest.json'));
  for(const c of [...manifest.clips,...manifest.appendixClips])assert.ok(pack.files.includes(c.audio));
  for(const f of pack.files)assert.ok(fs.existsSync('04_PPT工作区/'+f.split('?')[0]),f);
  assert.ok(!pack.files.some(f=>f.includes('..')||f.startsWith('http')));
});
test('service worker handles byte ranges without network',async()=>{
  const events={},context={importScripts:()=>{},self:{OFFLINE_PACK:{version:'test'},addEventListener:(n,f)=>events[n]=f},URL,Response,Request,Headers,console};
  vm.createContext(context);vm.runInContext(read('review-sw.js'),context);
  const response=await vm.runInContext("rangeResponse(new Response(new Uint8Array([1,2,3,4])), 'bytes=1-2')",context);
  assert.equal(response.status,206);assert.equal(response.headers.get('content-range'),'bytes 1-2/4');assert.deepEqual([...new Uint8Array(await response.arrayBuffer())],[2,3]);
});
