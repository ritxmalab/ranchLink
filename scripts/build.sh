#!/bin/bash
# Build for production

echo "🔨 Building RanchLink..."
echo ""

# Build contracts
echo "📜 Building contracts..."
cd packages/contracts
pnpm compile
cd ../..

# Build web app
echo "🌐 Building web app..."
cd apps/web
pnpm build
cd ../..

echo ""
echo "✅ Build complete!"
echo ""
echo "Standalone build ready in: apps/web/.next/standalone"
echo "Deploy to Hostinger VPS using: scripts/deploy-hostinger.sh"
echo ""


