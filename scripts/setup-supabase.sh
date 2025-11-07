#!/bin/bash

# Supabase Setup Script
# This script helps you set up Supabase for RanchLink

echo "🗄️  RanchLink Supabase Setup"
echo "=============================="
echo ""

# Check if .env.local exists
if [ ! -f "apps/web/.env.local" ]; then
    echo "❌ Error: apps/web/.env.local not found"
    echo "   Please create it first with your Supabase credentials"
    exit 1
fi

echo "✅ Found .env.local"
echo ""

# Check for Supabase URL
if grep -q "NEXT_PUBLIC_SUPABASE_URL" apps/web/.env.local; then
    SUPABASE_URL=$(grep "NEXT_PUBLIC_SUPABASE_URL" apps/web/.env.local | cut -d '=' -f2)
    echo "✅ Supabase URL: $SUPABASE_URL"
else
    echo "❌ Error: NEXT_PUBLIC_SUPABASE_URL not found in .env.local"
    exit 1
fi

# Check for anon key
if grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY" apps/web/.env.local; then
    echo "✅ Supabase Anon Key: Configured"
else
    echo "❌ Error: NEXT_PUBLIC_SUPABASE_ANON_KEY not found in .env.local"
    exit 1
fi

# Check for service role key
if grep -q "SUPABASE_SERVICE_KEY=" apps/web/.env.local && ! grep -q "SUPABASE_SERVICE_KEY=$" apps/web/.env.local; then
    echo "✅ Supabase Service Role Key: Configured"
else
    echo "⚠️  Warning: SUPABASE_SERVICE_KEY not configured"
    echo "   Get it from: https://supabase.com/dashboard/project/utovzxpmfnzihurotqnv/settings/api"
    echo ""
fi

echo ""
echo "📋 Next Steps:"
echo "=============="
echo ""
echo "1. Get Service Role Key (if not done):"
echo "   https://supabase.com/dashboard/project/utovzxpmfnzihurotqnv/settings/api"
echo ""
echo "2. Run Database Migrations:"
echo "   Option A: Use Supabase SQL Editor"
echo "   https://supabase.com/dashboard/project/utovzxpmfnzihurotqnv/sql/new"
echo ""
echo "   Option B: Use Supabase CLI"
echo "   supabase link --project-ref utovzxpmfnzihurotqnv"
echo "   supabase db push"
echo ""
echo "3. Verify Tables Created:"
echo "   https://supabase.com/dashboard/project/utovzxpmfnzihurotqnv/editor"
echo ""
echo "4. Test Connection:"
echo "   cd apps/web && npm run dev"
echo ""
echo "✅ Setup checklist saved to SUPABASE_SETUP.md"
echo ""

