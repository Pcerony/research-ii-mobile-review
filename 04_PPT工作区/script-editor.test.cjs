const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const fixture={deckHash:'deck',speechVersion:31,languages:{zh:{main:{speechHash:'zh',clips:[{id:'p01',slide:0,heading:'封面',text:'原文一'},{id:'p02',slide:1,heading:'背景',text:'原文二'}]}},ja:{main:{speechHash:'ja',clips:[{id:'p01',slide:0,heading:'表紙',text:'原稿'}]}}}};
test('script core groups multiple paragraphs without losing source indices',()=>{
 const core=require('./script-core.js');assert.deepEqual(core.pages([{slide:19},{slide:19},{slide:20}]).map(p=>p.indices),[[0,1],[2]]);
});
test('Chinese drafts share existing review keys, Japanese drafts stay separate',()=>{
 const core=require('./script-core.js');assert.equal(core.storageKey(fixture,'zh','main'),'researchII.review.zh.deck.drafts');assert.notEqual(core.storageKey(fixture,'ja','main'),core.storageKey(fixture,'zh','main'));
});
test('full exports include unchanged pages and preserve empty and multiline edits',()=>{
 const core=require('./script-core.js'),drafts={0:{text:''},1:{text:'改稿\n第二行'}};
 const pack=core.package(fixture,'zh','main',drafts);assert.equal(pack.edits.length,2);assert.equal(pack.clips[0].text,'');assert.equal(pack.clips[1].text,'改稿\n第二行');assert.match(core.markdown(pack),/改稿\n第二行/);
 assert.equal(core.package(fixture,'ja','main',{}).clips[0].text,'原稿');assert.equal(core.package(fixture,'ja','main',{}).audioMatchesDraft,false);
});
test('import refuses wrong source, language and invalid mapping before changing drafts',()=>{
 const core=require('./script-core.js'),pack=core.package(fixture,'zh','main',{0:{text:'新稿'}});
 assert.deepEqual(core.importEdits(pack,fixture,'zh','main'),{0:{text:'新稿',updatedAt:pack.edits[0].updatedAt}});
 for(const patch of [{speechHash:'wrong'},{language:'ja'},{scope:'supplement'},{edits:[{...pack.edits[0],slide:0}]},{edits:[{clipIndex:0,clipId:'wrong',originalText:'原文一',text:'新稿'}]}])assert.throws(()=>core.importEdits({...pack,...patch},fixture,'zh','main'));
});
test('both manuscript languages are packaged and match the unchanged source files',()=>{
 const context={window:{}};vm.runInNewContext(fs.readFileSync('04_PPT工作区/script-data.js','utf8'),context);
 const data=context.window.SCRIPT_DATA;for(const lang of ['ja','zh']){assert.equal(data.languages[lang].main.clips.length,19);assert.equal(data.languages[lang].supplement.clips.length,5);}
 assert.equal(data.languages.ja.main.speechHash,require('node:crypto').createHash('sha256').update(fs.readFileSync('04_PPT工作区/発表原稿_日本語.md')).digest('hex'));
});
test('offline package contains both portrait editor scopes and shared offline runtime',()=>{
 const files=JSON.parse(fs.readFileSync('04_PPT工作区/offline-files.json')).files;
 for(const f of ['script.html','script.html?scope=supplement','script-editor.js','script-editor.css','script-data.js','script-core.js','script.webmanifest','review-offline.js'])assert.ok(files.includes(f),f);
 assert.equal(JSON.parse(fs.readFileSync('04_PPT工作区/script.webmanifest')).orientation,'portrait');
 assert.notEqual(JSON.parse(fs.readFileSync('04_PPT工作区/review.webmanifest')).orientation,'landscape');
});
test('shared draft writers merge disjoint changes and refuse stale same-paragraph writes',()=>{
 const core=require('./script-core.js'),clips=fixture.languages.zh.main.clips;let stored=JSON.stringify({0:{text:'另一窗口A'}});
 const storage={getItem:()=>stored,setItem:(_,value)=>stored=value};
 const result=core.mergeWrite(storage,'key',clips,{1:{text:'本机B'}},new Set([1]),new Map([[1,'原文二']]));
 assert.equal(result.ok,true);assert.equal(JSON.parse(stored)[0].text,'另一窗口A');assert.equal(JSON.parse(stored)[1].text,'本机B');
 const conflict=core.mergeWrite(storage,'key',clips,{0:{text:'过时窗口A'}},new Set([0]),new Map([[0,'原文一']]));assert.equal(conflict.ok,false);assert.equal(JSON.parse(stored)[0].text,'另一窗口A');
});
