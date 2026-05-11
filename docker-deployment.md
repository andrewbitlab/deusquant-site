# Docker deployment notes

This document captures the production setup used for `deusquant.com` on the Windows host that also runs MT5 instances.

## Current architecture

- Next.js app runs in Docker as `web`.
- PostgreSQL runs in Docker as `postgres`.
- Cloudflare Tunnel runs in Docker as `cloudflared`.
- Public hostnames:
  - `https://deusquant.com`
  - `https://www.deusquant.com`
- Local test URL:
  - `http://127.0.0.1:3080/dashboard`
- Cloudflare tunnel name:
  - `deusquant-site`
- Cloudflare tunnel target:
  - `http://web:3000`

## Resource limits

The host also runs live MT5 instances, so Docker is intentionally constrained.

WSL config in `%USERPROFILE%\.wslconfig`:

```ini
[wsl2]
memory=4GB
processors=2
swap=2GB
localhostForwarding=true
autoMemoryReclaim=gradual
```

Docker Desktop settings were adjusted to:

- CPUs: `2`
- Memory: `4096 MB`
- Swap: `2048 MB`
- Disk image size: `8192 MB`
- Resource Saver: enabled
- SBOM indexing: disabled
- Docker Desktop autostart: disabled

Compose service limits:

- `web`: `1 CPU`, `768 MB RAM`
- `postgres`: `0.5 CPU`, `512 MB RAM`
- `cloudflared`: `0.15 CPU`, `96 MB RAM`

## Files added or changed

- `Dockerfile`
  - Multi-stage build.
  - Uses `next.config.js` `output: 'standalone'`.
  - Installs OpenSSL for Prisma on Alpine.
  - Copies `public`, `.next/standalone`, `.next/static`, and `data/backtest/html`.
- `docker-compose.yml`
  - Runs `postgres`, `web`, optional `cloudflared`, and maintenance-only `migrate`.
  - Exposes app locally on `127.0.0.1:3080`.
  - Keeps migrator behind the `maintenance` profile so it is not kept in daily runtime.
- `.dockerignore`
  - Excludes local env files, `node_modules`, `.next`, logs, and cache.
- `.env.production`
  - Local only, ignored by git.
  - Contains `DATABASE_URL`, PostgreSQL credentials, and `CLOUDFLARED_TOKEN`.

## First-time setup

Create `.env.production` locally. Do not commit it.

Required variables:

```env
POSTGRES_DB=deusquant
POSTGRES_USER=deusquant
POSTGRES_PASSWORD=<strong password>
DATABASE_URL=postgresql://deusquant:<strong password>@postgres:5432/deusquant?schema=public
NEXT_PUBLIC_APP_NAME=DEUS QUANT Portfolio
NEXT_PUBLIC_API_URL=https://deusquant.com/api
CLOUDFLARED_TOKEN=<cloudflare tunnel token>
```

Start the app and database:

```powershell
docker compose --env-file .env.production up --build -d postgres web
```

Run migrations:

```powershell
docker compose --env-file .env.production --profile maintenance run --rm migrate
```

Import strategy data into PostgreSQL:

```powershell
docker compose --env-file .env.production run --rm --no-deps `
  -v ${PWD}:/src `
  -w /src `
  -e NODE_PATH=/app/node_modules `
  migrate /app/node_modules/.bin/tsx scripts/migrate-xlsx-to-db.ts
```

Start Cloudflare Tunnel:

```powershell
docker compose --env-file .env.production --profile tunnel up -d cloudflared
```

Remove build cache and unused images after deployment:

```powershell
docker builder prune -af
docker image prune -f
docker system df
```

## Cloudflare setup

The Cloudflare zone for `deusquant.com` uses:

```text
felicity.ns.cloudflare.com
sandy.ns.cloudflare.com
```

Namecheap must point the domain to those custom nameservers.

DNS records in Cloudflare:

```text
CNAME deusquant.com     d906aca5-2506-40e5-8d3f-1ddd87c7c281.cfargotunnel.com proxied
CNAME www.deusquant.com d906aca5-2506-40e5-8d3f-1ddd87c7c281.cfargotunnel.com proxied
```

Tunnel ingress:

```yaml
ingress:
  - hostname: deusquant.com
    service: http://web:3000
  - hostname: www.deusquant.com
    service: http://web:3000
  - service: http_status:404
```

After setup, delete or restrict the broad Cloudflare API token used for initial provisioning. Runtime only needs the `CLOUDFLARED_TOKEN` in `.env.production`.

## Validation commands

Check container state:

```powershell
docker compose --env-file .env.production --profile tunnel ps
```

Check local app health:

```powershell
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:3080/api/health
```

Check public health:

```powershell
curl.exe -I -L https://deusquant.com/api/health
curl.exe -I -L https://www.deusquant.com/api/health
```

Check dashboard:

```powershell
curl.exe -I -L https://deusquant.com/dashboard
curl.exe -I -L https://www.deusquant.com/dashboard
```

Check resources:

```powershell
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"
docker system df
Get-PSDrive C
```

Expected database health response includes:

```json
{
  "status": "ok",
  "database": {
    "status": "connected",
    "provider": "postgresql",
    "activeStrategies": 19
  }
}
```

## DNS cache note

Immediately after changing nameservers, some routers or ISPs may still return old Netlify IPs for `deusquant.com`, causing browser certificate errors such as `ERR_CERT_COMMON_NAME_INVALID`.

Public resolvers should return Cloudflare IPs:

```powershell
nslookup deusquant.com 1.1.1.1
nslookup deusquant.com 8.8.8.8
```

Old Netlify IPs observed during migration:

```text
35.157.26.135
63.176.8.218
```

If those still appear from a local router DNS, wait for cache expiry or temporarily use `1.1.1.1` / `8.8.8.8` on the client.

## Routine operations

Restart services:

```powershell
docker compose --env-file .env.production --profile tunnel restart
```

Stop services:

```powershell
docker compose --env-file .env.production --profile tunnel stop
```

Start services after reboot:

```powershell
docker compose --env-file .env.production up -d postgres web
docker compose --env-file .env.production --profile tunnel up -d cloudflared
```

Rebuild app after code changes:

```powershell
docker compose --env-file .env.production up --build -d web
docker builder prune -af
```
