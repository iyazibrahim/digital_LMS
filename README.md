# Digital Penang LMS

Production Docker Compose stack for **Frappe Learning (LMS)**, branded as Digital Penang LMS for testing. Served at **https://lms.iyazbrhm.cloud** via **Cloudflare Tunnel** to host port **8090**.

This is **not** the official Frappe LMS development compose (`frappe/bench` + `lms.localhost:8000`). It uses the production image `ghcr.io/frappe/lms:v2.52.0` with MariaDB, Redis, workers, and nginx (container `:8080`, published as host **`:8090`**).

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

## Cloudflare Tunnel deploy

1. On the server, copy env and start the stack:

```bash
cp .env.example .env
# Set strong ADMIN_PASSWORD and DB_ROOT_PASSWORD
docker compose up -d
```

2. Confirm LMS answers locally: `http://127.0.0.1:8090/lms` (after `create-site` finishes).

3. Point Cloudflare Tunnel ingress for `lms.iyazbrhm.cloud` to:

```text
http://localhost:8090
```

Example `config.yml` snippet:

```yaml
ingress:
  - hostname: lms.iyazbrhm.cloud
    service: http://localhost:8090
  - service: http_status:404
```

4. In Cloudflare DNS, use a **CNAME** (or route) for `lms` → your tunnel (Zero Trust / cloudflared), not a public A record to the origin unless you intend that.

5. SSL/TLS mode: **Full** is fine (tunnel terminates to HTTP on the origin).

6. Open https://lms.iyazbrhm.cloud/lms and sign in as Administrator.

7. Rebrand in LMS / System Settings (title, logo) to **Digital Penang LMS**.

### Dokploy + Cloudflare Tunnel

If you still run Compose on Dokploy: deploy the stack, do **not** rely on Dokploy domain routing for this site. Publish/use host port **8090**, and attach the Cloudflare Tunnel to that port (or to the server’s published `8090`).

## Local smoke test

Requires Docker Desktop.

```bash
cp .env.example .env
# Edit ADMIN_PASSWORD and DB_ROOT_PASSWORD
docker compose up -d
# Open http://127.0.0.1:8090/lms
```

## Notes

- Nginx inside the container still listens on **8080**; only the **host** mapping is **8090** (`HTTP_PUBLISH_PORT`).
- Paid course checkout needs the `payments` app; the official LMS image does not include it.
- Image tag is pinned to `v2.52.0` because some newer `stable` / `main` tags have shipped without the LMS app baked in.
- Do not commit a real `.env` file.

## License / upstream

Based on [Frappe Learning](https://github.com/frappe/lms) and the Frappe Docker production pattern.
