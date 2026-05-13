#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="${REPO_DIR:-/opt/battery-demo/repo}"
DEPLOY_DIR="${DEPLOY_DIR:-/opt/battery-demo}"
ENV_FILE="${DEPLOY_DIR}/.env.demo"
NGINX_CONF_SRC="${REPO_DIR}/deploy/nginx/battery.scdc.cloud.conf"
NGINX_CONF_DST="/etc/nginx/conf.d/battery.scdc.cloud.conf"

if [[ ! -f "${REPO_DIR}/docker/.env.demo.example" ]]; then
  echo "Missing repo files at ${REPO_DIR}. Sync the repository first."
  exit 1
fi

mkdir -p "${DEPLOY_DIR}"

cp "${REPO_DIR}/docker/.env.demo.example" "${ENV_FILE}"
sed -i 's|http://batterry.scdc.cloud|https://battery.scdc.cloud|g' "${ENV_FILE}" || true
sed -i 's|^GATEWAY_CORS_ORIGINS=.*|GATEWAY_CORS_ORIGINS=https://battery.scdc.cloud,http://127.0.0.1:3010|' "${ENV_FILE}"
sed -i 's|^ALGO_CORS_ORIGINS=.*|ALGO_CORS_ORIGINS=https://battery.scdc.cloud,http://127.0.0.1:3010|' "${ENV_FILE}"
grep -q '^WEB_HOST_PORT=3010$' "${ENV_FILE}" || printf '\nWEB_HOST_PORT=3010\n' >> "${ENV_FILE}"

export COMPOSE_PROJECT_NAME=battery-demo
cd "${REPO_DIR}/docker"
docker compose --env-file "${ENV_FILE}" up -d --build mysql neo4j influxdb redis kafka zookeeper gateway api-service algorithm web

sudo tee "${NGINX_CONF_DST}" >/dev/null <<EOF
server {
    listen 80;
    server_name battery.scdc.cloud;

    location / {
        proxy_pass http://127.0.0.1:3010;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF

sudo nginx -t
sudo systemctl reload nginx

echo "Deployed battery demo to battery.scdc.cloud -> 127.0.0.1:3010"
