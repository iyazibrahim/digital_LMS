#!/usr/bin/env bash
# Run on the server after docker compose is up — forces Learning install.
set -euo pipefail
SITE_NAME="${SITE_NAME:-lms.iyazbrhm.cloud}"

echo "Apps in container image:"
docker compose exec -T backend ls -1 /home/frappe/frappe-bench/apps

echo "Installing payments + lms on ${SITE_NAME}..."
docker compose exec -T backend bench --site "${SITE_NAME}" install-app payments || true
docker compose exec -T backend bench --site "${SITE_NAME}" install-app lms

echo "Installed apps:"
docker compose exec -T backend bench --site "${SITE_NAME}" list-apps
echo "Done. Open https://${SITE_NAME}/lms"
