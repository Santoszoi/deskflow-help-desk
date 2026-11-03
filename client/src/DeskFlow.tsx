'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { BarChart3, ClipboardList, LogOut, Plus, ShieldCheck, Ticket, UserRound, Menu, X } from 'lucide-react';
import { AuthProvider, useAuth, useNavigate, useLocation, Navigate, Loading } from './shared';

const Dashboard = dynamic(() => import('./screens/Dashboard'), { loading: Loading });
const Tickets = dynamic(() => import('./screens/Tickets'), { loading: Loading });
const NewTicket = dynamic(() => import('./screens/NewTicket'), { loading: Loading });
const TicketDetail = dynamic(() => import('./screens/TicketDetail'), { loading: Loading });

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

function MountedApp(){const pathname=usePathname();return <AuthProvider>{pathname === '/login' ? <Login/> : <Layout/>}</AuthProvider>}
export default function DeskFlow(){
 const [mounted,setMounted]=useState(false);
 useEffect(()=>setMounted(true),[]);
 return mounted ? <MountedApp/> : <Loading/>;
}
