# Digital Penang LMS — Workflow

## Project

- **Name:** Digital Penang LMS
- **Domain:** `lms.iyazbrhm.cloud`
- **Deploy target:** Dokploy (Docker Compose)
- **Upstream:** Frappe Learning (`ghcr.io/frappe/lms:v2.52.0`)
- **Git remote:** https://github.com/iyazibrahim/digital_LMS.git

## Decisions

- Use production Compose (MariaDB, Redis, frontend `:8080`), not the official `wget` development stack (`lms.localhost:8000`).
- Site name and `FRAPPE_SITE_NAME_HEADER` must equal `lms.iyazbrhm.cloud`.
- Dokploy Traefik handles TLS; compose uses `expose: 8080` on `frontend` only.
- Pin image tag `v2.52.0` for a known-good LMS-baked image.
- Rebrand to Digital Penang LMS via admin UI after first deploy (no source fork in this pass).

## Completed

### 2026-09-09 — Initial Dokploy compose stack

- Added `docker-compose.yml` with backend, frontend, websocket, workers, scheduler, configurator, create-site, MariaDB, Redis.
- Added `.env.example`, `.gitignore`, `README.md`, `workflow.md`.
- Validated compose config with `docker compose config`.
- Initialized git, committed, pushed to `origin` (`iyazibrahim/digital_LMS`).

## Next steps

1. DNS A record for `lms.iyazbrhm.cloud` → Dokploy server.
2. Create Dokploy Compose service from this repo; set env + domain (`frontend:8080`).
3. Deploy and confirm login at `/lms`.
4. Rebrand title/logo to Digital Penang LMS.
5. (Later) Fork `frappe/lms` and custom image if deeper customization is required.
