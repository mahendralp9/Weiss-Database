#!/usr/bin/env python3
"""Rebuild card images as 256x358 WebP sprite sheets for every card still on small tiles.

Usage: python3 tools/upgrade_images.py --repo . --zips /path/to/extracted/simulator/zips --base 422 [--quality 70] [--max-sheets N]
Reads the card data embedded in index.html, finds source images in the simulator folders,
writes sheets/sheet_NNN.webp, updates index.html (data + SHEETS list) and deletes sheets nobody uses any more.
"""
import argparse,re,json,gzip,base64,os,glob,collections
from PIL import Image
from multiprocessing import Pool
ap=argparse.ArgumentParser();ap.add_argument('--repo',default='.');ap.add_argument('--zips',required=True);ap.add_argument('--base',type=int,required=True)
ap.add_argument('--quality',type=int,default=70);ap.add_argument('--max-sheets',type=int,default=10**6);a=ap.parse_args()
W,H,COLS,ROWS=256,358,12,8;PER=COLS*ROWS
idx_path=os.path.join(a.repo,'index.html');h=open(idx_path,encoding='utf-8').read()
m=re.search(r'(<script type="application/json" id="data">)(.*?)(</script>)',h,re.S)
data=json.loads(gzip.decompress(base64.b64decode(m.group(2).strip())).decode('utf-8'))
names=json.loads(re.search(r'const SHEETS=(\[.*?\]);',h,re.S).group(1))
ROOTS=sorted(glob.glob(os.path.join(a.zips,'*')))
meta=collections.defaultdict(list)
for root in ROOTS:
    for sf in glob.glob(root+'/**/SingleSetData.txt',recursive=True):
        series=None;fol=None
        for ln in open(sf,encoding='utf-8-sig',errors='replace').read().replace('\r','').split('\n'):
            if ln.startswith('Series:'): series=ln[7:].strip()
            elif ln.startswith('Folder:'): fol=ln[7:].strip()
            elif ln.startswith('SetName:') and fol: meta[(series,ln[8:].strip())].append(root+'/'+fol); fol=None
norm=lambda s:re.sub(r'[^a-z0-9]','',s.lower());idx={}
def ix(p):
    if p not in idx: idx[p]={norm(os.path.splitext(f)[0]):f for f in os.listdir(p) if f.lower().endswith(('.jpg','.jpeg','.png','.webp'))} if os.path.isdir(p) else {}
    return idx[p]
def resolve(c):
    tail=c['code'].split('/',1)[-1];e=lambda s:re.sub(r'-([A-Za-z]*)(\d+)$',r'-\1E\2',s)
    cands=[norm(c['code']),norm(e(c['code'])),norm(tail),norm(e(tail)),norm(tail.split('-')[-1]),norm(re.sub(r'(\d+)$',r'E\1',tail.split('-')[-1]))]
    for p in list(meta.get((c['series'],c['set']),[]))+[os.path.join(r,c['set']) for r in ROOTS]:
        d=ix(p)
        for k in cands:
            if k in d: return os.path.join(p,d[k])
pend=[c for c in data if c['has'] and c.get('hk') is None and c['sh']<134]
src={};miss=0
for c in pend:
    s=resolve(c)
    if s: src[(c['code'],c['set'])]=s
    else: miss+=1
pend=[c for c in pend if (c['code'],c['set']) in src][:a.max_sheets*PER]
print('pending',len(pend),'unresolved',miss)
def tile(c):
    try: return Image.open(src[(c['code'],c['set'])]).convert('RGB').resize((W,H),Image.LANCZOS)
    except Exception: return None
n=(len(pend)+PER-1)//PER;os.makedirs(os.path.join(a.repo,'sheets'),exist_ok=True)
with Pool(8) as p:
    for s in range(n):
        chunk=pend[s*PER:(s+1)*PER];ims=p.map(tile,chunk)
        sheet=Image.new('RGB',(W*COLS,H*ROWS),(120,120,120));sh=a.base+s
        for k,(c,im) in enumerate(zip(chunk,ims)):
            if im: sheet.paste(im,((k%COLS)*W,(k//COLS)*H));c['sh']=sh;c['pos']=k
        sheet.save(os.path.join(a.repo,'sheets','sheet_%03d.webp'%sh),'WEBP',quality=a.quality,method=4)
        while len(names)<=sh: names.append(None)
        names[sh]='sheet_%03d.webp'%sh
        if s%10==0: print('sheet',sh,flush=True)
h=re.sub(r'const SHEETS=\[.*?\];','const SHEETS='+json.dumps(names)+';',h,count=1,flags=re.S)
blob=base64.b64encode(gzip.compress(json.dumps(data,ensure_ascii=False).encode('utf-8'),9)).decode()
m2=re.search(r'(<script type="application/json" id="data">)(.*?)(</script>)',h,re.S)
h=h[:m2.start(2)]+blob+h[m2.end(2):];open(idx_path,'w',encoding='utf-8').write(h)
used={names[c['sh']] for c in data if c['has'] and c.get('hk') is None}|{'hi_ggo.jpg','hi_ggo2.jpg'}
rm=0
for f in os.listdir(os.path.join(a.repo,'sheets')):
    if f not in used: os.remove(os.path.join(a.repo,'sheets',f));rm+=1
print('done: sheets',n,'| removed unused',rm,'| still small tiles:',sum(1 for c in data if c['has'] and c.get('hk') is None and c['sh']<134))
