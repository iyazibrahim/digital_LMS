# Digital Penang LMS

Production Docker Compose stack for **Frappe Learning (LMS)**, branded as Digital Penang LMS for testing. Designed for deployment on **Dokploy** at **https://lms.iyazbrhm.cloud**.

This is **not** the official Frappe LMS development compose (`frappe/bench` + `lms.localhost:8000`). It uses the production image `ghcr.io/frappe/lms:v2.52.0` with MariaDB, Redis, workers, and nginx on port **8080**.

## Quick links after deploy

| Surface | URL |
|--------|-----|
| Learning portal | https://lms.iyazbrhm.cloud/lms |
| Frappe desk | https://lms.iyazbrhm.cloud/app |

**Login:** `Administrator` / value of `ADMIN_PASSWORD`

## Repository layout

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Full production stack |
| `.env.example` | Environment template for Dokploy / local |
| `workflow.md` | Project status log |

## Dokploy deploy

1. Point DNS **A record** `lms.iyazbrhm.cloud` at your Dokploy server IP.
2. Create a project → **Compose** service from this GitHub repo (`iyazibrahim/digital_LMS`).
3. Enable **Isolated Deployments** (recommended).
4. In **Environment**, paste variables from `.env.example` and set strong:
   - `ADMIN_PASSWORD`
   - `DB_ROOT_PASSWORD`
5. In **Domains**, add:
   - Host: `lms.iyazbrhm.cloud`
   - Service: **`frontend`**
   - Port: **`8080`**
   - HTTPS + Let's Encrypt
6. Deploy. First run can take several minutes while images pull and `create-site` installs LMS.
7. Watch logs for the `create-site` container until the site exists.
8. Open https://lms.iyazbrhm.cloud/lms and sign in as Administrator.
9. Rebrand in LMS / System Settings (title, logo) to **Digital Penang LMS**.

## Local smoke test (optional)

Requires Docker Desktop.

```bash
cp .env.example .env
# Edit ADMIN_PASSWORD and DB_ROOT_PASSWORD
docker compose up -d
```

For local browser access without Dokploy, either:

- Map `lms.iyazbrhm.cloud` in your hosts file to `127.0.0.1` and temporarily publish frontend (`ports: ["8080:8080"]`), or
- Set `SITE_NAME` / `FRAPPE_SITE_NAME_HEADER` to `lms.localhost` for a local-only site name.

## Notes

- Paid course checkout needs the `payments` app; the official LMS image does not include it. Free courses, batches, quizzes, and certificates work.
- Image tag is pinned to `v2.52.0` because some newer `stable` / `main` tags have shipped without the LMS app baked in.
- Do not commit a real `.env` file.

## License / upstream

Based on [Frappe Learning](https://github.com/frappe/lms) and the Frappe Docker / Dokploy production pattern.
