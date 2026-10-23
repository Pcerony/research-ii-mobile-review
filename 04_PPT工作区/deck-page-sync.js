(()=>{
 'use strict';
 const mode=document.currentScript.dataset.mode,deck=document.getElementById('deck');if(!deck)return;
 const slides=[...deck.querySelectorAll('.slide')],current=()=>slides.findIndex(s=>s.classList.contains('is-current'));
 let reported=current();
 // Native footer, keyboard and overview navigation all update the same class.
 new MutationObserver(()=>{const slide=current();if(slide<0||slide===reported)return;reported=slide;parent.postMessage({type:mode==='review'?'review-seek-slide':'script-preview-change',slide},location.origin==='null'?'*':location.origin);}).observe(deck,{subtree:true,attributes:true,attributeFilter:['class']});
})();
