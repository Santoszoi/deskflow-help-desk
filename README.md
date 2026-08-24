# DeskFlow — Sistema de Help Desk / Chamados

Projeto full stack para portfólio de Suporte Técnico, Service Desk, Infraestrutura e NOC.

## Stack

- React 19 + TypeScript + Vite
- Node.js + Express + TypeScript
- SQLite com `better-sqlite3`
- JWT para autenticação
- `bcryptjs` para hash de senha
- Lucide React para ícones

## Funcionalidades

- Login com perfis `ADMIN`, `AGENT` e `USER`
- Dashboard com total, chamados em andamento, resolvidos e críticos
- Abertura de chamados
- Categorias, prioridade e status
- Atribuição de responsável
- Pesquisa por ID, título e descrição
- Filtros por status e prioridade
- Histórico auditável de alterações
- Comentários/interações dentro do chamado
- Permissões por perfil
- Layout responsivo
- Banco com dados de demonstração na primeira execução

## Usuários de demonstração

Todos usam a senha `123456`.

| Perfil | E-mail |
|---|---|
| Administrador | `admin@deskflow.local` |
| Agente | `ana@deskflow.local` |
| Agente | `carlos@deskflow.local` |
| Usuário | `usuario@deskflow.local` |

## Como executar

Requisitos: Node.js 20+ e npm.

```bash
npm run install:all
npm run dev
```

Acesse o front-end pelo endereço exibido pelo Vite (normalmente `http://localhost:5173`). A API roda em `http://localhost:3333`.

Durante desenvolvimento, o Vite deve encaminhar `/api` para o backend. Se sua instalação não fizer isso automaticamente, adicione o proxy no `vite.config.ts` conforme já incluído no projeto.

## Build de produção

```bash
npm run build
npm start
```

O backend serve o conteúdo compilado de `client/dist` quando ele existe.

## Banco de dados

O arquivo SQLite é criado automaticamente em:

```text
server/data/helpdesk.db
```

As tabelas são criadas no startup: `users`, `tickets`, `ticket_history` e `ticket_comments`.

## Próximas evoluções recomendadas

Para transformar este MVP em um projeto ainda mais forte de portfólio:

1. PostgreSQL + Prisma ORM.
2. SLA por prioridade e contador de vencimento.
3. Upload de anexos e evidências.
4. Notificação por e-mail.
5. Base de conhecimento / FAQ.
6. Inventário de ativos e vínculo do chamado ao equipamento.
7. Métricas de MTTA, MTTR e cumprimento de SLA.
8. Docker / Docker Compose.
9. Testes com Vitest/Jest e Supertest.
10. Deploy do front-end e API.

## Estrutura

```text
helpdesk-system/
├─ client/
│  ├─ src/
│  │  ├─ main.tsx
│  │  └─ styles.css
│  └─ package.json
├─ server/
│  ├─ src/
│  │  └─ index.ts
│  ├─ .env.example
│  └─ package.json
├─ package.json
└─ README.md
```
