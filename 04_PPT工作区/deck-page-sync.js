(()=>{
 'use strict';
 const mode=document.currentScript.dataset.mode,deck=document.getElementById('deck');if(!deck)return;
 const slides=[...deck.querySelectorAll('.slide')],current=()=>slides.findIndex(s=>s.classList.contains('is-current'));
 let reported=current();
 // Parent cues already own navigation; echoing them can replay an older page.
 addEventListener('message',event=>{const d=event.data;if(event.source===parent&&d?.type===(mode==='review'?'review-cue':'script-cue')&&Number.isInteger(d.slide)&&d.slide>=0&&d.slide<slides.length)reported=d.slide;},true);
 // Native footer, keyboard and overview navigation all update the same class.
 new MutationObserver(()=>{const slide=current();if(slide<0||slide===reported)return;reported=slide;parent.postMessage({type:mode==='review'?'review-seek-slide':'script-preview-change',slide},location.origin==='null'?'*':location.origin);}).observe(deck,{subtree:true,attributes:true,attributeFilter:['class']});
})();
