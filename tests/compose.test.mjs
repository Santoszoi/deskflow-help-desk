import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
const base=(process.env.TEST_WEB_URL || 'http://127.0.0.1:3000')+'/api';
async function request(route,{token,method='GET',body}={}){
 const response=await fetch(base+route,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},...(body?{body:JSON.stringify(body)}:{})});return {status:response.status,data:await response.json()};
}
test('Docker/MySQL: real ticket workflow and persistence after API restart',async()=>{
 const health=await request('/health');assert.equal(health.status,200);assert.equal(health.data.database,'mysql');
 assert.equal((await request('/tickets')).status,401);
 const login=await request('/auth/login',{method:'POST',body:{email:'admin@deskflow.local',password:'123456'}});assert.equal(login.status,200);const token=login.data.token;
 const ul=await request('/auth/login',{method:'POST',body:{email:'usuario@deskflow.local',password:'123456'}});assert.equal(ul.status,200);const user=ul.data.token;
 const created=await request('/tickets',{token:user,method:'POST',body:{title:'Compose test '+Date.now(),description:'Real MySQL storage',asset:'PC-MYSQL',category:'Software',priority:'ALTA'}});assert.equal(created.status,201);const id=created.data.id;
 assert.equal((await request(`/tickets/${id}`,{token:user,method:'PATCH',body:{status:'FECHADO'}})).status,403);
 const agents=await request('/users/agents',{token});assert.equal(agents.status,200);
 assert.equal((await request(`/tickets/${id}`,{token,method:'PATCH',body:{status:'EM_ATENDIMENTO',assignee_id:agents.data[0].id}})).status,200);
 assert.equal((await request(`/tickets/${id}/comments`,{token:user,method:'POST',body:{message:'MySQL persisted comment'}})).status,201);
 const detail=await request(`/tickets/${id}`,{token});assert.equal(detail.data.asset,'PC-MYSQL');assert.equal(detail.data.status,'EM_ATENDIMENTO');assert.ok(detail.data.history.length>=4);
 assert.equal((await request('/dashboard',{token})).status,200);
 const search=await request(`/tickets?search=${id}&priority=ALTA`,{token});assert.ok(search.data.some(t=>t.id===id));
 const restarted=spawnSync('docker',['compose','restart','api'],{encoding:'utf8'});assert.equal(restarted.status,0,restarted.stderr);
 let ready=false;for(let i=0;i<120;i++){try {if((await request('/health')).status===200){ready=true;break}}catch{}await new Promise(r=>setTimeout(r,500))}assert.ok(ready,'API did not recover');
 const persisted=await request(`/tickets/${id}`,{token});assert.equal(persisted.data.comments[0].message,'MySQL persisted comment');
});
