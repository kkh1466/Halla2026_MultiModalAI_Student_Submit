#!/usr/bin/env bash
set -eu

APP_DIR="/opt/foodcost"
ARCHIVE="/tmp/foodcost.tgz"
PACKAGE_URL="https://foodcost-deploy-871856773720-apne2.s3.ap-northeast-2.amazonaws.com/foodcost.tgz?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIA4V7VWTJMAIFBBZEE%2F20260710%2Fap-northeast-2%2Fs3%2Faws4_request&X-Amz-Date=20260710T025418Z&X-Amz-Expires=3600&X-Amz-SignedHeaders=host&X-Amz-Signature=18b6093570029ebe9a5acce29b8bb3f2c8a9e9a9cf0d878374f31e888aefc212"

STATUS_FILE="/var/www/html/status.txt"
trap 'code=$?; printf "FAILED at line %s (exit %s)\n" "$LINENO" "$code" > "$STATUS_FILE"; tail -n 80 /var/log/cloud-init-output.log >> "$STATUS_FILE"; exit "$code"' ERR

apt-get update
apt-get install -y curl ca-certificates tar nginx
printf "BOOTSTRAP_STARTED\n" > "$STATUS_FILE"
systemctl enable --now nginx
mkdir -p "$APP_DIR"
curl --fail --location "$PACKAGE_URL" --output "$ARCHIVE"
printf "PACKAGE_DOWNLOADED\n" > "$STATUS_FILE"
tar -xzf "$ARCHIVE" -C "$APP_DIR"
mv "$APP_DIR/deploy/.env.production" "$APP_DIR/.env"

bash "$APP_DIR/deploy/lightsail-setup.sh"
chown -R ubuntu:ubuntu "$APP_DIR"

sudo -u ubuntu env HOME=/home/ubuntu bash -lc "cd '$APP_DIR' && npm ci"
printf "DEPENDENCIES_INSTALLED\n" > "$STATUS_FILE"
sudo -u ubuntu env HOME=/home/ubuntu bash -lc "cd '$APP_DIR' && npx prisma generate && npx prisma db push"
sudo -u ubuntu env HOME=/home/ubuntu bash -lc "cd '$APP_DIR' && npm run build"

systemctl restart foodcost
printf "DEPLOYMENT_COMPLETE\n" > "$STATUS_FILE"
rm -f "$ARCHIVE"
