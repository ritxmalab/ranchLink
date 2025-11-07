#!/bin/bash
echo "🔄 Updating Node.js..."
echo ""

# Check if Homebrew is available
if command -v brew &> /dev/null; then
    echo "✅ Homebrew found - Using Homebrew..."
    brew install node@18
    echo ""
    echo "✅ Node.js updated!"
    echo "Run: node --version"
elif command -v nvm &> /dev/null; then
    echo "✅ nvm found - Using nvm..."
    nvm install 18
    nvm use 18
    echo ""
    echo "✅ Node.js updated!"
    echo "Run: node --version"
else
    echo "❌ No package manager found"
    echo "Please install Node.js manually from: https://nodejs.org/"
    echo "Download Node.js 18 LTS"
fi
