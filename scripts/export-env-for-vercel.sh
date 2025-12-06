#!/bin/bash
# Export all environment variables in Vercel-ready format

echo "=========================================="
echo "VERCEL ENVIRONMENT VARIABLES"
echo "=========================================="
echo ""
echo "Copy each variable below and paste into Vercel:"
echo "Settings → Environment Variables → Add New"
echo ""
echo "=========================================="
echo "CLIENT-SIDE (NEXT_PUBLIC_*)"
echo "=========================================="
echo ""

cd "$(dirname "$0")/../apps/web" || exit 1

# Read .env.local and format for Vercel
while IFS='=' read -r key value; do
  # Skip comments and empty lines
  [[ "$key" =~ ^#.*$ ]] && continue
  [[ -z "$key" ]] && continue
  
  # Remove any leading/trailing whitespace
  key=$(echo "$key" | xargs)
  value=$(echo "$value" | xargs)
  
  # Skip if empty
  [[ -z "$value" ]] && continue
  
  # Format output
  if [[ "$key" == NEXT_PUBLIC_* ]]; then
    echo "Key: $key"
    echo "Value: $value"
    echo "Environment: Production, Preview, Development"
    echo "---"
  fi
done < .env.local

echo ""
echo "=========================================="
echo "SERVER-SIDE SECRETS (NOT NEXT_PUBLIC_*)"
echo "=========================================="
echo ""

while IFS='=' read -r key value; do
  # Skip comments and empty lines
  [[ "$key" =~ ^#.*$ ]] && continue
  [[ -z "$key" ]] && continue
  
  # Remove any leading/trailing whitespace
  key=$(echo "$key" | xargs)
  value=$(echo "$value" | xargs)
  
  # Skip if empty
  [[ -z "$value" ]] && continue
  
  # Format output (server-side secrets)
  if [[ "$key" != NEXT_PUBLIC_* ]]; then
    echo "Key: $key"
    echo "Value: $value"
    echo "Environment: Production, Preview, Development"
    echo "---"
  fi
done < .env.local

echo ""
echo "=========================================="
echo "DONE!"
echo "=========================================="
echo ""
echo "⚠️  IMPORTANT: Update NEXT_PUBLIC_APP_URL to:"
echo "   https://ranch-link.vercel.app"
echo ""
echo "⚠️  Leave NEXT_PUBLIC_CONTRACT_TAG and"
echo "   NEXT_PUBLIC_CONTRACT_REGISTRY empty for now"
echo ""


