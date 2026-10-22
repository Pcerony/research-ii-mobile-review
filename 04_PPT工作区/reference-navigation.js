(() => {
  const deck = document.querySelector('#deck');
  const slides = [...deck.querySelectorAll('.slide')];
  const overview = document.querySelector('#overview');
  const labels = {ja:['背景と目的','方法','実地検証','結果','結論と考察','補足'],zh:['背景与目的','方法','实地验证','结果','结论与讨论','补充']};
  const heatmap = deck.querySelector('.heatmap-explorer');
  const picks = heatmap ? [...heatmap.querySelectorAll('[data-heatmap-pick]')] : [];
  const heatCards = heatmap ? [...heatmap.querySelectorAll('[data-heatmap-card]')] : [];
  let selectedHeatmap=0,hoverTimer=null;
  function fitHeatmapCards(){
    heatCards.forEach(card=>{
      const image=card.querySelector('img'),stack=card.parentElement;
      if(!image.naturalWidth||!stack.clientHeight)return;
      const aspect=image.naturalWidth/image.naturalHeight;
      const width=Math.min(stack.clientWidth*.94,Math.max(0,stack.clientHeight-42)*aspect);
      card.style.width=`${width}px`;
      card.style.left=`${(stack.clientWidth-width)/2}px`;
      card.style.setProperty('--heatmap-aspect',aspect);
    });
  }
  heatCards.forEach(card=>card.querySelector('img').addEventListener('load',fitHeatmapCards));
  // Fullscreen expansion changes the stacks throughout the slide transition.
  let heatmapFitFrame=0;
  const heatmapResizeObserver=new ResizeObserver(()=>{
    cancelAnimationFrame(heatmapFitFrame);
    heatmapFitFrame=requestAnimationFrame(fitHeatmapCards);
  });
  heatmap?.querySelectorAll('.heatmap-stack').forEach(stack=>heatmapResizeObserver.observe(stack));
  function selectHeatmap(index) {
    selectedHeatmap=Math.max(0,Math.min(8,index));index=selectedHeatmap;
    const id = `P${String(index+1).padStart(2,'0')}`;
    picks.forEach((button,i) => {button.setAttribute('aria-pressed',String(i===index));button.classList.toggle('active',i===index);});
    heatmap.querySelector('[data-heatmap-current]').textContent=id;
    heatCards.forEach(card=>{
      const offset=Number(card.dataset.heatmapIndex)-index,distance=Math.abs(offset);
      card.classList.toggle('active',offset===0);
      card.setAttribute('aria-hidden',String(offset!==0));
      card.style.setProperty('--heat-y',`${offset*26}px`);
      card.style.setProperty('--heat-rx',`${offset*-2.2}deg`);
      card.style.setProperty('--heat-scale',String(Math.max(.72,1-distance*.055)));
      card.style.setProperty('--heat-opacity',distance<=4?String(offset===0?1:Math.max(.12,.5-distance*.075)):'0');
      card.style.zIndex=String(100-distance);
    });
  }
  picks.forEach((button,index) => {
    button.onclick=()=>selectHeatmap(index);
    button.onpointerenter=event=>{if(event.pointerType==='touch')return;clearTimeout(hoverTimer);hoverTimer=setTimeout(()=>selectHeatmap(index),120);};
    button.onpointerleave=()=>clearTimeout(hoverTimer);
    button.onfocus=()=>selectHeatmap(index);
    button.onkeydown=event=>{
      if(['Enter',' '].includes(event.key)){event.preventDefault();event.stopPropagation();selectHeatmap(index);return;}
      if(!['ArrowUp','ArrowDown'].includes(event.key))return;
      event.preventDefault();event.stopPropagation();
      picks[(index+(event.key==='ArrowDown'?1:8))%9].focus();
    };
  });
  if(heatmap){selectHeatmap(0);heatmap.addEventListener('keydown',event=>{
    if(!['ArrowUp','ArrowDown'].includes(event.key)||event.target.closest('[data-heatmap-pick]'))return;
    event.preventDefault();event.stopPropagation();selectHeatmap((selectedHeatmap+(event.key==='ArrowDown'?1:8))%9);
  });}
  const workflow = deck.querySelector('.operating-panorama');
  const workflowTabs = workflow ? [...workflow.querySelectorAll('[data-workflow-step]')] : [];
  const workflowPanels = workflow ? [...workflow.querySelectorAll('[data-workflow-panel]')] : [];
  function selectWorkflow(index) {
    workflowTabs.forEach((tab,i)=>{
      tab.setAttribute('aria-selected',String(i===index));
      tab.tabIndex=i===index?0:-1;
    });
    workflowPanels.forEach((panel,i)=>panel.hidden=i!==index);
  }
  workflowTabs.forEach((tab,index)=>{
    tab.onclick=()=>selectWorkflow(index);
    tab.onkeydown=event=>{
      if(['Enter',' '].includes(event.key)){
        event.preventDefault();event.stopPropagation();selectWorkflow(index);return;
      }
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
      event.preventDefault();event.stopPropagation();
      const next=event.key==='Home'?0:event.key==='End'?workflowTabs.length-1:(index+(event.key==='ArrowRight'?1:workflowTabs.length-1))%workflowTabs.length;
      selectWorkflow(next);workflowTabs[next].focus();
    };
  });
  const coTabs=[...deck.querySelectorAll('[data-cocreation-step]:not(:disabled)')];
  const coPanels=[...deck.querySelectorAll('[data-cocreation-panel]')];
  const coProcess=[...deck.querySelectorAll('[data-cocreation-key]')];
  const coGroup=tab=>String(tab?.dataset.cocreationStep??'');
  const coScope=deck.querySelector('.research-scope');
  const coOwners=coScope?.querySelector('.co-research-spans');
  const coRail=coScope?.querySelector('.co-process-wrap');
  let coAnimations=[];
  function animateCocreation(previousTop){
    if(!coScope||!coRail||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const scale=coScope.getBoundingClientRect().width/coScope.offsetWidth;
    const delta=(previousTop-coRail.getBoundingClientRect().top)/scale;
    const options={duration:540,easing:'cubic-bezier(.22,.68,.22,1)'};
    if(Math.abs(delta)>1)coAnimations.push(coRail.animate([{transform:`translateY(${delta}px)`},{transform:'translateY(0)'}],options));
    const panel=coPanels.find(p=>!p.hidden);
    if(panel)coAnimations.push(panel.animate([{opacity:0,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}],{...options,delay:90,fill:'backwards'}));
    if(coOwners&&!coOwners.hidden)coAnimations.push(coOwners.animate([{opacity:0},{opacity:1}],{...options,duration:360,delay:100,fill:'backwards'}));
  }
  function selectCocreation(group,selected=coTabs.find(tab=>coGroup(tab)===String(group))){
    coAnimations.forEach(animation=>animation.cancel());coAnimations=[];
    const previousTop=coRail?.getBoundingClientRect().top;
    const intro=group==='intro';
    coScope?.classList.toggle('is-detail',!intro);
    if(coOwners){
      coOwners.hidden=intro;
      coOwners.querySelector('.co-owner-i')?.classList.toggle('is-active',String(group)==='0');
      coOwners.querySelector('.co-owner-ii')?.classList.toggle('is-active',String(group)==='2');
    }
    coTabs.forEach((tab,i)=>{
      const active=!intro&&tab===selected;
      tab.setAttribute('aria-selected',String(active));
      tab.tabIndex=(intro?i===0:active)?0:-1;
    });
    coProcess.forEach(step=>{
      const active=!intro&&(step===selected||(String(group)==='0'&&coGroup(step)==='0'));
      step.classList.toggle('is-active',active);
      step.classList.toggle('is-muted',intro);
      step.setAttribute('aria-current',!intro&&step===selected?'step':'false');
    });
    coPanels.forEach(panel=>panel.hidden=panel.dataset.cocreationPanel!==(intro?'intro':String(group)));
    if(Number.isFinite(previousTop))animateCocreation(previousTop);
  }
  window.__showCocreationIntro=()=>selectCocreation('intro');
  const toggleCocreation=tab=>selectCocreation(tab.getAttribute('aria-selected')==='true'?'intro':coGroup(tab),tab);
  coTabs.forEach((tab,index)=>{
    tab.onclick=()=>toggleCocreation(tab);
    tab.onkeydown=event=>{
      if(['Enter',' '].includes(event.key)){event.preventDefault();event.stopPropagation();toggleCocreation(tab);return;}
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
      event.preventDefault();event.stopPropagation();
      const next=event.key==='Home'?0:event.key==='End'?coTabs.length-1:(index+(event.key==='ArrowRight'?1:coTabs.length-1))%coTabs.length;
      selectCocreation(coGroup(coTabs[next]),coTabs[next]);coTabs[next].focus();
    };
  });
  const gazeToggle=deck.querySelector('[data-gaze-toggle]');
  const gazeStatus=deck.querySelector('[data-gaze-status]');
  if(gazeToggle&&gazeStatus){
    gazeToggle.onclick=()=>{
      const open=gazeToggle.getAttribute('aria-expanded')!=='true';
      gazeToggle.setAttribute('aria-expanded',String(open));
      gazeStatus.hidden=!open;
      const mark=gazeToggle.querySelector('.method-reveal-mark');
      if(mark)mark.textContent=open?'−':'＋';
    };
  }
  let lang = new URLSearchParams(location.search).get('lang') === 'zh' ? 'zh' : 'ja';
  let supplementMode = new URLSearchParams(location.search).get('scope')==='supplement';
  let current = supplementMode?slides.findIndex(s=>s.dataset.supplement==='true'):0;
  let lastMain = 0;
  const visibleIndices = () => slides.map((s,i)=>({i,supplement:s.dataset.supplement==='true'})).filter(s=>s.supplement===supplementMode).map(s=>s.i);
  let geometry = {renderedWidth:1200,gap:28};
  function positionTitleLines(){
    slides.forEach(slide=>{
      const title=slide.querySelector('h2.slide-title');if(!title)return;
      const card=slide.querySelector('.canvas-card'),style=getComputedStyle(card),font=parseFloat(getComputedStyle(title).fontSize);
      const width=1200-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight),compact=slide.dataset.fullscreen==='true'?20:22,scale=compact/font;
      title.querySelectorAll('[data-title-line]').forEach((line,i)=>{
        line.style.setProperty('--peek-x',`${width-line.offsetWidth*scale-line.offsetLeft}px`);
        line.style.setProperty('--peek-y',`${i*compact*1.3-line.offsetTop}px`);
        line.style.setProperty('--peek-scale',scale);
      });
    });
  }
  function layoutTitleLines(){
    const ctx=document.createElement('canvas').getContext('2d');
    slides.forEach(slide=>{
      const title=slide.querySelector('h2.slide-title');if(!title)return;
      const text=title.dataset[lang],style=getComputedStyle(title),compact=slide.dataset.fullscreen==='true'?20:22,limit=slide.dataset.fullscreen==='true'?144:168;
      ctx.font=`${style.fontWeight} ${compact}px ${style.fontFamily}`;
      const words=[];
      for(const {segment}of new Intl.Segmenter(lang,{granularity:'word'}).segment(text)){
        if(/^\s+$/.test(segment)&&words.length)words[words.length-1]+=segment;else words.push(segment);
      }
      function split(tokens){
        const memo=new Map();
        function visit(start,left){
          if(start===tokens.length)return {cost:0,lines:[]};if(!left)return null;
          const key=start+':'+left;if(memo.has(key))return memo.get(key);let best=null,part='';
          for(let end=start;end<tokens.length;end++){
            part+=tokens[end];const width=ctx.measureText(part).width;if(width>limit)break;
            const rest=visit(end+1,left-1);if(!rest)continue;
            const cost=(limit-width)**2+rest.cost+(/^[、。，：」』）]/.test(part)?10000:0);
            if(!best||cost<best.cost)best={cost,lines:[part,...rest.lines]};
          }
          memo.set(key,best);return best;
        }
        return visit(0,3)?.lines;
      }
      const lines=split(words)||split([...new Intl.Segmenter(lang,{granularity:'grapheme'}).segment(text)].map(x=>x.segment))||[text];
      title.replaceChildren(...lines.map(text=>{const line=document.createElement('span');line.className='title-line';line.dataset.titleLine='';line.textContent=text;return line;}));
    });
    positionTitleLines();
  }
  slides.forEach((slide,index) => {
    const shell = document.createElement('div');
    shell.className = 'slide-shell';
    if(slide.dataset.fullscreen==='true')shell.dataset.fullscreen='true';
    slide.before(shell);
    shell.append(slide);
    shell.onclick = () => {if(index !== current) go(index);};
  });
  function positionDeck() {
    // Use target geometry, not in-flight flex widths, to keep both animations aligned.
    const width=slides[current].dataset.fullscreen==='true'?innerWidth:geometry.renderedWidth;
    const position=visibleIndices().indexOf(current);
    const x = (innerWidth - width) / 2 - position * (geometry.renderedWidth + geometry.gap);
    deck.style.transform = `translate3d(${x}px,0,0)`;
  }
  function resize() {
    const indicatorBottom = document.querySelector('#presentation-indicator').getBoundingClientRect().bottom;
    const margin = Math.max(64, Math.round(indicatorBottom + 20));
    const maxHeight = Math.max(120, innerHeight - 2 * margin);
    const ratio = innerWidth <= 600 ? .90 : innerWidth <= 900 ? .74 : .70;
    const scale = Math.min(innerWidth * ratio / 1200, maxHeight / 900, 1);
    geometry = {renderedWidth:1200 * scale, gap:Math.max(16, Math.min(28, innerWidth * .018))};
    const root = document.documentElement.style;
    root.setProperty('--slide-scale', scale);
    root.setProperty('--slide-render-width', `${1200 * scale}px`);
    root.setProperty('--slide-render-height', `${900 * scale}px`);
    root.setProperty('--slide-gap', `${geometry.gap}px`);
    const fullScale=Math.min(innerWidth/1200,innerHeight/900);
    root.setProperty('--full-scale',fullScale);
    root.setProperty('--full-width',`${innerWidth/fullScale}px`);
    root.setProperty('--full-height',`${innerHeight/fullScale}px`);
    deck.style.top = '0px';
    positionTitleLines();
    positionDeck();
    fitHeatmapCards();
  }
  function update() {
    document.body.classList.toggle('full-bleed',slides[current].dataset.fullscreen==='true');
    document.body.classList.toggle('cover-screen',current===0);
    const visible=visibleIndices(),position=visible.indexOf(current);
    slides.forEach((slide, i) => {
      slide.parentElement.hidden=!visible.includes(i);
      slide.classList.toggle('is-past',i<current);
      for (const [name,on] of [['is-current',i === current],['is-prev',i === visible[position-1]],['is-next',i === visible[position+1]]]) {
        slide.classList.toggle(name,on);
        slide.parentElement.classList.toggle(name,on);
      }
      slide.setAttribute('aria-hidden', String(i !== current));
      slide.inert = i !== current;
    });
    document.querySelector('#indicator-page').textContent = `${String(position + 1).padStart(2,'0')} / ${visible.length}`;
    document.querySelectorAll('.chapter-dot').forEach(button => button.classList.toggle('is-active', Number(button.dataset.index) === current));
    document.querySelectorAll('.chapter-label').forEach(node => node.classList.toggle('is-active', node.dataset.chapter === slides[current].dataset.chapter));
    positionDeck();
  }
  function go(index) {
    current=Math.max(0,Math.min(slides.length-1,index));
    const nextMode=slides[current].dataset.supplement==='true';
    if(!nextMode)lastMain=current;
    if(nextMode!==supplementMode){supplementMode=nextMode;translate();return;}
    update();
  }
  function advance(delta){const v=visibleIndices(),position=v.indexOf(current);go(v[Math.max(0,Math.min(v.length-1,position+delta))]);}
  const previewObserver = new ResizeObserver(entries => entries.forEach(({target,contentRect}) => {
    target.querySelector('.slide').style.transform = `scale(${contentRect.width / 1200})`;
  }));
  function translate() {
    document.documentElement.lang = lang === 'ja' ? 'ja' : 'zh-CN';
    document.documentElement.dataset.lang = lang;
    document.body.classList.toggle('lang-zh',lang === 'zh');
    document.querySelectorAll('[data-ja][data-zh]').forEach(node => node.textContent = node.dataset[lang]);
    layoutTitleLines();
    document.querySelectorAll('[data-language]').forEach(button => button.classList.toggle('active',button.dataset.language === lang));
    const timeline = document.querySelector('#indicator-timeline-chapters');
    timeline.replaceChildren();
    labels[lang].forEach((label,i) => {
      if(!visibleIndices().some(index=>Number(slides[index].dataset.chapter)===i+1))return;
      const group = document.createElement('div'); group.className = 'timeline-chapter-group';
      const dots = document.createElement('div'); dots.className = 'chapter-dots';
      slides.forEach((slide,index) => {
        if(!visibleIndices().includes(index))return;
        if (Number(slide.dataset.chapter) !== i + 1) return;
        const dot = document.createElement('button'); dot.className = 'chapter-dot';dot.dataset.index = index;
        dot.title = `${index + 1} · ${slide.dataset[lang === 'ja' ? 'titleJa' : 'titleZh']}`;
        dot.setAttribute('aria-label',dot.title);dot.onclick = () => go(index);dots.append(dot);
      });
      const title = document.createElement('span');title.className = 'chapter-label';title.dataset.chapter = i + 1;title.textContent = label;
      group.append(dots,title);timeline.append(group);
    });
    const grid = document.querySelector('#overview-grid');previewObserver.disconnect();grid.replaceChildren();
    slides.forEach((slide,index) => {
      if(!visibleIndices().includes(index))return;
      const card = document.createElement('button');card.className = 'overview-card';card.dataset.slideIndex=index;
      const number = document.createElement('b');number.textContent = String(index + 1).padStart(2,'0');
      const title = document.createElement('span');title.textContent = slide.dataset[lang === 'ja' ? 'titleJa' : 'titleZh'];
      const thumb = document.createElement('div');thumb.className = 'overview-thumb';
      const preview = document.createElement('div');preview.className = slide.className;
      preview.classList.remove('is-current','is-prev','is-next','is-past');
      for(const [key,value] of Object.entries(slide.dataset)) preview.dataset[key] = value;
      preview.append(slide.querySelector('.canvas-card').cloneNode(true));
      const field = slide.querySelector('[data-heatfield]'), copy = preview.querySelector('[data-heatfield]');
      if(field && copy){copy.width=field.width;copy.height=field.height;copy.getContext('2d').drawImage(field,0,0);}
      preview.querySelectorAll('[id]').forEach(node=>node.removeAttribute('id'));
      preview.inert = true;thumb.append(preview);
      const caption = document.createElement('div');caption.className = 'overview-caption';caption.append(number,title);
      card.append(thumb,caption);card.onclick = () => {go(index);overview.close();};grid.append(card);previewObserver.observe(thumb);
    });
    update();resize();
  }
  document.querySelector('#next').onclick = () => advance(1);
  document.querySelector('#prev').onclick = () => advance(-1);
  function toggleOverview(){if(overview.open)overview.close();else overview.showModal();}
  window.__toggleOverview=toggleOverview;
  document.querySelector('#overview-toggle').onclick = toggleOverview;
  document.querySelector('#overview-close').onclick = () => overview.close();
  document.querySelectorAll('[data-language]').forEach(button => button.onclick = () => {lang = button.dataset.language;translate();});
  document.addEventListener('keydown',event => {
    if(event.key==='Escape'){event.preventDefault();toggleOverview();return;}
    if (overview.open || event.target.closest('input,textarea,[contenteditable]')) return;
    if (['ArrowRight','PageDown',' '].includes(event.key)) {event.preventDefault();advance(1);}
    if (['ArrowLeft','PageUp'].includes(event.key)) {event.preventDefault();advance(-1);}
    if (event.key === 'Home') go(visibleIndices()[0]);
    if (event.key === 'End') go(visibleIndices().at(-1));
  });
  let lastWheel = 0;
  addEventListener('wheel',event => {
    if (overview.open || Math.abs(event.deltaY) < 12 || performance.now() - lastWheel < 650) return;
    lastWheel = performance.now();advance(Math.sign(event.deltaY));
  },{passive:true});
  let touchX = null;
  deck.addEventListener('touchstart',event => {touchX = event.touches[0].clientX;},{passive:true});
  deck.addEventListener('touchend',event => {
    if (touchX === null) return;
    const delta = touchX - event.changedTouches[0].clientX;
    if (Math.abs(delta) > 50) advance(Math.sign(delta));touchX = null;
  },{passive:true});
  addEventListener('resize',resize);
  window.__goSlide = go;
  translate();
  document.fonts.ready.then(()=>{layoutTitleLines();resize();});
})();
