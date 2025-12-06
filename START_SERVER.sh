#!/bin/bash
# Quick Start Script - Works with or without pnpm

echo "🚀 Starting RanchLink..."
echo ""

cd "$(dirname "$0")/apps/web"

# Check if pnpm is available, otherwise use npm
if command -v pnpm &> /dev/null; then
    echo "✅ Using pnpm"
    PKG_MANAGER="pnpm"
else
    echo "✅ Using npm (pnpm not found)"
    PKG_MANAGER="npm"
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    $PKG_MANAGER install
fi

# Create .env.local if it doesn't exist
if [ ! -f ".env.local" ]; then
    echo "📝 Creating .env.local..."
    cat > .env.local << EOF
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_BASE_PATH=
EOF
fi

echo ""
echo "✅ Starting dev server..."
echo "🌐 Open: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop"
echo ""

$PKG_MANAGER run dev


