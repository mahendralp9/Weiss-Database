const MAX_DISTANCE=2;
let codeBuckets=new Map(),codeByKey=new Map();

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
 if(best>MAX_DISTANCE)return [];
 return [...matches].filter(([,distance])=>distance===best).slice(0,3).map(([code])=>code);
}

self.onmessage=event=>{
 const data=event.data||{};
 try{
  if(data.type==='init'){
   codeBuckets=new Map();codeByKey=new Map();
   for(const code of data.codes||[]){
    const key=normalizeCode(code);
    if(key.length<7||key.length>14||codeByKey.has(key))continue;
    const candidate={key,code};
    codeByKey.set(key,code);
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
