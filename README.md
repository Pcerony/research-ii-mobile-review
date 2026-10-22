# 研究Ⅱ：手机离线审查 / 第37稿

[打开手机审查器](https://pcerony.github.io/research-ii-mobile-review/04_PPT工作区/review.html)

19页正文＋2页补充。中日讲稿与中文音频采用第37稿，非日语实测时长。公开版部分图片以占位替换；完整原件仅保留于作者本地，详见PUBLIC-ARCHIVE.json。本仓库不是原始参与者数据开放库，不保证第三方素材可再次分发。

## 竖屏讲稿编辑

[打开讲稿编辑](https://pcerony.github.io/research-ii-mobile-review/04_PPT工作区/script.html)。顶部小幅Slide预览，下方直接编辑当前页讲稿，无批注或音频控件。默认日文，中文可切换；两语言独立保存，中文与原审查器共用草稿。输入自动存本机，保存图标再次落盘；文件下载图标导出完整Markdown，下载箭头导出JSON修改文件，分享图标尝试系统分享两份文件。将JSON或完整MD交回Codex即可落实到正式稿；不会自动改写原稿或上传云端。JSON带源哈希、语言、页/段ID和原文/修订文，同稿可导入，冲突先确认。旧v2意见文件仍在原审查器导入。先联网重新下载本版离线包（80项），再飞行模式刷新。讲稿页可单独添加主屏幕，使用竖屏manifest；退出旧横屏锁定应用后重新进入可切换方向。

## 手机离线

先联网在Safari/Chrome打开审查器，建议添加到主屏幕后从主屏幕再次打开。点工具栏下载箭头，等状态显示“离线已就绪”；再以飞行模式刷新确认。横屏画面优先，右上菜单打开讲稿/意见。点框选区域，单指拖动；再次点同一按钮取消。输入后点保存意见。本机保存不等于云端保存；系统清理站点数据会丢失本机内容。意见栏向上箭头用于系统分享，向下箭头下载JSON，另一上箭头导入JSON。每次结束请导出文件。

公开版与本地版素材有差异，但deckHash沿本地布局基线，便于意见回交。不要将占位图片的细节意见当作原图问题。意见文件不自动上传GitHub。将导出的JSON交给Codex即可作为后续修改输入，本轮未接入自动云端改稿。

## 构建与测试

需Node.js；浏览器QA需Playwright、Chrome，公开包再生成需sharp。

```sh
node 04_PPT工作区/build-research-slides.cjs
node 04_PPT工作区/build-review.cjs
node 04_PPT工作区/build-offline.cjs
node --test 04_PPT工作区/review-core.test.cjs 04_PPT工作区/review-editor.test.cjs 04_PPT工作区/review-slide.test.cjs 04_PPT工作区/review-mobile.test.cjs
python3 -m http.server 8765 --bind 127.0.0.1
# 另一终端
node 04_PPT工作区/verify-mobile.cjs
```

现有音频已包含，无需macOS TTS重新生成。公开原稿部分来源是历史口径，采用顺序以01_研究口径与编号决议、02_证据账本及第37稿当前状态为准。原始热图重裁脚本依赖未公开原件，不能在公开包内重裁；当前18张匿名预览可直接使用。
