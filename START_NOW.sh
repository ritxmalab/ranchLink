#!/bin/bash
# Quick Start - Updated for Node 18

echo "🚀 Starting RanchLink..."
echo ""

# Add Node 18 to PATH
export PATH="/opt/homebrew/opt/node@18/bin:$PATH"

cd "$(dirname "$0")/apps/web"

# Check Node version
NODE_VERSION=$(node --version 2>/dev/null)
if [ -z "$NODE_VERSION" ]; then
    echo "❌ Node.js not found. Please run:"
    echo "   export PATH=\"/opt/homebrew/opt/node@18/bin:\$PATH\""
    echo "   Or restart your terminal"
    exit 1
fi

echo "✅ Node.js version: $NODE_VERSION"
echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
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

npm run dev


