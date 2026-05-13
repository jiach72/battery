#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="${REPO_DIR:-/opt/battery-demo/repo}"
DEPLOY_DIR="${DEPLOY_DIR:-/opt/battery-demo}"
ENV_FILE="${DEPLOY_DIR}/.env.demo"
NGINX_CONF_SRC="${REPO_DIR}/deploy/nginx/battery.scdc.cloud.conf"
NGINX_CONF_DST="/etc/nginx/conf.d/battery.scdc.cloud.conf"
NGINX_CERT_DIR="/etc/nginx/certs"
NGINX_CERT_KEY="${NGINX_CERT_DIR}/battery.scdc.cloud.key"
NGINX_CERT_CRT="${NGINX_CERT_DIR}/battery.scdc.cloud.crt"

if [[ ! -f "${REPO_DIR}/docker/.env.demo.example" ]]; then
  echo "Missing repo files at ${REPO_DIR}. Sync the repository first."
  exit 1
fi

mkdir -p "${DEPLOY_DIR}"
sudo mkdir -p "${NGINX_CERT_DIR}"

if [[ ! -f "${NGINX_CERT_KEY}" || ! -f "${NGINX_CERT_CRT}" ]]; then
  sudo openssl req -x509 -nodes -days 825 -newkey rsa:2048 \
    -keyout "${NGINX_CERT_KEY}" \
    -out "${NGINX_CERT_CRT}" \
    -subj "/CN=battery.scdc.cloud" \
    -addext "subjectAltName=DNS:battery.scdc.cloud"
fi

cp "${REPO_DIR}/docker/.env.demo.example" "${ENV_FILE}"
sed -i 's|http://batterry.scdc.cloud|https://battery.scdc.cloud|g' "${ENV_FILE}" || true
sed -i 's|^GATEWAY_CORS_ORIGINS=.*|GATEWAY_CORS_ORIGINS=https://battery.scdc.cloud,http://127.0.0.1:3010|' "${ENV_FILE}"
sed -i 's|^ALGO_CORS_ORIGINS=.*|ALGO_CORS_ORIGINS=https://battery.scdc.cloud,http://127.0.0.1:3010|' "${ENV_FILE}"
grep -q '^WEB_HOST_PORT=3010$' "${ENV_FILE}" || printf '\nWEB_HOST_PORT=3010\n' >> "${ENV_FILE}"

export COMPOSE_PROJECT_NAME=battery-demo
cd "${REPO_DIR}/docker"
docker compose --env-file "${ENV_FILE}" up -d --build mysql neo4j influxdb redis kafka zookeeper gateway api-service algorithm web

sudo cp "${NGINX_CONF_SRC}" "${NGINX_CONF_DST}"

sudo nginx -t
sudo systemctl reload nginx

echo "Deployed battery demo to battery.scdc.cloud -> 127.0.0.1:3010"
