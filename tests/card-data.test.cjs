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
