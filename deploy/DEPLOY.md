# Deploy — nex-quotes na VPS

Mesmo padrão do Flow / WIN Trader: PM2 + nginx + Let's Encrypt + Postgres local.
Porta da app: **3015** (5020 = Flow, 8010/3010 = WIN Trader).
Domínio sugerido: **quotes.newflowsys.cloud** (troque em `deploy/nginx-nexquotes.conf` e no `.env` se usar outro).

---

## 1. DNS
No painel do domínio, criar um registro **A**:

```
quotes.newflowsys.cloud  →  <IP da VPS>
```

## 2. Banco de produção (na VPS)

```bash
sudo -u postgres psql -c "CREATE USER nex_quotes WITH PASSWORD 'TROQUE_ESSA_SENHA';"
sudo -u postgres psql -c "CREATE DATABASE nex_quotes OWNER nex_quotes;"
sudo -u postgres psql -d nex_quotes -c "GRANT ALL ON SCHEMA public TO nex_quotes;"
```

## 3. Código + variáveis de ambiente

```bash
cd /var/www            # ou onde ficam os outros projetos
git clone git@github.com:<user>/nex-quotes.git
cd nex-quotes
cp .env.example .env
nano .env
```

`.env` de produção:

```
DATABASE_URL="postgresql://nex_quotes:TROQUE_ESSA_SENHA@127.0.0.1:5432/nex_quotes?schema=public"
BETTER_AUTH_SECRET="<gere um novo: node -e \"console.log(require('crypto').randomBytes(32).toString('base64url'))\">"
BETTER_AUTH_URL="https://quotes.newflowsys.cloud"
APP_URL="https://quotes.newflowsys.cloud"

# Resend (opcional — sem a chave, só notificação in-app)
RESEND_API_KEY=""
RESEND_FROM="NEX Quotes <nao-responder@newflowsys.cloud>"

# Stripe (M5-B — preencher quando o billing entrar)
# STRIPE_SECRET_KEY=""
# STRIPE_WEBHOOK_SECRET=""
# STRIPE_PRICE_ID=""
```

## 4. Instalar, migrar, buildar

```bash
npm ci
npx prisma migrate deploy
npm run build
```

## 5. PM2

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 logs nex-quotes    # conferir que subiu na 3015
```

## 6. nginx + SSL

```bash
sudo cp deploy/nginx-nexquotes.conf /etc/nginx/sites-available/nex-quotes
sudo ln -s /etc/nginx/sites-available/nex-quotes /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d quotes.newflowsys.cloud
```

Testar: `https://quotes.newflowsys.cloud` → deve redirecionar pra `/login`.

## 7. Atualizações futuras

```bash
cd /var/www/nex-quotes
git pull
npm ci
npx prisma migrate deploy
npm run build
pm2 restart nex-quotes
```

## 8. Stripe (quando o M5-B for feito)
- Criar Produto + Preço recorrente no dashboard do Stripe.
- Webhook endpoint: `https://quotes.newflowsys.cloud/api/webhooks/stripe`
  eventos: `checkout.session.completed`, `customer.subscription.updated`,
  `customer.subscription.deleted`, `invoice.payment_failed`.
- Copiar o *signing secret* do webhook pra `STRIPE_WEBHOOK_SECRET` no `.env` e `pm2 restart`.
