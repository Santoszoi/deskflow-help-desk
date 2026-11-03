'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth, Navigate, api, Empty, Loading, PageTitle, statusLabel, Badge, fmt } from '../shared';
import { ClipboardList, Clock3, ShieldCheck, AlertTriangle, Plus, ChevronRight } from 'lucide-react';

export default function Dashboard(){
 const {user}=useAuth();
 if(!user) return <Navigate href="/login" replace/>;
 const [data,setData]=useState<any>(null); const [error,setError]=useState('');
 useEffect(()=>{api('/dashboard').then(setData).catch(e=>setError(e.message))},[]);
 if(error)return <Empty text={error}/>; if(!data)return <Loading/>;
 const cards=[['Chamados totais',data.total,ClipboardList],['Em andamento',data.open,Clock3],['Resolvidos',data.resolved,ShieldCheck],['Críticos ativos',data.critical,AlertTriangle]];
 return <><PageTitle title="Dashboard" text="Visão geral da operação e dos chamados mais recentes." action={user.role !== 'VISITOR' && <Link className="primary linkbtn" href="/new"><Plus size={17}/> Novo chamado</Link>}/><div className="metric-grid">{cards.map(([label,val,Icon]:any)=><div className="metric" key={label}><div className="metric-icon"><Icon size={20}/></div><span>{label}</span><strong>{val}</strong></div>)}</div><div className="grid-2"><section className="panel"><div className="panel-title"><h3>Chamados por status</h3></div><div className="bars">{data.byStatus.map((x:any)=>{const max=Math.max(...data.byStatus.map((i:any)=>i.value),1);return <div className="bar-row" key={x.label}><div><span>{statusLabel[x.label]}</span><b>{x.value}</b></div><div className="bar"><i style={{width:`${Math.max(8,(x.value/max)*100)}%`}}/></div></div>})}</div></section><section className="panel"><div className="panel-title"><h3>Chamados por prioridade</h3></div><div className="priority-summary">{data.byPriority.map((x:any)=><div key={x.label}><Badge type="priority" value={x.label}/><strong>{x.value}</strong></div>)}</div></section></div><section className="panel recent"><div className="panel-title"><h3>Atualizações recentes</h3><Link href="/tickets">Ver todos</Link></div><div className="ticket-list">{data.recent.map((t:any)=><Link href={`/tickets/${t.id}`} className="ticket-row" key={t.id}><div className="ticket-id">#{t.id}</div><div className="ticket-main"><b>{t.title}</b><span>Atualizado {fmt(t.updated_at)} · {t.assignee_name || 'Não atribuído'}</span></div><Badge type="priority" value={t.priority}/><Badge type="status" value={t.status}/><ChevronRight size={18}/></Link>)}</div></section></>
}

