# Digital Penang LMS — Workflow

## Project

- **Name:** Digital Penang LMS
- **Domain:** `lms.iyazbrhm.cloud`
- **Deploy target:** Docker Compose + Cloudflare Tunnel (host port **8090**)
- **Upstream:** Frappe Learning via `amirul123/lms-custom` (frappe + payments + lms)
- **Git remote:** https://github.com/iyazibrahim/digital_LMS.git

## Decisions

- Use production Compose (MariaDB, Redis, frontend), not the official `wget` development stack (`lms.localhost:8000`).
- Site name and `FRAPPE_SITE_NAME_HEADER` must equal `lms.iyazbrhm.cloud`.
- Public access via **Cloudflare Tunnel** → `http://localhost:8090` (maps to container nginx `:8080`).
- Official `ghcr.io/frappe/lms` often cannot install Learning (missing free `payments` app) → use `amirul123/lms-custom`.
- Install with `--install-app payments --install-app lms`.
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

### 2026-09-09 — Fix Learning install (payments + lms)

- Switched default image to `amirul123/lms-custom:latest`.
- `INSTALL_APP_ARGS=--install-app payments --install-app lms`.
- `create-site` now installs payments/lms if the site exists but `lms` is missing.
- Documented `docker compose down -v` redeploy for broken Frappe-only sites.

## Next steps

1. On the server: `git pull`, update `.env`, then `docker compose down -v && docker compose pull && docker compose up -d`.
2. Confirm https://lms.iyazbrhm.cloud/lms loads Learning (not Frappe 404).
3. Rebrand title/logo to Digital Penang LMS.
4. (Later) Fork `frappe/lms` and custom image if deeper customization is required.
