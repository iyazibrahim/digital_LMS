# Digital Penang LMS

Production Docker Compose stack for **Frappe Learning (LMS)** — free & open source — branded as Digital Penang LMS. Served at **https://lms.iyazbrhm.cloud** via **Cloudflare Tunnel** to host port **8090**.

Uses image **`amirul123/lms-custom:latest`** (hardcoded in compose — includes `frappe` + **`payments`** + **`lms`**). The official `ghcr.io/frappe/lms` image fails Learning install because `payments` is missing.

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

## Fresh deploy (your error = wrong image still running)

`ModuleNotFoundError: No module named 'payments'` with `frappe 15.104.0` and apps `frappe` + `lms` means the server is still using **`ghcr.io/frappe/lms`**, not `amirul123/lms-custom`.

1. In Dokploy **Environment**, **delete** `IMAGE_NAME` and `VERSION` if present.
2. On the server:

```bash
git pull
docker compose down -v
docker compose pull
docker images | grep -E 'lms-custom|frappe/lms'
# must show amirul123/lms-custom — NOT only ghcr.io/frappe/lms
docker compose up -d
docker compose logs -f create-site
```

`create-site` now **aborts early** if `apps/payments` is missing, so you cannot get a silent Frappe-only site again.

Expect image apps: `frappe`, `lms`, `payments` (Frappe 16.x on the custom image).

`down -v` deletes old MariaDB/site data.

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
