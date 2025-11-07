#!/bin/bash
# Quick Start Preview Script

echo "🚀 Starting RanchLink Preview..."
echo ""

cd "$(dirname "$0")"

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    npm install -g pnpm
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    pnpm install
fi

# Create .env.local if it doesn't exist
if [ ! -f "apps/web/.env.local" ]; then
    echo "📝 Creating .env.local (you can add real keys later)..."
    cat > apps/web/.env.local << EOF
# For preview, these can be empty
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=
NEXT_PUBLIC_ALCHEMY_BASE_RPC=
WEB3STORAGE_TOKEN=
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF
fi

# Start dev server
echo ""
echo "✅ Starting preview server..."
echo "🌐 Open: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop"
echo ""

cd apps/web
pnpm dev

