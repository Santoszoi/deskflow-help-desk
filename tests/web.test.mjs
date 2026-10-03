import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';

test('Next.js standalone routes and same-origin API proxy',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'deskflow-web-'));
 const env={...process.env,JWT_SECRET:'test-secret-longer-than-32-characters',DEMO_SEED:'true',DB_CLIENT:'sqlite',SQLITE_PATH:path.join(dir,'test.db')};
 let logs='';
 const api=spawn(process.execPath,['server/dist/index.js'],{env:{...env,PORT:'3333'}});
 const web=spawn(process.execPath,['scripts/start.mjs'],{cwd:'client',env:{...env,PORT:'3100'}});
 for(const child of [api,web]){child.stdout.on('data',d=>logs+=d);child.stderr.on('data',d=>logs+=d)}
 try {
  let ready=false;
  for(let i=0;i<100;i++){try{const r=await fetch('http://127.0.0.1:3100/api/health');if(r.ok){ready=true;break}}catch{}await new Promise(r=>setTimeout(r,100))}
  assert.ok(ready,logs);
  for(const route of ['/login','/tickets','/tickets/1','/new']){const r=await fetch('http://127.0.0.1:3100'+route);assert.equal(r.status,200);assert.ok((await r.text()).includes('DeskFlow'))}
  const r=await fetch('http://127.0.0.1:3100/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'admin@deskflow.local',password:'123456'})});
  assert.equal(r.status,200);assert.ok((await r.json()).token);
 } finally {
  await Promise.all([api,web].map(async child=>{if(child.exitCode!==null)return;const exited=new Promise(r=>child.once('exit',r));child.kill('SIGTERM');await exited}));
  await rm(dir,{recursive:true,force:true});
 }
});
