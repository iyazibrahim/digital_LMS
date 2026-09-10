# Digital Penang LMS

Official **Frappe Learning** Docker install, wrapped for **https://lms.iyazbrhm.cloud** via Cloudflare Tunnel on port **8090**.

This follows the upstream setup from [frappe/lms docker](https://github.com/frappe/lms/tree/develop/docker) and the README install order:

1. `bench get-app payments`
2. `bench get-app lms`
3. `bench new-site …`
4. `bench --site … install-app payments`
5. `bench --site … install-app lms`

(Not the broken `ghcr.io/frappe/lms` production image path.)

## URLs

| Surface | URL |
|--------|-----|
| Learning | https://lms.iyazbrhm.cloud/lms |
| Desk | https://lms.iyazbrhm.cloud/app |
| Direct | http://127.0.0.1:8090/lms |

**Login:** `Administrator` / `ADMIN_PASSWORD` from `.env`

## Deploy

```bash
cp .env.example .env
# set strong ADMIN_PASSWORD and DB_ROOT_PASSWORD

docker compose down -v   # wipe old failed installs
docker compose up -d
docker compose logs -f frappe
```

First boot takes a long time (`bench init`, `get-app`, site create). Wait until you see apps listed and `bench start`.

### Cloudflare Tunnel

```yaml
ingress:
  - hostname: lms.iyazbrhm.cloud
    service: http://localhost:8090
  - service: http_status:404
```

## Files

| File | Role |
|------|------|
| `docker-compose.yml` | Official stack: MariaDB + Redis + `frappe/bench` |
| `init.sh` | Official init, site = `lms.iyazbrhm.cloud` |
| `.env.example` | Passwords + port 8090 |

## Notes

- Frappe Learning is free/open source. `payments` is also free (required dependency).
- Persist bench in volume `frappe-home` so restarts do not re-init from scratch.
- Do not commit a real `.env`.
