'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth, Navigate, api, PageTitle, statusLabel, priorityLabel, Loading, Empty, Badge, fmt, type TicketItem } from '../shared';
import { Plus, Search, ChevronRight } from 'lucide-react';

export default function Tickets(){
 const {user}=useAuth();
 if(!user) return <Navigate href="/login" replace/>;
 const [tickets,setTickets]=useState<TicketItem[]>([]); const [search,setSearch]=useState(''); const [status,setStatus]=useState(''); const [priority,setPriority]=useState(''); const [loading,setLoading]=useState(true); const [error,setError]=useState('');
 const [retry,setRetry]=useState(0);
 useEffect(()=>{
  const controller=new AbortController();
  let active=true;
  setLoading(true);setError('');setTickets([]);
  const timer=setTimeout(async()=>{
   try {
    const result=await api<TicketItem[]>(`/tickets?search=${encodeURIComponent(search)}&status=${status}&priority=${priority}`,{signal:controller.signal});
    if(active)setTickets(result);
   } catch(error) {
    if(active)setError(error instanceof TypeError?'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.':error instanceof Error?error.message:'Não foi possível carregar os chamados.');
   } finally {
    if(active)setLoading(false);
   }
  },250);
  return()=>{active=false;clearTimeout(timer);controller.abort()};
 },[search,status,priority,retry]);
 return <><PageTitle title="Chamados" text="Pesquise, filtre e acompanhe a fila de atendimento." action={user.role !== 'VISITOR' && <Link className="primary linkbtn" href="/new"><Plus size={17}/> Novo chamado</Link>}/><section className="panel filters"><div className="search"><Search size={18}/><input aria-label="Pesquisar chamados" placeholder="Pesquisar por ID, título ou descrição..." value={search} onChange={e=>setSearch(e.target.value)}/></div><select aria-label="Filtrar por status" value={status} onChange={e=>setStatus(e.target.value)}><option value="">Todos os status</option>{Object.entries(statusLabel).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select><select aria-label="Filtrar por prioridade" value={priority} onChange={e=>setPriority(e.target.value)}><option value="">Todas as prioridades</option>{Object.entries(priorityLabel).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></section><section className="panel"><div className="panel-title"><h3 aria-live="polite">{loading?'Carregando chamados...':error?'Chamados indisponíveis':`${tickets.length} chamado(s)`}</h3></div>{loading?<Loading/>:error?<div className="state"><p role="alert">{error}</p><button type="button" className="secondary" onClick={()=>setRetry(value=>value+1)}>Tentar novamente</button></div>:<div className="ticket-list">{tickets.length?tickets.map(t=><Link href={`/tickets/${t.id}`} className="ticket-row detailed" key={t.id}><div className="ticket-id">#{t.id}</div><div className="ticket-main"><b>{t.title}</b><span>{t.category} · Solicitante: {t.requester_name} · {t.assignee_name||'Não atribuído'}</span></div><Badge type="priority" value={t.priority}/><Badge type="status" value={t.status}/><span className="updated">{fmt(t.updated_at)}</span><ChevronRight size={18}/></Link>):<Empty text="Nenhum chamado encontrado."/>}</div>}</section></>
}

