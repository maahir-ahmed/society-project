# Deployment Guide

## Prerequisites

- Docker 24+ and Docker Compose v2
- A domain name (for production)
- SMTP credentials for email (optional but recommended)

---

## Quick Start (Local Development)

### 1. Start the database

```bash
docker compose -f docker-compose.dev.yml up -d
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:
```
DATABASE_URL="postgresql://society_user:society_password@localhost:5432/society_platform?schema=public"
AUTH_SECRET="run: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Run database migrations and seed

```bash
npm install
npm run db:push          # Push schema to DB
npm run db:seed          # Load demo data
```

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Demo login: `maahir@secsoc.unsw.edu.au` / `password123`

---

## Production Deployment (Docker)

### 1. Set up environment variables

Create a `.env.production` file (never commit this):

```bash
DB_PASSWORD=<strong-random-password>
AUTH_SECRET=<run: openssl rand -base64 32>
NEXTAUTH_URL=https://your-domain.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@your-domain.com
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_APP_NAME="Your Society Platform"
```

### 2. Build and start

```bash
docker compose --env-file .env.production up -d --build
```

This will:
1. Start PostgreSQL
2. Run Prisma migrations
3. Start the Next.js app on port 3000

### 3. Set up a reverse proxy (Nginx)

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Use Certbot for SSL: `certbot --nginx -d your-domain.com`

### 4. Initial setup

Navigate to `https://your-domain.com/register` to create the first admin account, then `/setup` to create your society.

---

## Database Migrations

When updating the schema:

```bash
# Development
npm run db:migrate

# Production (runs automatically in Docker)
npx prisma migrate deploy
```

---

## Backup Strategy

### Automated PostgreSQL backups

Add to crontab:
```bash
# Daily backup at 2 AM
0 2 * * * docker exec society-project-db-1 pg_dump -U society_user society_platform | gzip > /backups/society_$(date +%Y%m%d).sql.gz

# Keep 30 days of backups
find /backups -name "society_*.sql.gz" -mtime +30 -delete
```

### Restore from backup

```bash
gunzip -c /backups/society_20250101.sql.gz | docker exec -i society-project-db-1 psql -U society_user -d society_platform
```

### File uploads

The `uploads/` volume should be backed up separately:
```bash
rsync -av /var/lib/docker/volumes/society-project_uploads_data/ /backups/uploads/
```

---

## Multi-Society Setup

Multiple societies are supported out of the box. Each society gets a unique slug:
- `https://your-domain.com/secsoc/dashboard`
- `https://your-domain.com/csesoc/dashboard`

Users can belong to multiple societies simultaneously with different roles in each.

To create a new society, any registered user can go to `/setup`.

---

## Environment Variable Reference

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `AUTH_SECRET` | Yes | NextAuth secret (32+ random bytes) |
| `NEXTAUTH_URL` | Yes | Full URL of the app |
| `DB_PASSWORD` | Docker only | PostgreSQL password |
| `SMTP_HOST` | No | Email server hostname |
| `SMTP_PORT` | No | Email server port (default: 587) |
| `SMTP_USER` | No | Email username |
| `SMTP_PASS` | No | Email password/app password |
| `EMAIL_FROM` | No | From address for emails |
| `NEXT_PUBLIC_APP_URL` | No | Public app URL (for links in emails) |
| `NEXT_PUBLIC_APP_NAME` | No | App name shown in UI |
| `MAX_FILE_SIZE_MB` | No | Max upload size in MB (default: 10) |

---

## CI/CD (GitHub Actions)

Example workflow `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to server
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /opt/society-platform
            git pull origin main
            docker compose --env-file .env.production up -d --build
            docker compose exec app npx prisma migrate deploy
```

---

## Security Hardening (Production)

1. **Rate limiting**: Add nginx rate limiting or use a WAF
2. **Bank account encryption**: Implement AES-256 encryption for `BankAccount.accountNumber` before production use
3. **MFA**: The schema supports `twoFactorEnabled` — connect a TOTP library (e.g., `otplib`)
4. **Secrets rotation**: Rotate `AUTH_SECRET` periodically (invalidates all sessions)
5. **Database**: Enable PostgreSQL SSL for the connection string
6. **Headers**: Next.js security headers are recommended in `next.config.ts`
