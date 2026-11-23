import re,json,gzip,base64,sys
from PIL import Image
from multiprocessing import Pool
N=int(sys.argv[1]);BASE=int(sys.argv[2])
h=open('/mnt/user-data/outputs/ggo-card-finder.html',encoding='utf-8').read()
m=re.search(r'<script type="application/json" id="data">(.*?)</script>',h,re.S)
data=json.loads(gzip.decompress(base64.b64decode(m.group(1).strip())).decode('utf-8'))
src=json.load(open('/tmp/w/src.json'))
W,H,COLS,ROWS=256,358,12,8;PER=COLS*ROWS
pend=[c for c in data if c['has'] and c.get('hk') is None and c['sh']<134 and (c['code']+'||'+c['set']) in src]
take=pend[:N*PER]
def tile(c):
    try: return Image.open(src[c['code']+'||'+c['set']]).convert("RGB").resize((W,H),Image.LANCZOS)
    except Exception: return None
n=(len(take)+PER-1)//PER
assign={}
with Pool(8) as p:
    for s in range(n):
        chunk=take[s*PER:(s+1)*PER]; ims=p.map(tile,chunk)
        sheet=Image.new("RGB",(W*COLS,H*ROWS),(120,120,120))
        for k,(c,im) in enumerate(zip(chunk,ims)):
            if im: sheet.paste(im,((k%COLS)*W,(k//COLS)*H)); assign[c['code']+'||'+c['set']]=(BASE+s,k)
        sheet.save(f'/tmp/w/sheet_{BASE+s:03d}.jpg',"JPEG",quality=74,optimize=True)
json.dump(assign,open('/tmp/w/assign_%d.json'%BASE,'w'))
print('first',take[0]['series'],'| last',take[-1]['series'],'|',n,'sheets',BASE,'..',BASE+n-1,'| assigned',len(assign))
