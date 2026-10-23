(function(root){
  'use strict';
  function history(limit=100){return {past:[],future:[],limit};}
  function record(h,before,after,kind,time=Date.now()){
    if(before.text===after.text)return;
    const last=h.past.at(-1),group=/^(insertText|deleteContentBackward|deleteContentForward)$/.test(kind);
    if(group&&!h.future.length&&last&&last.kind===kind&&time-last.time<800&&last.after.text===before.text&&last.after.start===before.start&&last.after.end===before.end){last.after={...after};last.time=time;}
    else h.past.push({before:{...before},after:{...after},kind,time});
    if(h.past.length>h.limit)h.past.shift();h.future=[];
  }
  function undo(h){const step=h.past.pop();if(!step)return null;h.future.push(step);return {...step.before};}
  function redo(h){const step=h.future.pop();if(!step)return null;h.past.push({...step,time:-Infinity});return {...step.after};}
  // Curated presentation terms only. Unknown words remain unannotated.
  const lexicon={
    '非接触型':'ヒセッショクガタ','非装着型':'ヒソウチャクガタ','視線追跡':'シセンツイセキ','視線計測':'シセンケイソク','視線推定':'シセンスイテイ',
    '透視変換行列':'トウシヘンカンギョウレツ','透視変換':'トウシヘンカン','文字被覆率':'モジヒフクリツ','熱強度':'ネツキョウド','共創':'キョウソウ',
    '解説':'カイセツ','植物園':'ショクブツエン','非装着':'ヒソウチャク','装着':'ソウチャク','非接触':'ヒセッショク','視線':'シセン','計測':'ケイソク',
    '推定値':'スイテイチ','推定':'スイテイ','校正':'コウセイ','座標':'ザヒョウ','対応づけ':'タイオウヅケ','四隅':'ヨスミ','行列':'ギョウレツ',
    '原型':'ゲンケイ','改良':'カイリョウ','従来':'ジュウライ','課題抽出':'カダイチュウシュツ','現地調査':'ゲンチチョウサ','定量的':'テイリョウテキ',
    '実環境':'ジツカンキョウ','実物':'ジツブツ','実地':'ジッチ','紙面':'シメン','標識':'ヒョウシキ','熱図':'ネツズ','領域':'リョウイキ',
    '被覆':'ヒフク','割合':'ワリアイ','上昇':'ジョウショウ','低下':'テイカ','停留時間':'テイリュウジカン','理解度':'リカイド','精度':'セイド',
    '検証':'ケンショウ','追跡中断':'ツイセキチュウダン','追跡':'ツイセキ','高齢者':'コウレイシャ','欠落':'ケツラク','誤差':'ゴサ',
    '匿名':'トクメイ','集計':'シュウケイ','保存方針':'ホゾンホウシン','負担':'フタン','適合':'テキゴウ','費用':'ヒヨウ','機種':'キシュ',
    '温室':'オンシツ','累計':'ルイケイ','福岡市':'フクオカシ','応用候補':'オウヨウコウホ','基礎情報':'キソジョウホウ','聴講':'チョウコウ','清聴':'セイチョウ',
    '眼鏡型':'メガネガタ','追従':'ツイジュウ','機器':'キキ','観察':'カンサツ','分析':'ブンセキ','条件差':'ジョウケンサ','個人差':'コジンサ','検討':'ケントウ',
    '定量':'テイリョウ','質疑応答':'シツギオウトウ','記憶':'キオク','調整':'チョウセイ','配置':'ハイチ','実装':'ジッソウ','検査':'ケンサ'
  };
  const terms=Object.keys(lexicon).sort((a,b)=>b.length-a.length);
  function readings(text){
    const result=[];let plain='';
    for(let i=0;i<text.length;){const word=terms.find(term=>text.startsWith(term,i));
      if(word){if(plain){result.push({text:plain});plain='';}result.push({text:word,reading:lexicon[word]});i+=word.length;}
      else plain+=text[i++];
    }
    if(plain)result.push({text:plain});return result;
  }
  const api={history,record,undo,redo,readings};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.ScriptEditorTools=api;
})(typeof window==='undefined'?globalThis:window);
