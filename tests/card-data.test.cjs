const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const test=require('node:test');
const zlib=require('node:zlib');

const html=fs.readFileSync(path.resolve(__dirname,'../index.html'),'utf8');
const encoded=html.match(/<script type="application\/json" id="data">([^<]+)<\/script>/)[1];
const cards=JSON.parse(zlib.gunzipSync(Buffer.from(encoded,'base64')));
const byCode=new Map(cards.map(card=>[card.code,card]));
const formatterStart=html.indexOf('const formatEff=s=>{');
const formatterEnd=html.indexOf('\n};',formatterStart)+3;
const formatEff=new Function(html.slice(formatterStart,formatterEnd)+';return formatEff;')();
const imageStart=html.indexOf('const cardImageURL=c=>{');
const imageEnd=html.indexOf('\n};',imageStart)+3;
const cardImageURL=new Function(html.slice(imageStart,imageEnd)+';return cardImageURL;')();

test('imports Charlotte W40 effects with readable tags and separate abilities',()=>{
 assert.match(byCode.get('CHA/W40-003').eff,/^\[AUTO\] /);
 assert.deepEqual(byCode.get('CHA/W40-027').eff.split('\n').map(line=>line.match(/^\[[A-Z]+\]/)?.[0]),['[CONT]','[CONT]','[AUTO]']);
 const formatted=formatEff(byCode.get('CHA/W40-027').eff);
 assert.deepEqual(formatted.split('\n').map(line=>line.match(/^\[[A-Z]+\]/)?.[0]),['[CONT]','[CONT]','[AUTO]']);
 assert.match(byCode.get('CHA/W40-022').eff,/^\[BACKUP\] /);
 assert.equal(formatEff(byCode.get('CHA/W40-022').eff).split('\n')[0].match(/^\[[A-Z]+\]/)?.[0],'[BACKUP]');
 assert.doesNotMatch(cards.filter(card=>card.code.startsWith('CHA/W40-')).map(card=>card.eff).join('\n'),/<sprite\b/i);
});

test('imports other simulator text styles and renders their symbols readably',()=>{
 assert.ok(byCode.get('AGS/W108-027').eff);
 assert.match(byCode.get('STS/W140-063').eff,/^\[COUNTER\] /);
 assert.match(formatEff(byCode.get('STS/W140-063').eff),/^\[COUNTER\] /);
 assert.match(byCode.get('AW/S18-E052').eff,/^\[BACKUP\] /);
 assert.match(byCode.get('AGS/W108-015').eff,/\[CHOICE TRIGGER\]/);
 assert.match(byCode.get('AGS/W108-015').eff,/\[SOUL TRIGGER\]/);
 assert.doesNotMatch(['AGS/W108-027','STS/W140-063','AW/S18-E052','AGS/W108-015'].map(code=>byCode.get(code).eff).join('\n'),/<sprite\b/i);
});

test('imports missing Summer Pockets TV Animation effects',()=>{
 const codes=['SMP/W137-005','SMP/W137-007','SMP/W137-013','SMP/W137-014','SMP/W137-034','SMP/W137-035','SMP/W137-071','SMP/W137-072','SMP/W137-073','SMP/W137-098','SMP/W137-100'];
 for(const code of codes) assert.ok(byCode.get(code)?.eff,`${code} should have effect text`);
 assert.match(byCode.get('SMP/W137-005').eff,/^\[ACT\] CONCENTRATION/);
 assert.match(byCode.get('SMP/W137-007').eff,/^\[AUTO\]/);
 assert.match(byCode.get('SMP/W137-013').eff,/^\[CONT\]/);
});

test('uses validated LittleAKIBA images when no English image is available',()=>{
 const card=byCode.get('SMP/W137-001');
 assert.match(card.laImg,/^https:\/\/images\.littleakiba\.com\/tcg\/card\d+-large\.jpg$/);
 assert.equal(cardImageURL(card),card.laImg);
 assert.match(cardImageURL({laImg:'https://untrusted.example/card.jpg',jpImg:'https://ws-tcg.com/card.png'}),/^https:\/\/ws-tcg\.com\//);
 assert.equal(cardImageURL({laImg:'https://images.littleakiba.com/tcg/card1-large.jpg',img:'https://en.ws-tcg.com/card.png'}),'https://en.ws-tcg.com/card.png');
});

test('includes A Certain Guy\'s Talk with its corrected card code',()=>{
 const card=byCode.get('SMP/W60-096');
 assert.equal(card?.name,"A Certain Guy's Talk");
 assert.equal(card?.type,'Event');
 assert.match(card?.eff||'',/choose up to 2 level 0 or lower characters/i);
 assert.match(card?.laImg||'',/^https:\/\/images\.littleakiba\.com\/tcg\/card\d+-large\.jpg$/);
 assert.equal(cards.some(item=>item.code===':'),false);
});
