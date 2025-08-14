import { spawn } from 'node:child_process';
import net from 'node:net';
import http from 'node:http';
import { setTimeout as delay } from 'node:timers/promises';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

function findFreePort(start=3000, max=65000){
  return new Promise((resolve,reject)=>{
    const tryPort=(p)=>{
      if(p>max) return reject(new Error('No free ports'));
      const s=net.createServer();
      s.unref();
      s.on('error',()=>tryPort(p+1));
      s.listen(p,'0.0.0.0',()=>{const {port}=s.address(); s.close(()=>resolve(port));});
    };
    tryPort(start);
  });
}
async function waitFor(url, ms=20000){
  const start=Date.now();
  while(Date.now()-start<ms){
    try{
      await new Promise((res,rej)=>{
        const req=http.get(url,(r)=> (r.statusCode&&r.statusCode<500)?res():rej(new Error('Bad status')));
        req.on('error',rej);
      }); return true;
    }catch{ await delay(500); }
  }
  throw new Error(`Timeout ${url}`);
}
(async()=>{
  const apiPort=process.env.API_PORT?Number(process.env.API_PORT):await findFreePort(8000);
  const webPort=process.env.PORT?Number(process.env.PORT):await findFreePort(3000);

  const api=spawn(process.platform==='win32'?'python':'python3',
    ['-m','uvicorn','apps.api.main:app','--host','0.0.0.0','--port',String(apiPort),'--reload'],
    {stdio:'inherit', env:{...process.env, PYTHONUNBUFFERED:'1'}}
  );

  const apiBase=`http://localhost:${apiPort}`;
  const envPath='apps/web/.env.local';
  mkdirSync(dirname(envPath),{recursive:true});
  writeFileSync(envPath,`NEXT_PUBLIC_API_BASE=${apiBase}\n`);

  await waitFor(`${apiBase}/health`).catch(()=>{});

  const web=spawn('npm',['run','dev','--prefix','apps/web','--','-p',String(webPort)],
    {stdio:'inherit', env:{...process.env, NEXT_PUBLIC_API_BASE:apiBase, PORT:String(webPort)}}
  );

  const bye=()=>{api.kill(); web.kill(); process.exit(0);};
  process.on('SIGINT',bye); process.on('SIGTERM',bye);
})();
