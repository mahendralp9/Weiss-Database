const MAX_DISTANCE=2;
const MAX_PREFIX_OCR_DISTANCE=2.2;
const MAX_SUFFIX_OCR_DISTANCE=1.5;
const MAX_OCR_DISTANCE=3.5;
let codeBuckets=new Map(),codeByKey=new Map(),codePrefixBuckets=new Map();

function normalizeCode(value){
 return String(value||'').toUpperCase().replace(/[^A-Z0-9]/g,'').replace(/O/g,'0').replace(/I/g,'1');
}

function distanceAtMost(a,b,limit){
 if(Math.abs(a.length-b.length)>limit)return limit+1;
 let previous=new Uint8Array(b.length+1),current=new Uint8Array(b.length+1);
 for(let j=0;j<=b.length;j++)previous[j]=j;
 for(let i=1;i<=a.length;i++){
  current.fill(limit+1);current[0]=i;
  const start=Math.max(1,i-limit),end=Math.min(b.length,i+limit);let rowMin=limit+1;
  for(let j=start;j<=end;j++){
   const value=Math.min(previous[j]+1,current[j-1]+1,previous[j-1]+(a[i-1]===b[j-1]?0:1));
   current[j]=value;if(value<rowMin)rowMin=value;
  }
  if(rowMin>limit)return limit+1;
  [previous,current]=[current,previous];
 }
 return previous[b.length];
}

function substitutionCost(a,b){
 if(a===b)return 0;
 if(
  (a==='0'&&b==='O')||(a==='O'&&b==='0')||
  (a==='1'&&'IL'.includes(b))||('IL'.includes(a)&&b==='1')||
  (a==='5'&&b==='S')||(a==='S'&&b==='5')||
  (a==='8'&&b==='B')||(a==='B'&&b==='8')||
  (a==='2'&&b==='Z')||(a==='Z'&&b==='2')||
  (a==='4'&&b==='S')||(a==='S'&&b==='4')||
  (a==='0'&&b==='U')||(a==='U'&&b==='0')||
  (a==='G'&&b==='O')||(a==='O'&&b==='G')||
  (a==='O'&&b==='L')||(a==='L'&&b==='O')
 )return .35;
 return 1;
}

function fuzzyDistanceAtMost(a,b,limit){
 const band=Math.floor(limit);
 if(Math.abs(a.length-b.length)>band)return Infinity;
 let previous=new Float64Array(b.length+1),current=new Float64Array(b.length+1);
 previous.fill(Infinity);
 for(let j=0;j<=Math.min(b.length,band);j++)previous[j]=j;
 for(let i=1;i<=a.length;i++){
  current.fill(Infinity);
  if(i<=band)current[0]=i;
  const start=Math.max(1,i-band),end=Math.min(b.length,i+band);let rowMin=Infinity;
  for(let j=start;j<=end;j++){
   const value=Math.min(previous[j]+1,current[j-1]+1,previous[j-1]+substitutionCost(a[i-1],b[j-1]));
   current[j]=value;if(value<rowMin)rowMin=value;
  }
  if(rowMin>limit)return Infinity;
  [previous,current]=[current,previous];
 }
 return previous[b.length]<=limit?previous[b.length]:Infinity;
}

function extractCodes(text){
 const source=String(text||'').toUpperCase(),found=new Set();
 for(const pattern of [
  /[A-Z0-9]{2,8}\s*[\/\\|]\s*[A-Z0-9]{1,8}\s*-?\s*[A-Z]?[A-Z0-9]{1,4}/g,
  /[A-Z0-9]{2,8}\s*-\s*[A-Z0-9]{2,8}/g
 ]){
  for(const match of source.matchAll(pattern)){
   const code=match[0].replace(/[^A-Z0-9]/g,'');
   if(code.length>=7&&code.length<=14)found.add(code);
  }
 }
 return [...found];
}

function fuzzyMatchCodes(text){
 const tokens=[...String(text||'').toUpperCase().matchAll(/[A-Z0-9]+/g)];
 const groups=new Set();
 for(let start=0;start<tokens.length;start++){
  if(tokens[start][0].length<4)continue;
  let joined='';
  for(let end=start;end<Math.min(tokens.length,start+3);end++){
   if(end>start&&tokens[end].index-tokens[end-1].index-tokens[end-1][0].length>4)break;
   joined+=tokens[end][0];
   if(joined.length>=7&&joined.length<=18)groups.add(joined);
  }
 }
 let best=MAX_OCR_DISTANCE;const matches=new Map();
 for(const group of groups){
  for(let offset=0;offset<=1;offset++){
   for(const [prefixLength,prefixes] of codePrefixBuckets){
    if(offset+prefixLength>=group.length)continue;
    const observedPrefix=group.slice(offset,offset+prefixLength);
    for(const [prefixKey,candidates] of prefixes){
     const prefixDistance=fuzzyDistanceAtMost(observedPrefix,prefixKey,MAX_PREFIX_OCR_DISTANCE);
     if(prefixDistance>MAX_PREFIX_OCR_DISTANCE)continue;
     for(const candidate of candidates){
      const suffixStart=offset+prefixLength;
      for(let suffixLength=Math.max(1,candidate.suffixKey.length-MAX_DISTANCE);suffixLength<=Math.min(group.length-suffixStart,candidate.suffixKey.length+MAX_DISTANCE);suffixLength++){
       const observedSuffix=group.slice(suffixStart,suffixStart+suffixLength);
       const suffixDistance=fuzzyDistanceAtMost(observedSuffix,candidate.suffixKey,MAX_SUFFIX_OCR_DISTANCE);
       const markerPenalty=/^[A-Z]/.test(observedSuffix)&&/^[0-9]/.test(candidate.suffixKey)?1:0;
       const distance=prefixDistance+suffixDistance+markerPenalty+offset*.75;
       if(distance<best){best=distance;matches.clear()}
       if(distance<=MAX_OCR_DISTANCE)matches.set(candidate.code,Math.min(matches.get(candidate.code)??Infinity,distance));
      }
     }
    }
   }
  }
 }
 if(best>MAX_OCR_DISTANCE)return [];
 return [...matches].filter(([,distance])=>distance<=best+.15).slice(0,3).map(([code])=>code);
}

function matchCodes(text){
 const tokens=extractCodes(text),matches=new Map();let best=MAX_DISTANCE+1;
 for(const token of tokens){
  const key=normalizeCode(token);
  const known=codeByKey.get(key);
  if(known)return [known];
  for(let length=Math.max(7,key.length-MAX_DISTANCE);length<=Math.min(14,key.length+MAX_DISTANCE);length++){
   for(const candidate of codeBuckets.get(length)||[]){
    const distance=distanceAtMost(key,candidate.key,MAX_DISTANCE);
    if(distance<best)best=distance;
    if(distance<=MAX_DISTANCE)matches.set(candidate.code,Math.min(matches.get(candidate.code)??MAX_DISTANCE+1,distance));
   }
  }
 }
 if(best<=MAX_DISTANCE)return [...matches].filter(([,distance])=>distance===best).slice(0,3).map(([code])=>code);
 return fuzzyMatchCodes(text);
}

self.onmessage=event=>{
 const data=event.data||{};
 try{
  if(data.type==='init'){
   codeBuckets=new Map();codeByKey=new Map();codePrefixBuckets=new Map();
   for(const code of data.codes||[]){
    const key=normalizeCode(code);
    if(key.length<7||key.length>14||codeByKey.has(key))continue;
    const [prefix,suffix]=String(code).toUpperCase().split(/-(?=[^-]*$)/);
    const candidate={
     key,
     prefixKey:String(prefix||code).replace(/[^A-Z0-9]/g,''),
     suffixKey:String(suffix||'').replace(/[^A-Z0-9]/g,''),
     code
    };
    codeByKey.set(key,code);
    if(candidate.prefixKey&&candidate.suffixKey){
     if(!codePrefixBuckets.has(candidate.prefixKey.length))codePrefixBuckets.set(candidate.prefixKey.length,new Map());
     const prefixes=codePrefixBuckets.get(candidate.prefixKey.length);
     if(!prefixes.has(candidate.prefixKey))prefixes.set(candidate.prefixKey,[]);
     prefixes.get(candidate.prefixKey).push(candidate);
    }
    if(!codeBuckets.has(key.length))codeBuckets.set(key.length,[]);
    codeBuckets.get(key.length).push(candidate);
   }
   self.postMessage({type:'ready'});return;
  }
  if(data.type==='match')self.postMessage({type:'result',id:data.id,codes:matchCodes(data.text)});
 }catch(error){
  self.postMessage({type:'error',id:data.id,message:error&&error.message||'Card matching failed'});
 }
};
