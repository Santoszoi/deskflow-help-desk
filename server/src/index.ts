import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { connectDatabase } from './lib/db.js';

const app = express();
const PORT = Number(process.env.PORT || 3333);
if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) throw new Error('Set JWT_SECRET with at least 32 characters in production.');
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const db = await connectDatabase();

type Role = 'ADMIN' | 'AGENT' | 'USER';
type AuthUser = { id: number; name: string; email: string; role: Role };
interface AuthedRequest extends Request { user?: AuthUser }

app.use(cors({ origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : false }));
app.use(express.json());

async function initDb() {
  if (process.env.DEMO_SEED !== 'true') return;
  const count = await db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (count.count === 0) {
    const insert = db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)');
    const password = bcrypt.hashSync('123456', 10);
    await insert.run('Administrador', 'admin@deskflow.local', password, 'ADMIN');
    await insert.run('Ana Suporte', 'ana@deskflow.local', password, 'AGENT');
    await insert.run('Marcos NOC', 'Marcos@deskflow.local', password, 'AGENT');
    await insert.run('Usuário Demo', 'usuario@deskflow.local', password, 'USER');

    const getId = db.prepare('SELECT id FROM users WHERE email = ?');
    const admin = await getId.get('admin@deskflow.local') as { id: number };
    const ana = await getId.get('ana@deskflow.local') as { id: number };
    const Marcos = await getId.get('Marcos@deskflow.local') as { id: number };
    const user = await getId.get('usuario@deskflow.local') as { id: number };

    const insertTicket = db.prepare(`INSERT INTO tickets (title, description, category, priority, status, requester_id, assignee_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    const t1 = await insertTicket.run('Sem acesso à VPN corporativa', 'Ao conectar na VPN, recebo erro de autenticação mesmo após redefinir a senha.', 'Acesso / VPN', 'ALTA', 'EM_ATENDIMENTO', user.id, ana.id, seedTime('-2 hours'), seedTime('-35 minutes'));
    const t2 = await insertTicket.run('Impressora do financeiro offline', 'A impressora HP do setor financeiro não responde na rede.', 'Hardware', 'MEDIA', 'ABERTO', user.id, null, seedTime('-5 hours'), seedTime('-5 hours'));
    const t3 = await insertTicket.run('Link secundário com perda de pacotes', 'Monitoramento identificou perda intermitente no link de contingência.', 'Rede / Telecom', 'CRITICA', 'AGUARDANDO_USUARIO', admin.id, Marcos.id, seedTime('-1 day'), seedTime('-3 hours'));
    const t4 = await insertTicket.run('Instalação do Microsoft 365', 'Solicito instalação do pacote Office no notebook recém-formatado.', 'Software', 'BAIXA', 'RESOLVIDO', user.id, ana.id, seedTime('-2 days'), seedTime('-1 day'));

    const hist = db.prepare('INSERT INTO ticket_history (ticket_id, user_id, action, details, created_at) VALUES (?, ?, ?, ?, ?)');
    await hist.run(Number(t1.lastInsertRowid), user.id, 'CHAMADO_CRIADO', 'Prioridade ALTA', seedTime('-2 hours'));
    await hist.run(Number(t1.lastInsertRowid), ana.id, 'RESPONSAVEL_ALTERADO', 'Responsável definido como Ana Suporte', seedTime('-1 hour'));
    await hist.run(Number(t1.lastInsertRowid), ana.id, 'STATUS_ALTERADO', 'Status alterado para EM_ATENDIMENTO', seedTime('-35 minutes'));
    await hist.run(Number(t2.lastInsertRowid), user.id, 'CHAMADO_CRIADO', 'Prioridade MEDIA', seedTime('-5 hours'));
    await hist.run(Number(t3.lastInsertRowid), admin.id, 'CHAMADO_CRIADO', 'Prioridade CRITICA', seedTime('-1 day'));
    await hist.run(Number(t4.lastInsertRowid), user.id, 'CHAMADO_CRIADO', 'Prioridade BAIXA', seedTime('-2 days'));
  }
}
await initDb();

function auth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ message: 'Não autenticado.' });
  try {
    req.user = jwt.verify(header.slice(7), JWT_SECRET) as AuthUser;
    next();
  } catch {
    return res.status(401).json({ message: 'Sessão inválida ou expirada.' });
  }
}

function seedTime(offset:string){const [amount,unit]=offset.split(' ');const factor=unit.startsWith('day')?86400000:unit.startsWith('hour')?3600000:60000;return new Date(Date.now()+Number(amount)*factor).toISOString().slice(0,19).replace('T',' ')}

function canSeeTicket(user: AuthUser, requesterId: number) {
  return user.role !== 'USER' || user.id === requesterId;
}

app.get('/api/health', async (_req, res) => {await db.prepare('SELECT 1').get();res.json({ok:true,service:'DeskFlow API',database:db.engine})});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) return res.status(400).json({ message: 'E-mail e senha são obrigatórios.' });
  const user = await db.prepare('SELECT * FROM users WHERE lower(email) = lower(?)').get(email) as any;
  if (!user || !bcrypt.compareSync(password, user.password_hash)) return res.status(401).json({ message: 'Credenciais inválidas.' });
  const safeUser: AuthUser = { id: user.id, name: user.name, email: user.email, role: user.role };
  const token = jwt.sign(safeUser, JWT_SECRET, { expiresIn: '8h' });
  res.json({ token, user: safeUser });
});

app.get('/api/users/agents', auth, async (_req, res) => {
  const agents = await db.prepare("SELECT id, name, email, role FROM users WHERE role IN ('ADMIN','AGENT') ORDER BY name").all();
  res.json(agents);
});

app.get('/api/tickets', auth, async (req: AuthedRequest, res) => {
  const user = req.user!;
  const search = String(req.query.search || '').trim();
  const status = String(req.query.status || '').trim();
  const priority = String(req.query.priority || '').trim();
  const where: string[] = [];
  const params: any[] = [];
  if (user.role === 'USER') { where.push('t.requester_id = ?'); params.push(user.id); }
  if (search) { where.push('(t.title LIKE ? OR t.description LIKE ? OR CAST(t.id AS CHAR) LIKE ?)'); params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
  if (status) { where.push('t.status = ?'); params.push(status); }
  if (priority) { where.push('t.priority = ?'); params.push(priority); }
  const sql = `SELECT t.*, r.name requester_name, a.name assignee_name
    FROM tickets t JOIN users r ON r.id=t.requester_id LEFT JOIN users a ON a.id=t.assignee_id
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY CASE t.priority WHEN 'CRITICA' THEN 1 WHEN 'ALTA' THEN 2 WHEN 'MEDIA' THEN 3 ELSE 4 END, t.updated_at DESC`;
  res.json(await db.prepare(sql).all(...params));
});

app.post('/api/tickets', auth, async (req: AuthedRequest, res) => {
  const { title, description, asset, category, priority = 'MEDIA' } = req.body as any;
  if (!title?.trim() || !description?.trim() || !category?.trim()) return res.status(400).json({ message: 'Título, descrição e categoria são obrigatórios.' });
  const allowed = ['BAIXA','MEDIA','ALTA','CRITICA'];
  if (!allowed.includes(priority)) return res.status(400).json({ message: 'Prioridade inválida.' });
  const result = await db
  .prepare(
    `INSERT INTO tickets
    (title, description, asset, category, priority, requester_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
  )
  .run(
    title.trim(),
    description.trim(),
    asset?.trim() || null,
    category.trim(),
    priority,
    req.user!.id
  );
  await db.prepare('INSERT INTO ticket_history (ticket_id, user_id, action, details) VALUES (?, ?, ?, ?)')
    .run(result.lastInsertRowid, req.user!.id, 'CHAMADO_CRIADO', `Prioridade ${priority}`);
  res.status(201).json({ id: result.lastInsertRowid });
});

app.get('/api/tickets/:id', auth, async (req: AuthedRequest, res) => {
  const ticket = await db.prepare(`SELECT t.*, r.name requester_name, r.email requester_email, a.name assignee_name
    FROM tickets t JOIN users r ON r.id=t.requester_id LEFT JOIN users a ON a.id=t.assignee_id WHERE t.id=?`).get(String(req.params.id)) as any;
  if (!ticket) return res.status(404).json({ message: 'Chamado não encontrado.' });
  if (!canSeeTicket(req.user!, ticket.requester_id)) return res.status(403).json({ message: 'Sem permissão.' });
  const history = await db.prepare(`SELECT h.*, u.name user_name FROM ticket_history h JOIN users u ON u.id=h.user_id WHERE h.ticket_id=? ORDER BY h.created_at DESC`).all(String(req.params.id));
  const comments = await db.prepare(`SELECT c.*, u.name user_name, u.role user_role FROM ticket_comments c JOIN users u ON u.id=c.user_id WHERE c.ticket_id=? ORDER BY c.created_at ASC`).all(String(req.params.id));
  res.json({ ...ticket, history, comments });
});

app.patch('/api/tickets/:id', auth, async (req: AuthedRequest, res) => {
  const ticket = await db.prepare('SELECT * FROM tickets WHERE id=?').get(String(req.params.id)) as any;
  if (!ticket) return res.status(404).json({ message: 'Chamado não encontrado.' });
  if (req.user!.role === 'USER') return res.status(403).json({ message: 'Apenas equipe de suporte pode alterar classificação e atendimento.' });

  const fields: string[] = [];
  const values: any[] = [];
  const changes: Array<[string,string]> = [];
  const allowedStatus = ['ABERTO','EM_ATENDIMENTO','AGUARDANDO_USUARIO','RESOLVIDO','FECHADO'];
  const allowedPriority = ['BAIXA','MEDIA','ALTA','CRITICA'];
  const { status, priority, assignee_id } = req.body as any;

  if (status && allowedStatus.includes(status) && status !== ticket.status) { fields.push('status=?'); values.push(status); changes.push(['STATUS_ALTERADO', `${ticket.status} → ${status}`]); }
  if (priority && allowedPriority.includes(priority) && priority !== ticket.priority) { fields.push('priority=?'); values.push(priority); changes.push(['PRIORIDADE_ALTERADA', `${ticket.priority} → ${priority}`]); }
  if (assignee_id !== undefined && Number(assignee_id || 0) !== Number(ticket.assignee_id || 0)) {
    let name = 'Não atribuído';
    let normalized: number | null = null;
    if (assignee_id) {
      const agent = await db.prepare("SELECT id, name FROM users WHERE id=? AND role IN ('ADMIN','AGENT')").get(assignee_id) as any;
      if (!agent) return res.status(400).json({ message: 'Responsável inválido.' });
      normalized = agent.id; name = agent.name;
    }
    fields.push('assignee_id=?'); values.push(normalized); changes.push(['RESPONSAVEL_ALTERADO', `Responsável: ${name}`]);
  }
  if (!fields.length) return res.json({ ok: true });
  fields.push("updated_at=CURRENT_TIMESTAMP");
  await db.prepare(`UPDATE tickets SET ${fields.join(', ')} WHERE id=?`).run(...values, String(req.params.id));
  const insertHistory = db.prepare('INSERT INTO ticket_history (ticket_id, user_id, action, details) VALUES (?, ?, ?, ?)');
  for (const [action, details] of changes) await insertHistory.run(String(req.params.id), req.user!.id, action, details);
  res.json({ ok: true });
});

app.post('/api/tickets/:id/comments', auth, async (req: AuthedRequest, res) => {
  const ticket = await db.prepare('SELECT * FROM tickets WHERE id=?').get(String(req.params.id)) as any;
  if (!ticket) return res.status(404).json({ message: 'Chamado não encontrado.' });
  if (!canSeeTicket(req.user!, ticket.requester_id)) return res.status(403).json({ message: 'Sem permissão.' });
  const message = String(req.body.message || '').trim();
  if (!message) return res.status(400).json({ message: 'Comentário não pode ser vazio.' });
  await db.prepare('INSERT INTO ticket_comments (ticket_id, user_id, message) VALUES (?, ?, ?)').run(String(req.params.id), req.user!.id, message);
  await db.prepare('INSERT INTO ticket_history (ticket_id, user_id, action, details) VALUES (?, ?, ?, ?)').run(String(req.params.id), req.user!.id, 'COMENTARIO_ADICIONADO', 'Nova interação adicionada');
  await db.prepare('UPDATE tickets SET updated_at=CURRENT_TIMESTAMP WHERE id=?').run(String(req.params.id));
  res.status(201).json({ ok: true });
});

app.get('/api/dashboard', auth, async (req: AuthedRequest, res) => {
  const filter = req.user!.role === 'USER' ? 'WHERE requester_id = ?' : '';
  const params = req.user!.role === 'USER' ? [req.user!.id] : [];
  const total = (await db.prepare(`SELECT COUNT(*) count FROM tickets ${filter}`).get(...params) as any).count;
  const open = (await db.prepare(`SELECT COUNT(*) count FROM tickets ${filter ? filter + " AND" : 'WHERE'} status IN ('ABERTO','EM_ATENDIMENTO','AGUARDANDO_USUARIO')`).get(...params) as any).count;
  const resolved = (await db.prepare(`SELECT COUNT(*) count FROM tickets ${filter ? filter + " AND" : 'WHERE'} status IN ('RESOLVIDO','FECHADO')`).get(...params) as any).count;
  const critical = (await db.prepare(`SELECT COUNT(*) count FROM tickets ${filter ? filter + " AND" : 'WHERE'} priority='CRITICA' AND status NOT IN ('RESOLVIDO','FECHADO')`).get(...params) as any).count;
  const byStatus = await db.prepare(`SELECT status label, COUNT(*) value FROM tickets ${filter} GROUP BY status ORDER BY value DESC`).all(...params);
  const byPriority = await db.prepare(`SELECT priority label, COUNT(*) value FROM tickets ${filter} GROUP BY priority ORDER BY value DESC`).all(...params);
  const recent = await db.prepare(`SELECT t.id, t.title, t.priority, t.status, t.updated_at, a.name assignee_name FROM tickets t LEFT JOIN users a ON a.id=t.assignee_id ${req.user!.role === 'USER' ? 'WHERE t.requester_id=?' : ''} ORDER BY t.updated_at DESC LIMIT 5`).all(...params);
  res.json({ total, open, resolved, critical, byStatus, byPriority, recent });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ message: 'Erro interno do servidor.' });
});

const server = app.listen(PORT, '0.0.0.0', () => console.log(`DeskFlow API em http://localhost:${PORT} (${db.engine})`));
for (const signal of ['SIGTERM','SIGINT']) process.on(signal,()=>{server.close(()=>{void db.close().then(()=>process.exit(0))})});
