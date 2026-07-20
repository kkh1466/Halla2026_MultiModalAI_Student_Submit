#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/opt/foodcost"
APP_USER="ubuntu"

sudo apt-get update
sudo apt-get install -y curl ca-certificates nginx unzip

if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

if ! sudo swapon --show | grep -q "/swapfile"; then
  sudo fallocate -l 1G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo "/swapfile none swap sw 0 0" | sudo tee -a /etc/fstab >/dev/null
fi

sudo mkdir -p "$APP_DIR"
sudo chown -R "$APP_USER:$APP_USER" "$APP_DIR"

cat <<'SERVICE' | sudo tee /etc/systemd/system/foodcost.service >/dev/null
[Unit]
Description=Foodcost Next.js app
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/opt/foodcost
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm run start:aws
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
SERVICE

cat <<'NGINX' | sudo tee /etc/nginx/sites-available/foodcost >/dev/null
server {
    listen 80;
    server_name _;

    client_max_body_size 20M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX

sudo ln -sf /etc/nginx/sites-available/foodcost /etc/nginx/sites-enabled/foodcost
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx
sudo systemctl daemon-reload
sudo systemctl enable foodcost

echo "Base server setup complete. Upload the app to /opt/foodcost, then run the app build/start commands from the deployment guide."
