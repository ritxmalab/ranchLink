#!/bin/bash
# Deploy to Hostinger VPS

set -e

VPS_HOST=${VPS_HOST:-"your-vps-host"}
VPS_USER=${VPS_USER:-"root"}
VPS_PATH=${VPS_PATH:-"/var/www/ranchlink"}

echo "🚀 Deploying RanchLink to Hostinger VPS"
echo "========================================"
echo ""
echo "Host: $VPS_HOST"
echo "User: $VPS_USER"
echo "Path: $VPS_PATH"
echo ""

# Build first
echo "📦 Building..."
./scripts/build.sh

# Create deployment package
echo "📦 Creating deployment package..."
cd apps/web
tar -czf ../../deploy.tar.gz .next/standalone package.json
cd ../..

# Upload to VPS
echo "📤 Uploading to VPS..."
scp deploy.tar.gz $VPS_USER@$VPS_HOST:/tmp/

# Deploy on VPS
echo "🚀 Deploying on VPS..."
ssh $VPS_USER@$VPS_HOST << EOF
set -e
cd $VPS_PATH
mkdir -p ranchlink
cd ranchlink
tar -xzf /tmp/deploy.tar.gz
rm /tmp/deploy.tar.gz
npm install --production
pm2 restart ranchlink || pm2 start server.js --name ranchlink
pm2 save
EOF

# Cleanup
rm deploy.tar.gz

echo ""
echo "✅ Deployment complete!"
echo ""
echo "App should be running at: https://ritxma.com/ranchlink"
echo ""

