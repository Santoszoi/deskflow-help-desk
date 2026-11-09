import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { sqliteSchema } from '../server/dist/lib/schema.js';

const require = createRequire(new URL('../server/package.json', import.meta.url));
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

test('two USER accounts remain isolated through the production Next.js API proxy', {timeout:60000}, async () => {
 const dir = await mkdtemp(path.join(tmpdir(), 'deskflow-isolation-'));
 const databasePath = path.join(dir, 'test.db');
 const db = new Database(databasePath);
 db.exec(sqliteSchema);
 const password = 'isolated-test-password';
 const hash = bcrypt.hashSync(password, 10);
 const insert = db.prepare('INSERT INTO users (name,email,password_hash,role) VALUES (?,?,?,?)');
 insert.run('Marcos A','a@example.invalid',hash,'USER');
 insert.run('Marcos B','b@example.invalid',hash,'USER');
 db.close();
 const env = {...process.env, NODE_ENV:'production', JWT_SECRET:'isolation-test-only-secret-more-than-32-chars', DB_CLIENT:'sqlite', SQLITE_PATH:databasePath, DEMO_SEED:'false'};
 const children = [
  spawn(process.execPath,['server/dist/index.js'],{env:{...env,PORT:'3333'}}),
  spawn(process.execPath,['scripts/start.mjs'],{cwd:'client',env:{...env,PORT:'3101'}})
 ];
 let logs = '';
 for (const child of children) {child.stdout.on('data',d=>logs+=d);child.stderr.on('data',d=>logs+=d);}
 const base = 'http://127.0.0.1:3101/api';
 async function request(route, token, method='GET', body) {
  const response = await fetch(base+route,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},...(body?{body:JSON.stringify(body)}:{})});
  return {status:response.status,data:await response.json()};
 }
 try {
  let ready = false;
  for(let i=0;i<150;i++) {
   if(children.some(child=>child.exitCode!==null)) throw new Error(logs);
   try {if((await fetch(base+'/health')).ok){ready=true;break;}} catch {}
   await new Promise(resolve=>setTimeout(resolve,100));
  }
  assert.ok(ready,logs);
  const accounts = await Promise.all(['a','b'].map(async name=>{
   const login = await request('/auth/login',null,'POST',{email:`${name}@example.invalid`,password});
   assert.equal(login.status,200);assert.equal(login.data.user.role,'USER');
   return login.data;
  }));
  const tickets = await Promise.all(accounts.map(async (account,index)=>{
   const result = await request('/tickets',account.token,'POST',{title:`Private ${index}`,description:`Secret ${index}`,category:'Software',priority:'ALTA',requester_id:accounts[1-index].user.id});
   assert.equal(result.status,201);return result.data.id;
  }));
  // Alternate concurrent reads repeatedly to exercise shared HTTP/proxy paths.
  for(let round=0;round<3;round++) await Promise.all(accounts.map(async(account,index)=>{
   const own=tickets[index], other=tickets[1-index];
   const list=await request('/tickets',account.token);
   assert.equal(list.status,200);assert.deepEqual(list.data.map(t=>t.id),[own]);
   const filtered=await request(`/tickets?search=${encodeURIComponent(`Private ${1-index}`)}`,account.token);
   assert.equal(filtered.status,200);assert.deepEqual(filtered.data,[]);
   const detail=await request(`/tickets/${own}`,account.token);
   assert.equal(detail.status,200);assert.equal(detail.data.requester_id,account.user.id);
   const denied=await request(`/tickets/${other}`,account.token);
   assert.equal(denied.status,403);assert.deepEqual(denied.data,{message:'Sem permissão.'});
   const dashboard=await request('/dashboard',account.token);
   assert.equal(dashboard.status,200);assert.equal(dashboard.data.total,1);
   assert.deepEqual(dashboard.data.recent.map(t=>t.id),[own]);
  }));
  for(const [index,account] of accounts.entries()) {
   assert.equal((await request(`/tickets/${tickets[1-index]}/comments`,account.token,'POST',{message:'Forbidden cross-user comment'})).status,403);
   assert.equal((await request(`/tickets/${tickets[1-index]}`,account.token,'PATCH',{status:'FECHADO'})).status,403);
   assert.equal((await request(`/tickets/${tickets[index]}/comments`,account.token,'POST',{message:`Private comment ${index}`})).status,201);
  }
  for(const [index,account] of accounts.entries()) {
   const detail=await request(`/tickets/${tickets[index]}`,account.token);
   assert.equal(detail.data.status,'ABERTO');
   assert.deepEqual(detail.data.comments.map(c=>c.message),[`Private comment ${index}`]);
  }
  assert.equal((await request('/tickets')).status,401);
 } finally {
  await Promise.all(children.map(async child=>{if(child.exitCode!==null)return;const exited=new Promise(resolve=>child.once('exit',resolve));child.kill('SIGTERM');await exited;}));
  await rm(dir,{recursive:true,force:true});
 }
});
