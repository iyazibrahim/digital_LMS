# Digital Penang LMS — Workflow

## Project

- **Name:** Digital Penang LMS
- **Domain:** `lms.iyazbrhm.cloud`
- **Deploy target:** Docker Compose + Cloudflare Tunnel (host port **8090**)
- **Upstream:** Frappe Learning (`ghcr.io/frappe/lms:v2.52.0`)
- **Git remote:** https://github.com/iyazibrahim/digital_LMS.git

## Decisions

- Use production Compose (MariaDB, Redis, frontend), not the official `wget` development stack (`lms.localhost:8000`).
- Site name and `FRAPPE_SITE_NAME_HEADER` must equal `lms.iyazbrhm.cloud`.
- Public access via **Cloudflare Tunnel** → `http://localhost:8090` (maps to container nginx `:8080`).
- Pin image tag `v2.52.0` for a known-good LMS-baked image.
- Rebrand to Digital Penang LMS via admin UI after first deploy (no source fork in this pass).

## Completed

### 2026-09-09 — Initial Dokploy compose stack

- Added `docker-compose.yml` with backend, frontend, websocket, workers, scheduler, configurator, create-site, MariaDB, Redis.
- Added `.env.example`, `.gitignore`, `README.md`, `workflow.md`.
- Validated compose config with `docker compose config`.
- Initialized git, committed, pushed to `origin` (`iyazibrahim/digital_LMS`).

### 2026-09-09 — Port 8090 + Cloudflare Tunnel

- Frontend publishes `${HTTP_PUBLISH_PORT:-8090}:8080` instead of Dokploy-only `expose: 8080`.
- Docs updated for Cloudflare Tunnel ingress `http://localhost:8090`.

## Next steps

1. `docker compose up -d` on the server; wait for `create-site`.
2. Configure Cloudflare Tunnel hostname `lms.iyazbrhm.cloud` → `http://localhost:8090`.
3. Confirm login at `/lms`.
4. Rebrand title/logo to Digital Penang LMS.
5. (Later) Fork `frappe/lms` and custom image if deeper customization is required.
