'use client';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { BarChart3, ClipboardList, LogOut, Plus, Search, ShieldCheck, Ticket, UserRound, Clock3, MessageSquare, ChevronRight, Menu, X, AlertTriangle } from 'lucide-react';



function useLocation(){return {pathname:usePathname()};}
function useNavigate(){const router=useRouter();return useCallback((href:string)=>router.push(href),[router]);}
function useParams(){return {id:usePathname().split('/')[2]};}
function Navigate({href,replace=false}:{href:string;replace?:boolean}){
 const router=useRouter();useEffect(()=>{if(replace)router.replace(href);else router.push(href)},[href,replace,router]);return <Loading/>;
}

type Role = 'ADMIN' | 'AGENT' | 'USER' | 'VISITOR';
type User = { id:number; name:string; email:string; role:Role };
type TicketItem = { id:number; title:string; description:string; category:string; priority:string; status:string; requester_name:string; assignee_name?:string; created_at:string; updated_at:string };
const API = '/api';

async function api<T>(path:string, options:RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const res = await fetch(API + path, { ...options, headers: { 'Content-Type':'application/json', ...(token ? { Authorization:`Bearer ${token}` } : {}), ...(options.headers || {}) } });
  const data = await res.json().catch(()=>({}));
  if (!res.ok) throw new Error(data.message || 'Erro na requisição');
  return data;
}

const AuthContext = createContext<any>(null);
function AuthProvider({children}:{children:React.ReactNode}) {
  const [user,setUser] = useState<User|null>(()=>{ try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; } });
  const login = async(email:string,password:string)=>{ const data = await api<{token:string;user:User}>('/auth/login',{method:'POST',body:JSON.stringify({email,password})}); localStorage.setItem('token',data.token); localStorage.setItem('user',JSON.stringify(data.user)); setUser(data.user); };
  const visit = async()=>{ const data = await api<{token:string;user:User}>('/auth/visitor',{method:'POST'}); localStorage.setItem('token',data.token); localStorage.setItem('user',JSON.stringify(data.user)); setUser(data.user); };
  const logout=()=>{ localStorage.removeItem('token'); localStorage.removeItem('user'); setUser(null); };
  return <AuthContext.Provider value={{user,login,visit,logout}}>{children}</AuthContext.Provider>;
}
type AuthContextValue = {
  user: User | null;
  login: (email:string,password:string)=>Promise<void>;
  visit: ()=>Promise<void>;
  logout: ()=>void;
};
function useAuth(){
  const context = useContext(AuthContext) as AuthContextValue | null;
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

const statusLabel:Record<string,string>={ABERTO:'Aberto',EM_ATENDIMENTO:'Em atendimento',AGUARDANDO_USUARIO:'Aguardando usuário',RESOLVIDO:'Resolvido',FECHADO:'Fechado'};
const priorityLabel:Record<string,string>={BAIXA:'Baixa',MEDIA:'Média',ALTA:'Alta',CRITICA:'Crítica'};
const fmt=(d:string)=>new Date(d.replace(' ','T')+'Z').toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'});
function Badge({type,value}:{type:'status'|'priority';value:string}) { return <span className={`badge ${type} ${value.toLowerCase()}`}>{type==='status'?statusLabel[value]:priorityLabel[value]}</span>; }

function Login(){
  const {user,login,visit}=useAuth(); const nav=useNavigate();
  const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [error,setError]=useState(''); const [loading,setLoading]=useState(false);
  if(user) return <Navigate href="/" replace/>;
  async function submit(e:React.FormEvent){e.preventDefault();setLoading(true);setError('');try{await login(email,password);nav('/');}catch(e:any){setError(e.message)}finally{setLoading(false)}}
  async function enterVisitor(){setLoading(true);setError('');try{await visit();nav('/');}catch(e:any){setError(e.message)}finally{setLoading(false)}}
  return <div className="login-page"><div className="login-visual"><div><div className="brand mark"><Ticket size={24}/> DeskFlow</div><h1>Suporte técnico<br/>sem ruído.</h1><p>Centralize chamados, priorize incidentes e acompanhe cada interação do atendimento.</p><div className="login-points"><span><ShieldCheck size={18}/> Histórico auditável</span><span><BarChart3 size={18}/> Indicadores em tempo real</span><span><UserRound size={18}/> Perfis e responsáveis</span></div></div></div><form className="login-card" onSubmit={submit}><div className="mobile-brand"><Ticket size={23}/> DeskFlow</div><h2>Entrar no Help Desk</h2><p>Acesse a central de atendimento.</p><label>E-mail<input value={email} onChange={e=>setEmail(e.target.value)} type="email" required/></label><label>Senha<input value={password} onChange={e=>setPassword(e.target.value)} type="password" required/></label>{error&&<div className="error">{error}</div>}<button className="primary" disabled={loading}>{loading?'Entrando...':'Entrar'}</button><div className="demo-box"><b>Conheça o DeskFlow</b><span>Explore dados fictícios em modo somente leitura.</span><button type="button" className="secondary" disabled={loading} onClick={enterVisitor}>Entrar como visitante</button></div></form></div>
}

function Layout(){
 const {user,logout}=useAuth(); const loc=useLocation(); const [mobile,setMobile]=useState(false);
 if(!user) return <Navigate href="/login" replace/>;
 const currentUser = user;
 const links=[['/',BarChart3,'Dashboard'],['/tickets',ClipboardList,'Chamados'],...(currentUser.role === 'VISITOR' ? [] : [['/new',Plus,'Novo chamado']])];
 return <div className="app-shell"><aside className={mobile?'sidebar open':'sidebar'}><div className="brand"><Ticket size={24}/> DeskFlow<button className="icon mobile-close" onClick={()=>setMobile(false)}><X/></button></div><nav>{links.map(([href,Icon,label]:any)=><Link key={href} href={href} onClick={()=>setMobile(false)} className={(href==='/'?loc.pathname===href:loc.pathname.startsWith(href))?'active':''}><Icon size={19}/>{label}</Link>)}</nav><div className="sidebar-bottom"><div className="user-mini"><div className="avatar">{currentUser.name[0]}</div><div><b>{currentUser.name}</b><span>{currentUser.role}</span></div></div><button className="logout" onClick={logout}><LogOut size={17}/> Sair</button></div></aside><main><header><button className="icon menu" onClick={()=>setMobile(true)}><Menu/></button><div><span className="eyebrow">Central de Serviços de TI</span><b>DeskFlow</b></div><div className="header-user"><span>{currentUser.name}</span><div className="avatar small">{currentUser.name[0]}</div></div></header><div className="content">{currentUser.role === 'VISITOR' && <div className="demo-box" role="status"><b>Modo visitante · Somente leitura</b><span>Dados fictícios. Os chamados reais não aparecem nesta demonstração.</span></div>}{loc.pathname === '/' ? <Dashboard/> : loc.pathname === '/tickets' ? <Tickets/> : loc.pathname === '/new' ? (currentUser.role === 'VISITOR' ? <Navigate href="/tickets" replace/> : <NewTicket/>) : /^\/tickets\/\d+$/.test(loc.pathname) ? <TicketDetail key={loc.pathname}/> : <Navigate href="/"/>}</div></main></div>
}

function Dashboard(){
 const {user}=useAuth();
 if(!user) return <Navigate href="/login" replace/>;
 const [data,setData]=useState<any>(null); const [error,setError]=useState('');
 useEffect(()=>{api('/dashboard').then(setData).catch(e=>setError(e.message))},[]);
 if(error)return <Empty text={error}/>; if(!data)return <Loading/>;
 const cards=[['Chamados totais',data.total,ClipboardList],['Em andamento',data.open,Clock3],['Resolvidos',data.resolved,ShieldCheck],['Críticos ativos',data.critical,AlertTriangle]];
 return <><PageTitle title="Dashboard" text="Visão geral da operação e dos chamados mais recentes." action={user.role !== 'VISITOR' && <Link className="primary linkbtn" href="/new"><Plus size={17}/> Novo chamado</Link>}/><div className="metric-grid">{cards.map(([label,val,Icon]:any)=><div className="metric" key={label}><div className="metric-icon"><Icon size={20}/></div><span>{label}</span><strong>{val}</strong></div>)}</div><div className="grid-2"><section className="panel"><div className="panel-title"><h3>Chamados por status</h3></div><div className="bars">{data.byStatus.map((x:any)=>{const max=Math.max(...data.byStatus.map((i:any)=>i.value),1);return <div className="bar-row" key={x.label}><div><span>{statusLabel[x.label]}</span><b>{x.value}</b></div><div className="bar"><i style={{width:`${Math.max(8,(x.value/max)*100)}%`}}/></div></div>})}</div></section><section className="panel"><div className="panel-title"><h3>Chamados por prioridade</h3></div><div className="priority-summary">{data.byPriority.map((x:any)=><div key={x.label}><Badge type="priority" value={x.label}/><strong>{x.value}</strong></div>)}</div></section></div><section className="panel recent"><div className="panel-title"><h3>Atualizações recentes</h3><Link href="/tickets">Ver todos</Link></div><div className="ticket-list">{data.recent.map((t:any)=><Link href={`/tickets/${t.id}`} className="ticket-row" key={t.id}><div className="ticket-id">#{t.id}</div><div className="ticket-main"><b>{t.title}</b><span>Atualizado {fmt(t.updated_at)} · {t.assignee_name || 'Não atribuído'}</span></div><Badge type="priority" value={t.priority}/><Badge type="status" value={t.status}/><ChevronRight size={18}/></Link>)}</div></section></>
}

function Tickets(){
 const {user}=useAuth();
 if(!user) return <Navigate href="/login" replace/>;
 const [tickets,setTickets]=useState<TicketItem[]>([]); const [search,setSearch]=useState(''); const [status,setStatus]=useState(''); const [priority,setPriority]=useState(''); const [loading,setLoading]=useState(true); const [error,setError]=useState('');
 const load=()=>{setLoading(true);setError('');api<TicketItem[]>(`/tickets?search=${encodeURIComponent(search)}&status=${status}&priority=${priority}`).then(setTickets).catch(e=>{setTickets([]);setError(e instanceof Error?e.message:'Não foi possível carregar os chamados.')}).finally(()=>setLoading(false))};
 useEffect(()=>{const t=setTimeout(load,250);return()=>clearTimeout(t)},[search,status,priority]);
 return <><PageTitle title="Chamados" text="Pesquise, filtre e acompanhe a fila de atendimento." action={user.role !== 'VISITOR' && <Link className="primary linkbtn" href="/new"><Plus size={17}/> Novo chamado</Link>}/><section className="panel filters"><div className="search"><Search size={18}/><input placeholder="Pesquisar por ID, título ou descrição..." value={search} onChange={e=>setSearch(e.target.value)}/></div><select aria-label="Filtrar por status" value={status} onChange={e=>setStatus(e.target.value)}><option value="">Todos os status</option>{Object.entries(statusLabel).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select><select aria-label="Filtrar por prioridade" value={priority} onChange={e=>setPriority(e.target.value)}><option value="">Todas as prioridades</option>{Object.entries(priorityLabel).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></section><section className="panel"><div className="panel-title"><h3>{tickets.length} chamado(s)</h3></div>{loading?<Loading/>:error?<Empty text={error}/>:<div className="ticket-list">{tickets.length?tickets.map(t=><Link href={`/tickets/${t.id}`} className="ticket-row detailed" key={t.id}><div className="ticket-id">#{t.id}</div><div className="ticket-main"><b>{t.title}</b><span>{t.category} · Solicitante: {t.requester_name} · {t.assignee_name||'Não atribuído'}</span></div><Badge type="priority" value={t.priority}/><Badge type="status" value={t.status}/><span className="updated">{fmt(t.updated_at)}</span><ChevronRight size={18}/></Link>):<Empty text="Nenhum chamado encontrado."/>}</div>}</section></>
}

function NewTicket(){
 const nav=useNavigate(); const [form,setForm]=useState({title:'',description:'',asset:"",category:'Acesso / VPN',priority:'MEDIA'}); const [loading,setLoading]=useState(false); const [error,setError]=useState('');
 const change=(k:string,v:string)=>setForm({...form,[k]:v});
 async function submit(e:React.FormEvent){e.preventDefault();setLoading(true);setError('');try{const d=await api<{id:number}>('/tickets',{method:'POST',body:JSON.stringify(form)});nav(`/tickets/${d.id}`)}catch(e:any){setError(e.message)}finally{setLoading(false)}}
 return <><PageTitle title="Novo chamado" text="Registre uma solicitação ou incidente para a equipe de TI."/><form className="panel form-card" onSubmit={submit}><div className="form-grid"><label className="span-2">Título<input value={form.title} onChange={e=>change('title',e.target.value)} placeholder="Ex.: Usuário sem acesso à VPN" required/></label>

<label>
  Equipamento / Ativo
  <input
    value={form.asset}
    onChange={(e) => change("asset", e.target.value)}
    placeholder="Ex.: Notebook Dell, PC-023, Roteador..."
  />
</label>

<label>Categoria<select aria-label="Categoria" value={form.category} onChange={e=>change('category',e.target.value)}><option>Acesso / VPN</option><option>Hardware</option><option>Software</option><option>Rede / Telecom</option><option>E-mail / Microsoft 365</option><option>Segurança</option><option>Outro</option></select></label><label>Prioridade<select aria-label="Prioridade" value={form.priority} onChange={e=>change('priority',e.target.value)}><option value="BAIXA">Baixa</option><option value="MEDIA">Média</option><option value="ALTA">Alta</option><option value="CRITICA">Crítica</option></select></label><label className="span-2">Descrição<textarea rows={8} value={form.description} onChange={e=>change('description',e.target.value)} placeholder="Descreva o problema, mensagens de erro e testes já realizados..." required/></label></div>{error&&<div className="error">{error}</div>}<div className="form-actions"><Link href="/tickets" className="secondary linkbtn">Cancelar</Link><button className="primary" disabled={loading}>{loading?'Abrindo...':'Abrir chamado'}</button></div></form></>
}

function TicketDetail(){
 const {id}=useParams(); const {user}=useAuth();
 if(!user) return <Navigate href="/login" replace/>; const [ticket,setTicket]=useState<any>(null); const [agents,setAgents]=useState<any[]>([]); const [comment,setComment]=useState(''); const [error,setError]=useState('');
 const load=()=>api<any>(`/tickets/${id}`).then(setTicket).catch(e=>setError(e.message));
 useEffect(()=>{load(); if((user.role==='ADMIN'||user.role==='AGENT'))api<any[]>('/users/agents').then(setAgents)},[id]);
 async function update(field:string,value:any){setError('');try{await api(`/tickets/${id}`,{method:'PATCH',body:JSON.stringify({[field]:value})});await load()}catch(e){setError(e instanceof Error?e.message:'Não foi possível atualizar o chamado.')}}
 async function addComment(e:React.FormEvent){e.preventDefault();if(!comment.trim())return;setError('');try{await api(`/tickets/${id}/comments`,{method:'POST',body:JSON.stringify({message:comment})});setComment('');await load()}catch(e){setError(e instanceof Error?e.message:'Não foi possível adicionar o comentário.')}}
 if(error)return <Empty text={error}/>; if(!ticket)return <Loading/>;
 return <><div className="detail-head"><div><Link href="/tickets" className="back">← Voltar para chamados</Link><div className="title-line"><span>#{ticket.id}</span><h1>{ticket.title}</h1></div><div className="badges"><Badge type="priority" value={ticket.priority}/><Badge type="status" value={ticket.status}/><span className="category">{ticket.category}</span></div></div></div><div className="detail-grid"><div className="detail-main"><section className="panel"><h3>Descrição</h3><p className="description">{ticket.description}</p><div className="meta-grid"><div><span>Solicitante</span><b>{ticket.requester_name}</b><small>{ticket.requester_email}</small></div><div><span>Responsável</span><b>{ticket.assignee_name||'Não atribuído'}</b></div><div><span>Criado em</span><b>{fmt(ticket.created_at)}</b></div><div><span>Última atualização</span><b>{fmt(ticket.updated_at)}</b></div></div></section><section className="panel"><div className="panel-title"><h3>Interações</h3><MessageSquare size={19}/></div><div className="comments">{ticket.comments.length?ticket.comments.map((c:any)=><div className="comment" key={c.id}><div className="avatar small">{c.user_name[0]}</div><div><div><b>{c.user_name}</b><span>{fmt(c.created_at)}</span></div><p>{c.message}</p></div></div>):<p className="muted">Ainda não há comentários neste chamado.</p>}</div>{user.role !== 'VISITOR' && <form className="comment-form" onSubmit={addComment}><textarea value={comment} onChange={e=>setComment(e.target.value)} rows={3} placeholder="Adicione uma atualização, teste realizado ou orientação..."/><button className="primary">Adicionar comentário</button></form>}</section></div><aside className="detail-side">{(user.role==='ADMIN'||user.role==='AGENT')&&<section className="panel controls"><h3>Atendimento</h3><label>Status<select aria-label="Status" value={ticket.status} onChange={e=>update('status',e.target.value)}>{Object.entries(statusLabel).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label><label>Prioridade<select aria-label="Prioridade" value={ticket.priority} onChange={e=>update('priority',e.target.value)}>{Object.entries(priorityLabel).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label><label>Responsável<select aria-label="Responsável" value={ticket.assignee_id||''} onChange={e=>update('assignee_id',e.target.value?Number(e.target.value):null)}><option value="">Não atribuído</option>{agents.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></label></section>}<section className="panel timeline"><h3>Histórico</h3>{ticket.history.map((h:any)=><div className="history" key={h.id}><i/><div><b>{h.action.replaceAll('_',' ')}</b><p>{h.details}</p><span>{h.user_name} · {fmt(h.created_at)}</span></div></div>)}</section></aside></div></>
}

function PageTitle({title,text,action}:{title:string;text:string;action?:React.ReactNode}){return <div className="page-title"><div><h1>{title}</h1><p>{text}</p></div>{action}</div>}
function Loading(){return <div className="state">Carregando...</div>}
function Empty({text}:{text:string}){return <div className="state">{text}</div>}

function MountedApp(){const pathname=usePathname();return <AuthProvider>{pathname === '/login' ? <Login/> : <Layout/>}</AuthProvider>}
export default function DeskFlow(){
 const [mounted,setMounted]=useState(false);
 useEffect(()=>setMounted(true),[]);
 return mounted ? <MountedApp/> : <Loading/>;
}
