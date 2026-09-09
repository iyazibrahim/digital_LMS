# Digital Penang LMS

Production Docker Compose stack for **Frappe Learning (LMS)** — free & open source — branded as Digital Penang LMS. Served at **https://lms.iyazbrhm.cloud** via **Cloudflare Tunnel** to host port **8090**.

Uses image **`amirul123/lms-custom`** (includes `frappe` + **`payments`** + **`lms`**). The official `ghcr.io/frappe/lms` image often fails to install Learning because the free `payments` dependency is missing.

## Quick links after deploy

| Surface | URL |
|--------|-----|
| Learning portal | https://lms.iyazbrhm.cloud/lms |
| Frappe desk | https://lms.iyazbrhm.cloud/app |
| Direct (server) | http://127.0.0.1:8090/lms |

**Login:** `Administrator` / value of `ADMIN_PASSWORD`

## Repository layout

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Full production stack |
| `.env.example` | Environment template |
| `workflow.md` | Project status log |

## Fresh deploy (required if you already have a broken Frappe-only site)

If `/lms` returns 404 but `/` or `/app` works, wipe volumes and recreate so `payments` + `lms` install cleanly:

```bash
git pull
cp .env.example .env   # or update existing .env — see IMAGE_NAME / INSTALL_APP_ARGS
# Set strong ADMIN_PASSWORD and DB_ROOT_PASSWORD

docker compose down -v
docker compose pull
docker compose up -d
```

Watch site creation:

```bash
docker compose logs -f create-site
```

When finished, open https://lms.iyazbrhm.cloud/lms

`down -v` **deletes** MariaDB and site data. Use only for testing / first fix.

## Cloudflare Tunnel

Point hostname `lms.iyazbrhm.cloud` to:

```text
http://localhost:8090
```

```yaml
ingress:
  - hostname: lms.iyazbrhm.cloud
    service: http://localhost:8090
  - service: http_status:404
```

## Without wiping (optional recovery)

If the new image is running and apps are present in the container:

```bash
docker compose exec backend bench --site lms.iyazbrhm.cloud list-apps
docker compose exec backend bench --site lms.iyazbrhm.cloud install-app payments
docker compose exec backend bench --site lms.iyazbrhm.cloud install-app lms
```

Prefer a clean `down -v` + `up` if the old site was created without Learning.

## Notes

- Frappe Learning is **free**. The `payments` app is also free open source (needed for LMS install / paid-course features).
- Nginx inside the container listens on **8080**; host mapping is **8090** (`HTTP_PUBLISH_PORT`).
- Do not commit a real `.env` file.

## License / upstream

Based on [Frappe Learning](https://github.com/frappe/lms). Community image: [amirul123/lms-custom](https://hub.docker.com/r/amirul123/lms-custom).
