# Digital Penang LMS — Workflow

## Project

- **Name:** Digital Penang LMS
- **Domain:** `lms.iyazbrhm.cloud`
- **Deploy:** Official Frappe LMS Docker (`frappe/bench` + `init.sh`) + Cloudflare Tunnel `:8090`
- **Git remote:** https://github.com/iyazibrahim/digital_LMS.git

## Decisions

- Follow official LMS Docker/README install: `get-app payments` → `get-app lms` → install both on site.
- Do **not** use broken `ghcr.io/frappe/lms` / community production image path that failed with missing `payments`.
- Publish host `8090→8000` for Cloudflare Tunnel.
- Persist `/home/frappe` in volume `frappe-home`.

## Completed

### 2026-09-10 — Switch to official LMS docker wrap

- Replaced custom production compose with official `frappe/bench` + MariaDB + Redis.
- `init.sh` based on upstream `docker/init.sh`, site `lms.iyazbrhm.cloud`.
- Docs updated for wipe + tunnel.

## Next steps

1. Server: `git pull`, update `.env`, `docker compose down -v && docker compose up -d`.
2. Wait for first `bench init` / install (can take 15–30+ minutes).
3. Confirm https://lms.iyazbrhm.cloud/lms
4. Rebrand title/logo to Digital Penang LMS.
