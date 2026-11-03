'use client';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export function useLocation(){return {pathname:usePathname()};}
export function useNavigate(){const router=useRouter();return useCallback((href:string)=>router.push(href),[router]);}
export function useParams(){return {id:usePathname().split('/')[2]};}
export function Navigate({href,replace=false}:{href:string;replace?:boolean}){
 const router=useRouter();useEffect(()=>{if(replace)router.replace(href);else router.push(href)},[href,replace,router]);return <Loading/>;
}

type Role = 'ADMIN' | 'AGENT' | 'USER' | 'VISITOR';
type User = { id:number; name:string; email:string; role:Role };
export type TicketItem = { id:number; title:string; description:string; category:string; priority:string; status:string; requester_name:string; assignee_name?:string; created_at:string; updated_at:string };
const API = '/api';

export async function api<T>(path:string, options:RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const res = await fetch(API + path, { ...options, headers: { 'Content-Type':'application/json', ...(token ? { Authorization:`Bearer ${token}` } : {}), ...(options.headers || {}) } });
  const data = await res.json().catch(()=>({}));
  if (!res.ok) throw new Error(data.message || 'Erro na requisição');
  return data;
}

type AuthContextValue = {
  user: User | null;
  login: (email:string,password:string)=>Promise<void>;
  visit: ()=>Promise<void>;
  logout: ()=>void;
};
const AuthContext = createContext<AuthContextValue | null>(null);
export function AuthProvider({children}:{children:React.ReactNode}) {
  const [user,setUser] = useState<User|null>(()=>{ try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; } });
  const login = async(email:string,password:string)=>{ const data = await api<{token:string;user:User}>('/auth/login',{method:'POST',body:JSON.stringify({email,password})}); localStorage.setItem('token',data.token); localStorage.setItem('user',JSON.stringify(data.user)); setUser(data.user); };
  const visit = async()=>{ const data = await api<{token:string;user:User}>('/auth/visitor',{method:'POST'}); localStorage.setItem('token',data.token); localStorage.setItem('user',JSON.stringify(data.user)); setUser(data.user); };
  const logout=()=>{ localStorage.removeItem('token'); localStorage.removeItem('user'); setUser(null); };
  return <AuthContext.Provider value={{user,login,visit,logout}}>{children}</AuthContext.Provider>;
}
export function useAuth(){
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export const statusLabel:Record<string,string>={ABERTO:'Aberto',EM_ATENDIMENTO:'Em atendimento',AGUARDANDO_USUARIO:'Aguardando usuário',RESOLVIDO:'Resolvido',FECHADO:'Fechado'};
export const priorityLabel:Record<string,string>={BAIXA:'Baixa',MEDIA:'Média',ALTA:'Alta',CRITICA:'Crítica'};
export const fmt=(d:string)=>new Date(d.replace(' ','T')+'Z').toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'});
export function Badge({type,value}:{type:'status'|'priority';value:string}) { return <span className={`badge ${type} ${value.toLowerCase()}`}>{type==='status'?statusLabel[value]:priorityLabel[value]}</span>; }

export function PageTitle({title,text,action}:{title:string;text:string;action?:React.ReactNode}){return <div className="page-title"><div><h1>{title}</h1><p>{text}</p></div>{action}</div>}
export function Loading(){return <div className="state" role="status">Carregando...</div>}
export function Empty({text}:{text:string}){return <div className="state">{text}</div>}

