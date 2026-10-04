import type { Request, Response } from 'express';

// An isolated, read-only showcase. Never query the operational database here.
const created = '2026-10-01 12:00:00';
const updated = '2026-10-02 14:30:00';
const tickets = [
  { id: 900001, title: 'Ajustar formulário de contato', description: 'Exemplo fictício: revisar a validação do formulário do site.', asset: 'Site de demonstração', category: 'Software', priority: 'ALTA', status: 'EM_ATENDIMENTO', requester_id: 900010, requester_name: 'Cliente Exemplo', requester_email: 'cliente@example.invalid', assignee_id: 900020, assignee_name: 'Marcos', created_at: created, updated_at: updated },
  { id: 900002, title: 'Configurar relatório de atendimento', description: 'Exemplo fictício: organizar os indicadores de chamados resolvidos.', asset: 'Painel de demonstração', category: 'Software', priority: 'MEDIA', status: 'RESOLVIDO', requester_id: 900010, requester_name: 'Cliente Exemplo', requester_email: 'cliente@example.invalid', assignee_id: 900020, assignee_name: 'Marcos', created_at: created, updated_at: updated }
];

export function visitorResponse(req: Request, res: Response) {
  res.setHeader('Cache-Control', 'no-store');
  if (!['GET', 'HEAD'].includes(req.method)) {
    return res.status(403).json({ message: 'O acesso de visitante permite somente consulta.' });
  }
  const path = req.path.replace(/\/+$/, '');
  if (path === '/api/tickets') {
    const search = String(req.query.search || '').toLocaleLowerCase('pt-BR');
    return res.json(tickets.filter(t =>
      (!req.query.status || t.status === req.query.status) &&
      (!req.query.priority || t.priority === req.query.priority) &&
      `${t.id} ${t.title} ${t.description}`.toLocaleLowerCase('pt-BR').includes(search)
    ));
  }
  if (path === '/api/dashboard') {
    const grouped = (key: 'status' | 'priority') => Object.entries(tickets.reduce<Record<string, number>>((result, t) => {
      result[t[key]] = (result[t[key]] || 0) + 1; return result;
    }, {})).map(([label, value]) => ({ label, value }));
    const resolved = tickets.filter(t => ['RESOLVIDO', 'FECHADO'].includes(t.status)).length;
    return res.json({ total: tickets.length, open: tickets.length - resolved, resolved, critical: 0, byStatus: grouped('status'), byPriority: grouped('priority'), recent: tickets });
  }
  if (path === '/api/users/agents') return res.json([{ id: 900020, name: 'Marcos', role: 'AGENT' }]);
  const match = /^\/api\/tickets\/(\d+)$/.exec(path);
  const ticket = match && tickets.find(t => t.id === Number(match[1]));
  if (ticket) return res.json({ ...ticket,
    history: [{ id: 900030, action: 'CHAMADO_CRIADO', details: 'Registro fictício para apresentação.', user_name: 'Cliente Exemplo', created_at: created }],
    comments: [{ id: 900040, user_name: 'Marcos', user_role: 'AGENT', message: 'Exemplo de acompanhamento do atendimento.', created_at: updated }]
  });
  return res.status(404).json({ message: 'Página não disponível na demonstração.' });
}
