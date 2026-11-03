'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useNavigate, api, PageTitle } from '../shared';

export default function NewTicket(){
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

