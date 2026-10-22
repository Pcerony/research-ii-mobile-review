const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
const sharp=require('sharp');
const root=path.resolve('05_输出/github-public'),work='04_PPT工作区';
const replaced=['co-field-study.png','co-issues.png','field-observation.jpg','experiment-scene.jpg','wearable-tracking.jpg','screen-evaluation-setup.webp'].map(f=>'assets/'+f);
const clean=text=>text.replace(/https:\/\/(?:docs|drive)\.google\.com\/[^\s)"<>]+/g,'[PRIVATE_SOURCE_LINK_REMOVED]').replace(/\/Users\/[^\s`"'<>]+/g,'[LOCAL_PATH_REMOVED]');
function write(file,text){const dest=path.join(root,file);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,text);}
function copy(file){const dest=path.join(root,file);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(file,dest);}
(async()=>{
 fs.mkdirSync(root,{recursive:true});
 for(const entry of fs.readdirSync(root))if(entry!=='.git')fs.rmSync(path.join(root,entry),{recursive:true,force:true});
 // Source code and text provenance are published; binary source manuscripts and raw photo directories are not.
 for(const dir of ['00_项目管理','01_主稿参考','02_证据',work])for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
  if(!entry.isFile()||!(/\.(md|js|cjs|css|html|json|yml|sha256)$/.test(entry.name)))continue;
  const file=dir+'/'+entry.name;
  if(dir===work&&['offline-files.json','review-offline-config.js'].includes(entry.name))continue;
  write(file,clean(fs.readFileSync(file,'utf8')));
 }
 const pack=JSON.parse(fs.readFileSync(work+'/offline-files.json'));
 for(const file of pack.files.filter(f=>f.startsWith('assets/')))if(!replaced.includes(file))copy(work+'/'+file);
 copy(work+'/review.webmanifest');copy(work+'/script.webmanifest');copy(work+'/assets/LICENSE.lucide');
 for(const file of replaced){
  const metadata=await sharp(work+'/'+file).metadata(),width=metadata.width,height=metadata.height;
  const label=await sharp({text:{text:'PUBLIC ARCHIVE\nImage retained locally',font:'sans',width:Math.min(width-20,600),align:'center',rgba:true}}).png().toBuffer();
  await sharp({create:{width,height,channels:3,background:'#eef1ed'}}).composite([{input:label,gravity:'centre'}]).toFile(path.join(root,work,file));
 }
 fs.appendFileSync(path.join(root,work,'review-data.js'),'\nwindow.PUBLIC_REDACTED=true;\n');
 fs.appendFileSync(path.join(root,work,'review-mobile.js'),"\nif(window.PUBLIC_REDACTED)document.querySelector('.review-header h1 span').textContent='公开审查版';\n");
 write('PUBLIC-ARCHIVE.json',JSON.stringify({version:35,date:'2026-10-23',replaced,omitted:['03_图表与素材：原热图身份页眉及原始照片','01_主稿参考：未逐页隐私核验的PDF/DOCX二进制','交接材料与外部候选：未核验材料','历史音频与未引用资产','05_输出与浏览器状态'],redactions:['Google Forms/Drive非公开来源链接','本机绝对路径'],localDeckHash:JSON.parse(fs.readFileSync(work+'/review-audio-manifest.json')).deckHash,note:'公开版有明确素材占位，不等同本地完整视觉；N9/n4聚合数据、讲稿、代码、当前匿名裁切热图及音频保留。'},null,2)+'\n');
 write('.nojekyll','');write('.gitignore','.DS_Store\nnode_modules/\n05_输出/\n');
 write('AGENTS.md',clean(fs.readFileSync('AGENTS.md','utf8'))+'\n\n## Public archive constraint\n\nThis is the redacted public copy. Do not reconstruct omitted participant images or private source links. PUBLIC-ARCHIVE.json records exclusions. Use PUBLIC-MANIFEST.sha256 for this archive; local historical baselines refer to the complete private project and are not public-package integrity checks.\n');
 write('index.html','<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="0;url=04_PPT工作区/review.html"><a href="04_PPT工作区/review.html">研究Ⅱ 手机审查</a>');
 write('README.md',`# 研究Ⅱ：手机离线审查 / 第35稿\n\n[打开手机审查器](https://pcerony.github.io/research-ii-mobile-review/04_PPT工作区/review.html)\n\n19页正文＋2页补充。中文讲稿与音频沿第31稿，非日语实测时长。公开版部分图片以占位替换；完整原件仅保留于作者本地，详见PUBLIC-ARCHIVE.json。本仓库不是原始参与者数据开放库，不保证第三方素材可再次分发。\n\n## 手机离线\n\n先联网在Safari/Chrome打开审查器，建议添加到主屏幕后从主屏幕再次打开。点工具栏下载箭头，等状态显示“离线已就绪”；再以飞行模式刷新确认。横屏画面优先，右上菜单打开讲稿/意见。点框选区域，单指拖动；再次点同一按钮取消。输入后点保存意见。本机保存不等于云端保存；系统清理站点数据会丢失本机内容。意见栏向上箭头用于系统分享，向下箭头下载JSON，另一上箭头导入JSON。每次结束请导出文件。\n\n公开版与本地版素材有差异，但deckHash沿本地布局基线，便于意见回交。不要将占位图片的细节意见当作原图问题。意见文件不自动上传GitHub。将导出的JSON交给Codex即可作为后续修改输入，本轮未接入自动云端改稿。\n\n## 构建与测试\n\n需Node.js；浏览器QA需Playwright、Chrome，公开包再生成需sharp。\n\n\`\`\`sh\nnode 04_PPT工作区/build-research-slides.cjs\nnode 04_PPT工作区/build-review.cjs\nnode 04_PPT工作区/build-offline.cjs\nnode --test 04_PPT工作区/review-core.test.cjs 04_PPT工作区/review-editor.test.cjs 04_PPT工作区/review-slide.test.cjs 04_PPT工作区/review-mobile.test.cjs\npython3 -m http.server 8765 --bind 127.0.0.1\n# 另一终端\nnode 04_PPT工作区/verify-mobile.cjs\n\`\`\`\n\n现有音频已包含，无需macOS TTS重新生成。公开原稿部分来源是历史口径，采用顺序以01_研究口径与编号决议、02_证据账本及第35稿当前状态为准。原始热图重裁脚本依赖未公开原件，不能在公开包内重裁；当前18张匿名预览可直接使用。\n`);
 cp.execFileSync(process.execPath,[path.join(root,work,'build-offline.cjs')],{cwd:root,stdio:'inherit'});
 const audit=JSON.parse(fs.readFileSync(path.join(root,'PUBLIC-ARCHIVE.json')));audit.version=36;write('PUBLIC-ARCHIVE.json',JSON.stringify(audit,null,2)+'\n');
 const editorNotes='## 竖屏讲稿编辑\n\n[打开讲稿编辑](https://pcerony.github.io/research-ii-mobile-review/04_PPT工作区/script.html)。顶部小幅Slide预览，下方直接编辑当前页讲稿，无批注或音频控件。默认日文，中文可切换；两语言独立保存，中文与原审查器共用草稿。输入自动存本机，保存图标再次落盘；文件下载图标导出完整Markdown，下载箭头导出JSON修改文件，分享图标尝试系统分享两份文件。将JSON或完整MD交回Codex即可落实到正式稿；不会自动改写原稿或上传云端。JSON带源哈希、语言、页/段ID和原文/修订文，同稿可导入，冲突先确认。旧v2意见文件仍在原审查器导入。先联网重新下载本版离线包（80项），再飞行模式刷新。讲稿页可单独添加主屏幕，使用竖屏manifest；退出旧横屏锁定应用后重新进入可切换方向。\n\n## 手机离线';
 write('README.md',fs.readFileSync(path.join(root,'README.md'),'utf8').replaceAll('第35稿','第36稿').replace('## 手机离线',editorNotes));
 const records=[];function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(e.name==='.git'||e.name==='PUBLIC-MANIFEST.sha256')continue;const f=path.join(dir,e.name);if(e.isDirectory())walk(f);else records.push(crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')+'  '+path.relative(root,f));}}walk(root);
 write('PUBLIC-MANIFEST.sha256',records.sort().join('\n')+'\n');console.log(JSON.stringify({root,files:records.length,replaced}));
})().catch(e=>{console.error(e);process.exitCode=1;});
