import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';

const base = process.env.TEST_WEB_URL || 'http://127.0.0.1:3100';
const ticket = title => ({id:1,title,description:'Fixture',category:'Software',priority:'ALTA',status:'ABERTO',requester_name:'Test user',created_at:'2026-10-26 09:00:00',updated_at:'2026-10-26 09:00:00'});
async function session(run) {
  const browser = await chromium.launch({executablePath:process.env.TEST_CHROMIUM_PATH || undefined});
  const context = await browser.newContext();
  await context.addInitScript(() => {
    localStorage.setItem('user', JSON.stringify({id:1,name:'Test user',role:'VISITOR'}));
    localStorage.setItem('token','local-test-fixture');
  });
  const page = await context.newPage();
  const errors=[];
  page.on('pageerror', e=>errors.push(e.message));
  try { await run(page, context); assert.deepEqual(errors,[]); }
  finally { await browser.close(); }
}

test('latest filter wins when an earlier API response arrives last', async()=>session(async(page,context)=>{
  await mkdir('test-results',{recursive:true});
  await context.tracing.start({screenshots:true,snapshots:true,sources:true});
  let releaseOld;
  const oldResponse=new Promise(resolve=>releaseOld=resolve);
  let markStarted;
  const started=new Promise(resolve=>markStarted=resolve);
  await page.route('**/api/tickets?**',async route=>{
    const search=new URL(route.request().url()).searchParams.get('search');
    if(search==='old'){markStarted();await oldResponse;}
    await route.fulfill({json:[ticket(search==='old'?'Old result':search==='new'?'New result':'Initial result')]});
  });
  try {
    await page.goto(base+'/tickets');
    await page.getByText('Initial result',{exact:true}).waitFor();
    await page.getByPlaceholder('Pesquisar por ID, título ou descrição...').fill('old');
    await started;
    await page.getByPlaceholder('Pesquisar por ID, título ou descrição...').fill('new');
    await page.getByText('New result',{exact:true}).waitFor();
    releaseOld();
    await page.waitForTimeout(600); // Allow the deliberately late response to reach React.
    assert.equal(await page.getByText('Old result',{exact:true}).count(),0);
    assert.equal(await page.getByText('New result',{exact:true}).count(),1);
    await page.screenshot({path:'test-results/ticket-filters.png',fullPage:true});
    await page.setViewportSize({width:390,height:844});
    await page.waitForTimeout(350); // Finish the sidebar's responsive CSS transition.
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
    await page.screenshot({path:'test-results/ticket-filters-mobile.png',fullPage:true});
  } finally {releaseOld();await context.tracing.stop({path:'test-results/ticket-filters-trace.zip'});}
}));

test('typing is debounced and status/priority are sent together',async()=>session(async page=>{
  const requests=[];
  await page.route('**/api/tickets?**',async route=>{
    requests.push(new URL(route.request().url()).searchParams);
    await route.fulfill({json:[ticket('Filtered result')]});
  });
  await page.goto(base+'/tickets');
  await page.getByText('Filtered result',{exact:true}).waitFor();
  requests.length=0;
  await page.getByPlaceholder('Pesquisar por ID, título ou descrição...').pressSequentially('VPN & rede',{delay:20});
  await page.waitForTimeout(500);
  assert.equal(requests.length,1);
  assert.equal(requests[0].get('search'),'VPN & rede');
  await page.getByLabel('Filtrar por status').selectOption('ABERTO');
  await page.getByLabel('Filtrar por prioridade').selectOption('ALTA');
  await page.waitForTimeout(500);
  assert.equal(requests.at(-1).get('status'),'ABERTO');
  assert.equal(requests.at(-1).get('priority'),'ALTA');
}));

test('HTTP and network failures are recoverable without changing filters',async()=>session(async page=>{
  let attempt=0;
  await page.route('**/api/tickets?**',async route=>{
    attempt++;
    if(attempt===1) await route.fulfill({status:500,json:{message:'Serviço indisponível'}});
    else if(attempt===2) await route.abort('failed');
    else await route.fulfill({json:[]});
  });
  await page.goto(base+'/tickets');
  await page.getByRole('alert').filter({hasText:'Serviço indisponível'}).waitFor();
  await page.getByRole('button',{name:'Tentar novamente'}).click();
  await page.getByRole('alert').filter({hasText:'Não foi possível conectar ao servidor'}).waitFor();
  await page.getByRole('button',{name:'Tentar novamente'}).click();
  await page.getByText('Nenhum chamado encontrado.',{exact:true}).waitFor();
  assert.equal(attempt,3);
  assert.equal(await page.locator('.state [role=alert]').count(),0);
}));
