# Deploy (home server, Ubuntu + cloudflared)

Two stacks behind your existing cloudflared tunnel:
- `main` branch → **rubric_prod** → https://rubric.maahirahmed.com
- `dev` branch → **rubric_dev** → https://rubric.maahir.dev

## One-time setup

1. **Clone** to the box, e.g. `/home/maahir/containers/society-project`.

2. **Env files** (not committed):
   ```bash
   cp deploy/.env.prod.example deploy/.env.prod
   cp deploy/.env.dev.example  deploy/.env.dev
   # fill AUTH_SECRET, DB_PASSWORD (openssl rand -base64 32 / 24), etc. Different secrets per stack.
   ```

3. **Tunnel ingress** — the apps publish host ports (3000 prod, 3001 dev); cloudflared
   reaches them via `host.docker.internal`. Add to your cloudflared `config.yml` ingress
   (above the `http_status:404` line) and restart cloudflared:
   ```yaml
     - hostname: rubric.maahirahmed.com
       service: http://host.docker.internal:3000
     - hostname: rubric.maahir.dev
       service: http://host.docker.internal:3001
   ```

4. **GitHub self-hosted runner** (repo → Settings → Actions → Runners → New self-hosted runner) on the box. Install as a service so it survives reboots:
   ```bash
   ./svc.sh install && ./svc.sh start
   ```
   The runner needs docker access (its user in the `docker` group).

6. **First deploy:** push to `dev` and `main`, or run manually:
   ```bash
   docker compose --env-file deploy/.env.prod -p rubric_prod -f deploy/docker-compose.yml up -d --build
   ```

7. **Seed** the first admin (once per stack):
   ```bash
   docker exec -it rubric_prod_app node -e "require('child_process')"  # or run prisma seed:
   docker compose --env-file deploy/.env.prod -p rubric_prod -f deploy/docker-compose.yml run --rm migrate npx tsx prisma/seed.ts
   ```

## Backups
```bash
crontab -e
0 3 * * *  /home/maahir/containers/society-project/deploy/backup.sh >> /home/maahir/containers/rubric-backup.log 2>&1
```

## Notes
- Schema is applied with `prisma db push` (no migrations dir). Fine for now; add a migrations history later for safe prod schema changes.
- App ports are NOT published to the host — only cloudflared (via the `edge` network) can reach them.
