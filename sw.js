const C="diaohuo-v9";
const A=["./","./index.html","./manifest.webmanifest","./icon-192.png","./icon-512.png"];
const WAIT=3000; // 網路超過幾毫秒沒回應就先用手機裡存的版本

self.addEventListener("install",e=>{
  e.waitUntil(caches.open(C).then(c=>c.addAll(A.map(u=>new Request(u,{cache:"reload"})))));
  self.skipWaiting();
});
self.addEventListener("activate",e=>{
  e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));
});

// 網路優先:有網路就拿最新版並存起來,沒網路或太慢才用手機裡存的版本
self.addEventListener("fetch",e=>{
  const req=e.request;
  if(req.method!=="GET")return;
  const url=new URL(req.url);
  if(url.origin!==location.origin)return;

  const net=fetch(url.href,{cache:"no-cache"}).then(r=>{
    if(r&&r.ok){const cp=r.clone();caches.open(C).then(c=>c.put(req,cp));}
    return r;
  });
  e.waitUntil(net.catch(()=>{}));

  e.respondWith((async()=>{
    try{
      const r=await Promise.race([net,new Promise(res=>setTimeout(res,WAIT))]);
      if(r)return r;
    }catch(_){}
    const hit=await caches.match(req,{ignoreSearch:true})||(req.mode==="navigate"?await caches.match("./index.html"):null);
    return hit||net;
  })());
});
