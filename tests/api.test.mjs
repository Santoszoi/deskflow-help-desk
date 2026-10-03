import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';

const directory=await mkdtemp(path.join(tmpdir(),'deskflow-test-'));
const port=Number(process.env.TEST_PORT || 3347);
const base=`http://127.0.0.1:${port}/api`;
let logs='';
let child;
function start(){
 child=spawn(process.execPath,['server/dist/index.js'],{env:{...process.env,PORT:String(port),JWT_SECRET:'test-only-secret-with-more-than-32-characters',DB_CLIENT:process.env.TEST_DB_CLIENT || 'sqlite',SQLITE_PATH:path.join(directory,'test.db'),DEMO_SEED:'true'}});
 child.stdout.on('data',d=>logs+=d);child.stderr.on('data',d=>logs+=d);
}
async function ready(){for(let i=0;i<100;i++){try {const r=await fetch(base+'/health');if(r.ok)return}catch{}if(child.exitCode!==null)throw new Error(logs);await new Promise(r=>setTimeout(r,100))}throw new Error('Server did not start: '+logs)}
async function stop(){if(child.exitCode!==null)return;const closed=new Promise(r=>child.once('exit',r));child.kill('SIGTERM');await closed}
async function request(route,{token,method='GET',body}={}){
 const response=await fetch(base+route,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},...(body?{body:JSON.stringify(body)}:{})});
 return {status:response.status,data:await response.json()};
}
test('real database: authentication, ticket workflow, roles and persistence',async()=>{
 try {
  start();await ready();
  assert.equal((await request('/tickets')).status,401);
  assert.equal((await request('/auth/login',{method:'POST',body:{email:'admin@deskflow.local',password:'wrong'}})).status,401);
  const login=await request('/auth/login',{method:'POST',body:{email:'admin@deskflow.local',password:'123456'}});assert.equal(login.status,200);
  const token=login.data.token;
  const userLogin=await request('/auth/login',{method:'POST',body:{email:'usuario@deskflow.local',password:'123456'}});const user=userLogin.data.token;
  const created=await request('/tickets',{token:user,method:'POST',body:{title:'Integration test '+Date.now(),description:'Persistent real database ticket',asset:'PC-TEST',category:'Software',priority:'ALTA'}});
  assert.equal(created.status,201);const id=created.data.id;
  const other=await request('/tickets',{token,method:'POST',body:{title:'Private admin ticket',description:'User must not see it',category:'Software'}});
  assert.equal((await request(`/tickets/${other.data.id}`,{token:user})).status,403);
  assert.equal((await request(`/tickets/${id}`,{token:user,method:'PATCH',body:{status:'FECHADO'}})).status,403);
  const agents=await request('/users/agents',{token});assert.equal(agents.status,200);
  assert.equal((await request(`/tickets/${id}`,{token,method:'PATCH',body:{status:'EM_ATENDIMENTO',assignee_id:agents.data[0].id}})).status,200);
  assert.equal((await request(`/tickets/${id}/comments`,{token:user,method:'POST',body:{message:'Teste de persistência'}})).status,201);
  const detail=await request(`/tickets/${id}`,{token});assert.equal(detail.data.asset,'PC-TEST');assert.equal(detail.data.status,'EM_ATENDIMENTO');assert.equal(detail.data.comments.length,1);assert.ok(detail.data.history.length>=4);
  const filtered=await request(`/tickets?search=${id}&priority=ALTA`,{token});assert.ok(filtered.data.some(t=>t.id===id));
  assert.equal((await request('/dashboard',{token})).status,200);
  await stop();start();await ready();
  const persisted=await request(`/tickets/${id}`,{token});assert.equal(persisted.data.comments[0].message,'Teste de persistência');
 } finally {await stop();await rm(directory,{recursive:true,force:true})}
});
