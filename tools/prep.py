import re,json,gzip,base64,os,glob,collections,sys
h=open('/mnt/user-data/outputs/ggo-card-finder.html',encoding='utf-8').read()
m=re.search(r'<script type="application/json" id="data">(.*?)</script>',h,re.S)
data=json.loads(gzip.decompress(base64.b64decode(m.group(1).strip())).decode('utf-8'))
ROOTS=sorted(glob.glob('/tmp/z/*'))
meta=collections.defaultdict(list)
for root in ROOTS:
    for sf in glob.glob(root+"/**/SingleSetData.txt",recursive=True):
        series=None;fol=None
        for ln in open(sf,encoding="utf-8-sig",errors="replace").read().replace("\r","").split("\n"):
            if ln.startswith("Series:"): series=ln[7:].strip()
            elif ln.startswith("Folder:"): fol=ln[7:].strip()
            elif ln.startswith("SetName:") and fol: meta[(series,ln[8:].strip())].append(root+"/"+fol); fol=None
norm=lambda s:re.sub(r"[^a-z0-9]","",s.lower())
idx={}
def ix(p):
    if p not in idx: idx[p]={norm(os.path.splitext(f)[0]):f for f in os.listdir(p) if f.lower().endswith((".jpg",".jpeg",".png",".webp"))} if os.path.isdir(p) else {}
    return idx[p]
def resolve(c):
    tail=c['code'].split('/',1)[-1]
    cands=[norm(c['code']),norm(re.sub(r"-([A-Za-z]*)(\d+)$",r"-\1E\2",c['code'])),norm(tail),norm(re.sub(r"-([A-Za-z]*)(\d+)$",r"-\1E\2",tail)),norm(tail.split('-')[-1]),norm(re.sub(r"(\d+)$",r"E\1",tail.split('-')[-1]))]
    paths=list(meta.get((c['series'],c['set']),[]))+[os.path.join(r,c['set']) for r in ROOTS]
    for p in paths:
        d=ix(p)
        for k in cands:
            if k in d: return os.path.join(p,d[k])
    return None
pend=[c for c in data if c['has'] and c.get('hk') is None and c['sh']<134]
print('pending',len(pend),'first',pend[0]['series'])
miss=0
src={}
for c in pend[:int(sys.argv[1])*96]:
    s=resolve(c)
    if s: src[c['code']+'||'+c['set']]=s
    else: miss+=1
print('resolved',len(src),'missing',miss)
json.dump(src,open('/tmp/w/src.json','w'))
