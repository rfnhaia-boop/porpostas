# NEX — CRM & Quotes

SaaS de propostas/orçamentos: cadastro de clientes e serviços, montagem de orçamento
em 6 templates, envio por link público (`/p/<token>`) onde o cliente aprova ou recusa,
e o dono acompanha por notificações in-app + e-mail.

## Stack
Next 16 (App Router, Turbopack) · React 19 · Tailwind v4 · Prisma 6 + PostgreSQL ·
Better Auth (e-mail/senha, multi-tenant) · TanStack Query · Zustand · Resend.

## Rodar local

```bash
npm install
cp .env.example .env          # ajuste se necessário
docker compose up -d          # Postgres na porta 5435
npx prisma migrate deploy
npm run dev                    # http://localhost:3000 (ou 3001)
```

Scripts úteis: `npm run db:studio`, `npm run db:migrate`, `npm run db:up|db:down`.

## Deploy
Ver [`deploy/DEPLOY.md`](deploy/DEPLOY.md) — VPS com PM2 + nginx + Let's Encrypt.

## Roadmap
- [x] M1 — Fundação (schema, API REST, telas no banco)
- [x] M2 — Auth + multi-tenant (Better Auth, isolamento por empresa)
- [x] M3 — Proposta pública (link curto, resposta persistida)
- [x] M4 — Notificações (sino in-app, rastreio de visualização, Resend, editar/reenviar)
- [x] M5-A — `price` em centavos (Int)
- [ ] M5-B — Billing (Stripe)
- [ ] M5-C — Deploy em produção
