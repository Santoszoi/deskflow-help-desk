import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const base = process.env.TEST_WEB_URL || 'http://127.0.0.1:3100';
const ticket = { id: 1, title: 'VPN indisponível', description: 'Falha de acesso', category: 'Rede / Telecom', priority: 'ALTA', status: 'ABERTO', requester_name: 'Marcos', created_at: '2026-11-02 09:00:00', updated_at: '2026-11-02 09:00:00', comments: [], history: [] };

test('production routes load on demand and preserve keyboard navigation', async () => {
  const browser = await chromium.launch({ executablePath: process.env.TEST_CHROMIUM_PATH || undefined });
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const scripts = new Map();
    const pending = [];
    page.on('response', response => {
      if (new URL(response.url()).pathname.endsWith('.js')) {
        pending.push(response.body().then(body => scripts.set(new URL(response.url()).pathname, body)));
      }
    });
    await page.route('**/api/**', async route => {
      const path = new URL(route.request().url()).pathname;
      let json;
      if (path === '/api/dashboard') json = { total: 1, open: 1, resolved: 0, critical: 0, byStatus: [{label:'ABERTO',value:1}], byPriority: [{label:'ALTA',value:1}], recent: [ticket] };
      else if (path === '/api/tickets' && route.request().method() === 'POST') json = {id:1};
      else if (path === '/api/tickets') json = [ticket];
      else if (path === '/api/tickets/1') json = ticket;
      else throw new Error(`Unexpected API request: ${path}`);
      await route.fulfill({json});
    });
    await page.goto(base + '/login');
    await page.getByRole('heading', {name:'Entrar no Help Desk'}).waitFor();
    await page.waitForLoadState('networkidle');
    await Promise.all(pending);
    const loginBytes = [...scripts.values()].reduce((sum, body) => sum + body.length, 0);
    await page.evaluate(() => {
      localStorage.setItem('user', JSON.stringify({id:1,name:'Marcos',email:'fixture@example.test',role:'USER'}));
      localStorage.setItem('token', 'local-test-fixture');
    });
    scripts.clear(); pending.length = 0;
    await page.goto(base + '/');
    await page.getByRole('heading', {name:'Dashboard',exact:true}).waitFor();
    await page.waitForLoadState('networkidle');
    await Promise.all(pending);
    const dashboardBytes = [...scripts.values()].reduce((sum, body) => sum + body.length, 0);
    const source = [...scripts.values()].map(body => body.toString()).join('\n');
    if (!process.env.BUNDLE_BASELINE) {
      assert.ok(!source.includes('Descreva o problema, mensagens de erro'), 'new-ticket screen must not be in initial dashboard scripts');
      assert.ok(!source.includes('Adicione uma atualização, teste realizado'), 'detail screen must not be in initial dashboard scripts');
      assert.ok(!source.includes('Pesquisar por ID, título ou descrição'), 'ticket list must not be in initial dashboard scripts');
    }
    await mkdir('test-results', {recursive:true});
    const report = { unit:'decoded JavaScript bytes (not network compression or load time)', loginBytes, dashboardBytes, dashboardScripts:[...scripts.keys()] };
    await writeFile(`test-results/bundle-${process.env.BUNDLE_BASELINE ? 'before' : 'after'}.json`, JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report));

    const newTicket = page.getByRole('link', {name:'Novo chamado'}).first();
    await newTicket.focus();
    await page.keyboard.press('Enter');
    const title = page.getByRole('textbox', {name:'Título',exact:true});
    await title.waitFor();
    await title.focus();
    await page.keyboard.type('VPN indisponível');
    await page.keyboard.press('Tab');
    assert.equal(await page.getByRole('textbox', {name:'Equipamento / Ativo'}).evaluate(el => el === document.activeElement), true);
    await page.getByRole('textbox', {name:'Descrição',exact:true}).fill('Falha de acesso');
    await page.getByRole('button', {name:'Abrir chamado',exact:true}).click();
    await page.getByRole('heading', {name:ticket.title,exact:true}).waitFor();
    await page.getByRole('link', {name:'← Voltar para chamados'}).click();
    await page.getByLabel('Pesquisar chamados').waitFor();
    await page.getByText(ticket.title,{exact:true}).waitFor();
    await page.reload();
    await page.getByText(ticket.title,{exact:true}).waitFor();
    await page.evaluate(() => localStorage.setItem('user', JSON.stringify({id:2,name:'Visitante',role:'VISITOR'})));
    await page.goto(base + '/new');
    await page.waitForURL(base + '/tickets');
    await page.getByLabel('Pesquisar chamados').waitFor();
    assert.equal(await page.getByRole('link', {name:'Novo chamado'}).count(), 0);
    await page.goto(base + '/tickets/1');
    await page.getByRole('heading', {name:ticket.title,exact:true}).waitFor();
    assert.equal(await page.getByRole('button', {name:'Adicionar comentário'}).count(), 0);
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});
