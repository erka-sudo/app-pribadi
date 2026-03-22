#!/bin/bash

echo "🚀 SETUP SERVER MULAI..."

apt update && apt upgrade -y

echo "📦 Install dependencies..."
apt install -y nginx git nodejs npm python3 python3-pip python3-venv jq

echo "📦 Install PM2..."
npm install -g pm2

echo "📁 Setup folder..."
mkdir -p /apps

echo "📥 Clone repo app..."
cd /apps
git clone https://github.com/erka-sudo/app-pribadi.git repo

echo "📄 Setup deploy script..."
cp deploy.sh /root/deploy.sh
chmod +x /root/deploy.sh

echo "🌐 Setup nginx..."
cp nginx.conf /etc/nginx/conf.d/apps.conf

echo "❌ Remove default nginx config..."
rm -f /etc/nginx/sites-enabled/default

echo "🔄 Restart nginx..."
systemctl restart nginx

echo "🚀 Jalankan deploy..."
bash /root/deploy.sh

echo "💾 Save PM2..."
pm2 save

echo "⚙️ Enable PM2 startup..."
pm2 startup | bash

echo "=============================="
echo "✅ SERVER SIAP DIGUNAKAN"
echo "=============================="
