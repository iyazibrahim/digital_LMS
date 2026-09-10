#!/bin/bash
# Based on official Frappe Learning docker/init.sh:
# https://raw.githubusercontent.com/frappe/lms/develop/docker/init.sh
# Wrapped for Digital Penang LMS (site name + passwords from env).

set -e

SITE_NAME="${SITE_NAME:-lms.iyazbrhm.cloud}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin}"
DB_ROOT_PASSWORD="${DB_ROOT_PASSWORD:-123}"
DEVELOPER_MODE="${DEVELOPER_MODE:-0}"

export PATH="${NVM_DIR}/versions/node/v${NODE_VERSION_DEVELOP}/bin/:${PATH}"

cd /home/frappe

if [ -d "/home/frappe/frappe-bench/apps/frappe" ]; then
  echo "Bench already exists, skipping init"
  cd /home/frappe/frappe-bench

  # Re-apply hosts if needed (idempotent)
  bench set-mariadb-host mariadb || true
  bench set-redis-cache-host redis://redis:6379 || true
  bench set-redis-queue-host redis://redis:6379 || true
  bench set-redis-socketio-host redis://redis:6379 || true

  if [ -d "sites/${SITE_NAME}" ]; then
    echo "Ensuring payments + lms on ${SITE_NAME}"
    bench --site "${SITE_NAME}" install-app payments || true
    bench --site "${SITE_NAME}" install-app lms || true
    bench --site "${SITE_NAME}" set-config host_name "https://${SITE_NAME}" || true
    bench --site "${SITE_NAME}" clear-cache || true
  fi

  bench start
fi

echo "Creating new bench (official LMS flow)..."
bench init --skip-redis-config-generation frappe-bench

cd frappe-bench

# Use containers instead of localhost (official)
bench set-mariadb-host mariadb
bench set-redis-cache-host redis://redis:6379
bench set-redis-queue-host redis://redis:6379
bench set-redis-socketio-host redis://redis:6379

# Remove redis, watch from Procfile (official)
sed -i '/redis/d' ./Procfile
sed -i '/watch/d' ./Procfile

# Official README / init.sh order
bench get-app payments
bench get-app lms

bench new-site "${SITE_NAME}" \
  --force \
  --mariadb-root-password "${DB_ROOT_PASSWORD}" \
  --admin-password "${ADMIN_PASSWORD}" \
  --no-mariadb-socket

bench --site "${SITE_NAME}" install-app payments
bench --site "${SITE_NAME}" install-app lms
bench --site "${SITE_NAME}" set-config host_name "https://${SITE_NAME}"
bench --site "${SITE_NAME}" set-config developer_mode "${DEVELOPER_MODE}"
bench --site "${SITE_NAME}" clear-cache
bench use "${SITE_NAME}"

echo "Installed apps:"
bench --site "${SITE_NAME}" list-apps
echo "Learning UI: https://${SITE_NAME}/lms (or http://127.0.0.1:8090/lms)"
echo "Login: Administrator / (ADMIN_PASSWORD)"

bench start
