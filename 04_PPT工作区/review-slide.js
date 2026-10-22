(() => {
  'use strict';
  window.createSlideReview=({frame,core,getContext,getLanguage,pause,openForm,setStatus})=>{
    let doc,win,highlights,selection=null,regionMode=false,drag=null,captureLayer=null,target=null,request=0;
    const textButton=document.getElementById('annotate-slide-text'),regionButton=document.getElementById('annotate-slide-region');
    const currentSlide=()=>doc?.querySelector('#deck .slide.is-current');
    function state(){
      const slide=currentSlide(),intro=slide?.querySelector('[data-cocreation-intro][aria-pressed="true"]')||slide?.querySelector('[data-cocreation-panel="intro"]:not([hidden])'),selected=slide?.querySelector('[data-cocreation-step][aria-selected="true"]');
      return {heatmap:slide?.querySelector('[data-heatmap-current]')?.textContent||null,workflow:slide?.querySelector('[data-workflow-step][aria-selected="true"]')?.dataset.workflowStep??null,cocreation:intro?'intro':selected?.dataset.cocreationKey??selected?.dataset.cocreationStep??null,gaze:slide?.querySelector('[data-gaze-toggle]')?.getAttribute('aria-expanded')==='true'};
    }
    function context(type){
      const slide=currentSlide(),r=slide.getBoundingClientRect();
      return {...getContext(),target:{type,slideIndex:Number(slide.dataset.index),language:doc.documentElement.dataset.lang||getLanguage(),state:state(),aspectRatio:r.width/r.height,sourceSize:{width:slide.offsetWidth,height:slide.offsetHeight}}};
    }
    function clearSelection(){selection=null;textButton.disabled=true;}
    function clearTarget(){request++;target=null;highlights?.replaceChildren();}
    function cancelRegion(){
      const was=regionMode;regionMode=false;drag=null;captureLayer?.remove();captureLayer=null;regionButton.setAttribute('aria-pressed','false');regionButton.lastChild.textContent=' 框选区域';
      if(was&&!target)doc?.documentElement.classList.remove('slide-annotation-active');
      if(was)setStatus('');return was;
    }
    function reset(){cancelRegion();clearSelection();clearTarget();doc?.documentElement.classList.remove('slide-annotation-active');win?.getSelection()?.removeAllRanges();setStatus('');}
    function rangeFor(el,anchor){
      const found=core.resolveAnchor(el.textContent,anchor);if(!found)return null;
      const walker=doc.createTreeWalker(el,win.NodeFilter.SHOW_TEXT);let n,offset=0,start,end;
      while(n=walker.nextNode()){
        if(!start&&found.start<offset+n.length)start=[n,found.start-offset];
        if(found.end<=offset+n.length){end=[n,found.end-offset];break;}offset+=n.length;
      }
      if(!start||!end)return null;const r=doc.createRange();r.setStart(...start);r.setEnd(...end);return r;
    }
    function box(rect,type){
      const el=doc.createElement('div');el.dataset.slideReviewHighlight=type;el.className='slide-review-box '+type;
      Object.assign(el.style,{left:rect.left+'px',top:rect.top+'px',width:rect.width+'px',height:rect.height+'px'});highlights.append(el);
    }
    function textRects(range){
      const root=range.commonAncestorContainer,nodes=[];
      if(root.nodeType===win.Node.TEXT_NODE)nodes.push(root);
      else{const walker=doc.createTreeWalker(root,win.NodeFilter.SHOW_TEXT);let n;while(n=walker.nextNode())if(range.intersectsNode(n))nodes.push(n);}
      return nodes.flatMap(n=>{
        const r=doc.createRange();r.setStart(n,n===range.startContainer?range.startOffset:0);r.setEnd(n,n===range.endContainer?range.endOffset:n.length);return [...r.getClientRects()];
      });
    }
    function draw(){
      if(regionMode)return;
      highlights?.replaceChildren();if(!target||!doc)return;
      const slide=currentSlide();if(!slide||Number(slide.dataset.index)!==target.slideIndex||doc.documentElement.dataset.lang!==target.language)return;
      const r=slide.getBoundingClientRect();
      if(target.type==='slide-text'){
        let el=slide;for(const i of target.path)el=el?.children[i];
        const range=el&&rangeFor(el,target.anchor);
        if(!range){setStatus('选文已无法定位，保留原文引用');return;}
        for(const b of textRects(range))if(b.width&&b.height)box(b,target.type);
      }else{
        const n=target.type==='slide-page'?{x:0,y:0,width:1,height:1}:target.rect;
        box({left:r.left+n.x*r.width,top:r.top+n.y*r.height,width:n.width*r.width,height:n.height*r.height},target.type);
      }
      const changed=target.aspectRatio&&Math.abs((r.width/r.height)/target.aspectRatio-1)>.05;
      setStatus(changed?'画面比例已变化，区域按比例显示，请核对原始位置':'已定位Slide批注');
    }
    function showTarget(next){
      cancelRegion();clearSelection();clearTarget();if(!core.validSlideTarget(next))return;
      doc?.documentElement.classList.add('slide-annotation-active');win?.getSelection()?.removeAllRanges();target=next;const ticket=request,started=performance.now();
      function wait(){
        if(ticket!==request)return;const slide=currentSlide();
        if(slide&&Number(slide.dataset.index)===next.slideIndex&&doc.documentElement.dataset.lang===next.language){
          const heat=next.state?.heatmap,step=next.state?.workflow,co=next.state?.cocreation;
          if(co==='intro')doc.defaultView?.__showCocreationIntro?.();
          if(co!=null&&Number.isInteger(Number(co))&&Number(co)>=0&&Number(co)<5){
            const target=slide.querySelector(`[data-cocreation-key="${Number(co)}"]`);
            if(target?.getAttribute('aria-selected')!=='true')target?.click();
          }
          if(/^P0[1-9]$/.test(heat||''))slide.querySelector(`[data-heatmap-pick="${Number(heat.slice(1))-1}"]`)?.click();
          if(step!=null&&Number.isInteger(Number(step))&&Number(step)>=0&&Number(step)<4)slide.querySelector(`[data-workflow-step="${Number(step)}"]`)?.click();
          const gaze=slide.querySelector('[data-gaze-toggle]');
          if(gaze&&next.state?.gaze!=null&&String(gaze.getAttribute('aria-expanded')==='true')!==String(next.state.gaze))gaze.click();
          draw();return;
        }
        if(performance.now()-started<2000)requestAnimationFrame(wait);else setStatus('未能定位原Slide，请重新点击意见位置');
      }
      requestAnimationFrame(wait);
    }
    function selectText(){
      clearSelection();if(regionMode||!doc)return;
      const s=win.getSelection();if(!s?.rangeCount||s.isCollapsed)return;const range=s.getRangeAt(0),slide=currentSlide();
      if(!slide?.contains(range.startContainer)||!slide.contains(range.endContainer)||!range.toString().trim())return;
      let el=range.commonAncestorContainer;if(el.nodeType===win.Node.TEXT_NODE)el=el.parentElement;
      if(el.closest('button,nav'))return;
      const before=range.cloneRange();before.selectNodeContents(el);before.setEnd(range.startContainer,range.startOffset);
      const start=before.toString().length,end=start+range.toString().length,path=[];
      let node=el;while(node!==slide){path.unshift([...node.parentElement.children].indexOf(node));node=node.parentElement;}
      const c=context('slide-text');c.target.path=path;c.target.anchor=core.createAnchor(el.textContent,start,end);
      selection=c;textButton.disabled=false;pause();doc.documentElement.classList.add('slide-annotation-active');setStatus('已选择Slide文字');
    }
    function startRegion(){
      if(regionMode){cancelRegion();return;}if(!currentSlide())return;
      pause();clearSelection();clearTarget();regionMode=true;doc.documentElement.classList.add('slide-annotation-active');regionButton.setAttribute('aria-pressed','true');regionButton.lastChild.textContent=' 取消框选';setStatus('单指拖动框选');
      captureLayer=doc.createElement('div');captureLayer.className='slide-review-capture';captureLayer.tabIndex=0;captureLayer.setAttribute('aria-label','Slide区域框选');doc.body.append(captureLayer);captureLayer.focus();
      captureLayer.onpointerdown=e=>{
        if(e.button!==0||e.isPrimary===false||drag)return;const slide=currentSlide(),r=slide.getBoundingClientRect();
        if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)return;
        drag={pointerId:e.pointerId,start:{x:e.clientX,y:e.clientY},bounds:r,context:context('slide-region')};captureLayer.setPointerCapture(e.pointerId);e.preventDefault();
      };
      captureLayer.onpointermove=e=>{
        if(!drag||e.pointerId!==drag.pointerId)return;highlights.replaceChildren();const n=core.normalizeSlideRect(drag.bounds,drag.start,{x:e.clientX,y:e.clientY}),r=drag.bounds;
        box({left:r.left+n.x*r.width,top:r.top+n.y*r.height,width:n.width*r.width,height:n.height*r.height},'slide-region');
      };
      captureLayer.onpointerup=e=>{
        if(!drag||e.pointerId!==drag.pointerId)return;const d=drag,rect=core.normalizeSlideRect(d.bounds,d.start,{x:e.clientX,y:e.clientY});cancelRegion();
        if(rect.width*d.bounds.width<8||rect.height*d.bounds.height<8){highlights.replaceChildren();setStatus('框选范围太小，请重新框选');return;}
        d.context.target.rect=rect;showTarget(d.context.target);openForm(d.context);
      };
      captureLayer.onpointercancel=()=>{cancelRegion();highlights.replaceChildren();};
    }
    function install(){
      doc=frame.contentDocument;win=frame.contentWindow;reset();
      const style=doc.createElement('style');style.textContent=`#deck .slide.is-current{user-select:text!important}.slide-annotation-active #deck .title-line,.slide-annotation-active #deck .chapter{transition:none!important}.slide-review-highlights{position:fixed;inset:0;z-index:99999;pointer-events:none}.slide-review-box{position:absolute;box-sizing:border-box;pointer-events:none}.slide-review-box.slide-region,.slide-review-box.slide-page{border:2px solid #ba791e;background:#eebc4b15;box-shadow:0 0 0 1px #fff8 inset}.slide-review-box.slide-text{background:#f4c75a55;border-bottom:2px solid #ba791e}.slide-review-capture{position:fixed;inset:0;z-index:100000;cursor:crosshair;touch-action:none;outline:none}`;doc.head.append(style);
      highlights=doc.createElement('div');highlights.className='slide-review-highlights';highlights.setAttribute('aria-hidden','true');doc.body.append(highlights);
      doc.addEventListener('selectionchange',selectText);doc.addEventListener('transitionend',draw);win.addEventListener('resize',()=>{if(regionMode){cancelRegion();highlights.replaceChildren();}requestAnimationFrame(draw);});
      win.__slideReviewCancel=()=>{if(!regionMode)return false;cancelRegion();highlights.replaceChildren();return true;};
    }
    frame.addEventListener('load',install);
    textButton.onpointerdown=e=>e.preventDefault();textButton.onclick=()=>{if(!selection)return;const c=selection;showTarget(c.target);openForm(c);};
    regionButton.onclick=startRegion;
    document.getElementById('annotate-slide-page').onclick=()=>{if(!currentSlide())return;pause();reset();const c=context('slide-page');showTarget(c.target);openForm(c);};
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&regionMode){e.preventDefault();cancelRegion();highlights?.replaceChildren();}});
    return {reset,showTarget};
  };
})();
