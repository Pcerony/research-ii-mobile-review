# 第32稿工作区

当前**19页正文＋2页补充，D-054**。详细页序、研究设计与结尾迭代、来源及限制见[当前交接](../00_项目管理/32_第32稿当前状态.md)。日文2064字符，中文正文300.311秒/补充36.594秒；420秒是配额而非真人实测。

## 使用

- index.html：日文正式页，可在Esc总览切中文；正文18价值页停止。
- review.html：中文音频与画面同步，正文19段；顶部补充进入2页5段。
- 発表原稿_日本語.md、演讲稿_中文审查.md：主讲稿；補足原稿_日本語.md、补充稿_中文审查.md：问答稿。
- 全屏01/13/18/19；补充DOM21四步操作q01–q04，补充DOM22隐私q05。不要按旧稿13/21页检查热图与结论。

讲稿支持直接编辑和选文批注；Slide支持选文、区域和整页意见。草稿按来源哈希存本浏览器localStorage，可导出修订MD或含edits/notes的JSON；不会直接改项目文件或重新生成音频。修改段提示音频为原稿。失配批注保留引用，不自动挂到其他文本。Esc在框选中优先取消框选。

## 源码

research-content.cjs为日中口述和时间配额；write-research-speech.cjs生成四份MD。opening-slides.cjs负责02–06，cocreation-content.cjs负责工作坊介绍与细节，method-icons.json为离线Lucide节点。

build-research-slides.cjs结合上述内容、conference/research/narrative/fullscreen样式、reference-navigation.js、heatmap-stack-content.cjs、workflow-content.cjs、slide-fragments.json、questionnaire-summary.json生成index。仍读取现有index中的原始视觉输入，不能删除后空目录重建，也不要只直接改生成HTML。

build-review.cjs读取当前稿件和index，生成review-data.js、review-audio-manifest.json及缓存WAV。review.html/css/js、review-core.js、review-slide.js负责播放、稿件编辑和Slide批注。生成版本26，旧意见按哈希隔离。

```sh
node 04_PPT工作区/write-research-speech.cjs
node 04_PPT工作区/build-research-slides.cjs
node 04_PPT工作区/build-review.cjs
```

## 适用检查

从项目根运行。浏览器测试需要playwright和Chrome，本机可设置NODE_PATH=[LOCAL_PATH_REMOVED]

```sh
node --test 04_PPT工作区/revision-v26.test.cjs 04_PPT工作区/revision-v25.test.cjs 04_PPT工作区/revision-v24.test.cjs 04_PPT工作区/revision-v23.test.cjs 04_PPT工作区/revision-v22.test.cjs 04_PPT工作区/revision-v21.test.cjs 04_PPT工作区/opening-v20.test.cjs 04_PPT工作区/opening-v18.test.cjs 04_PPT工作区/review-core.test.cjs 04_PPT工作区/review-editor.test.cjs 04_PPT工作区/review-slide.test.cjs 04_PPT工作区/fullscreen-stack.test.cjs
node 04_PPT工作区/verify-narrative.cjs
node 04_PPT工作区/verify-clean-layout.cjs
node 04_PPT工作区/verify-revision-v21.cjs
node 04_PPT工作区/verify-revision-v23.cjs
node 04_PPT工作区/verify-revision-v24.cjs
node 04_PPT工作区/verify-feedback-v25.cjs
node 04_PPT工作区/verify-revision-v26.cjs
node 04_PPT工作区/verify-review.cjs
node 04_PPT工作区/verify-fullscreen-stack.cjs
```

QA在05_输出/qa的*-v26目录；当前结果见08会话。未更新的旧固定页码脚本不代表本稿验收，不为通过删科学限定或旧基线。当前143项审查基线_第32稿.sha256，MANIFEST旧前缀问题保留。测试不等于独立学术复审通过或本人日语十分钟排练。

N9/n4、热图全记录与前10秒统计、AOI/覆盖率含义均不变。Tobii新图仅作设备类型参考，公开转载许可待核；GGJ活动图仍待作者补充。不修改只读证据或公开身份材料。
# 当前增量：第34稿

作者澄清参考内容而非颜色。18页现为灰白底/森林绿，教育文化、商业及未来VR作为应用候选，VR注明需要扩展；D-062。讲稿音频沿31稿，其他页未改。当前交接35号，QA_OUT指定clean-layout-v34和review-v34。下方第33稿配色描述仅为历史记录，已废止。

18研究价值页由`reference-value.cjs`与`conference-slides.css`生成，全屏柠檬绿，依据博士申请624报告“Beyond botanical gardens.”页；应用候选限定为讲稿已有的博物馆、美术馆、商业展示，标明尚未验证。其他页及日中稿不改，speechVersion31。运行revision-v33测试；完整布局检查仍可复用verify-layout-v32（输出目录名称是历史命名，不表示验证的是旧HTML）。详见34号当前交接。

