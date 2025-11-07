# Update Node.js - Quick Guide

## Current Version
You have: **Node.js v14.18.2** (too old)
You need: **Node.js 18+** (LTS recommended)

## Option 1: Using Homebrew (Easiest - Mac)

```bash
# Install/update Homebrew if needed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install latest Node.js
brew install node@18

# Or install latest LTS
brew install node

# Verify installation
node --version
npm --version
```

## Option 2: Using nvm (Node Version Manager)

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Restart terminal or run:
source ~/.zshrc

# Install Node.js 18 LTS
nvm install 18
nvm use 18

# Set as default
nvm alias default 18

# Verify
node --version
```

## Option 3: Download from nodejs.org

1. Visit: https://nodejs.org/
2. Download **Node.js 18 LTS** (or latest)
3. Install the .pkg file
4. Restart terminal
5. Verify: `node --version`

## After Updating Node.js

Once Node.js is updated:

```bash
cd /Users/gonzalobam/ranchlink/apps/web
npm install
npm run dev
```

Then open: **http://localhost:3000**

## Quick Check

After updating, verify:
```bash
node --version  # Should show v18.x.x or higher
npm --version   # Should show 9.x.x or higher
```

## Recommended: Node.js 18 LTS

- Stable
- Works with Next.js 14
- Long-term support
- Best for production

Let me know which method you prefer and I'll help you through it!

