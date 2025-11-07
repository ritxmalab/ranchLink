#!/bin/bash
# RanchLink Setup Script - Run everything from Cursor

set -e

echo "🚀 RanchLink Setup - Centralized Development"
echo "=============================================="
echo ""

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Installing..."
    npm install -g pnpm
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Check for .env files
if [ ! -f "apps/web/.env.local" ]; then
    echo "⚠️  apps/web/.env.local not found"
    echo "📝 Creating from .env.example..."
    cp .env.example apps/web/.env.local
    echo "✅ Created apps/web/.env.local"
    echo "⚠️  Please fill in your environment variables!"
fi

# Check Supabase
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo "⚠️  Supabase not configured"
    echo "   Set NEXT_PUBLIC_SUPABASE_URL in apps/web/.env.local"
fi

# Build contracts
echo "📜 Building smart contracts..."
cd packages/contracts
pnpm install
pnpm compile
cd ../..

# Build web app
echo "🌐 Building web app..."
cd apps/web
pnpm build
cd ../..

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Fill in apps/web/.env.local with your keys"
echo "2. Run database migrations: pnpm db:migrate"
echo "3. Start dev server: pnpm dev"
echo ""

