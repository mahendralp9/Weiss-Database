const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const test=require('node:test');
const vm=require('node:vm');
const zlib=require('node:zlib');

const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const encoded=html.match(/<script type="application\/json" id="data">([^<]+)<\/script>/)[1];
const cards=JSON.parse(zlib.gunzipSync(Buffer.from(encoded,'base64')));
const messages=[];
const scope={postMessage:message=>messages.push(message)};
vm.runInNewContext(fs.readFileSync(path.join(root,'ocr-matcher.js'),'utf8'),{self:scope});

function send(data){
 scope.onmessage({data});
 return messages.shift();
}

test('matches noisy OCR from both uploaded card photos without adjacent-card false positives',()=>{
 assert.equal(send({type:'init',codes:cards.map(card=>card.code)}).type,'ready');
 assert.deepEqual(Array.from(send({type:'match',id:1,text:'GGO/SE50-09'}).codes),['GGO/SE50-09']);
 assert.deepEqual(Array.from(send({type:'match',id:2,text:'GGO/SE5O-09'}).codes),['GGO/SE50-09']);
 assert.deepEqual(Array.from(send({type:'match',id:3,text:'GGO/SF50-09'}).codes),['GGO/SE50-09']);
 assert.deepEqual(Array.from(send({type:'match',id:4,text:'GOrSESOP SSPR 0500 ine 46a'}).codes),['GGO/SE50-P04']);
 assert.deepEqual(Array.from(send({type:'match',id:5,text:'ST a X a1GGO/S59-037RR'}).codes),['GGO/S59-E037']);
 assert.deepEqual(Array.from(send({type:'match',id:6,text:'SOrSESO SPR 0500 4ia'}).codes),[]);
 assert.deepEqual(Array.from(send({type:'match',id:7,text:'ZZZ/ZZZZ-9999'}).codes),[]);
});
