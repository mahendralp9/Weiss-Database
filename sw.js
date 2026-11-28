const CACHE='ws-database-v7';
const CORE=[
 './',
 './index.html',
 './ocr-matcher.js',
 './manifest.webmanifest',
 './app-icon.svg',
 './icon-180.png',
 './icon-192.png',
 './icon-512.png'
];

self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)));
 self.skipWaiting();
});

self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))).then(()=>self.clients.claim())));
});

self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 if(new URL(event.request.url).origin!==self.location.origin)return;
 event.respondWith((async()=>{
  try{
   const response=await fetch(event.request);
   if(response.ok){
    const cache=await caches.open(CACHE);
    await cache.put(event.request,response.clone());
    if(new URL(event.request.url).pathname.includes('/sheets/')){
     const sheets=(await cache.keys()).filter(request=>new URL(request.url).pathname.includes('/sheets/'));
     await Promise.all(sheets.slice(0,Math.max(0,sheets.length-24)).map(request=>cache.delete(request)));
    }
   }
   return response;
  }catch{
   const cached=await caches.match(event.request);
   if(cached)return cached;
   if(event.request.mode==='navigate')return caches.match('./index.html');
   return Response.error();
  }
 })());
});
