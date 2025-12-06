# 🗄️ Supabase Setup Guide

## ✅ Configuration Complete

### **Supabase Project:**
- **URL**: `https://utovzxpmfnzihurotqnv.supabase.co`
- **Anon Key**: ✅ Configured in `.env.local`
- **Service Role Key**: ⚠️ Need to get from dashboard

## 📋 Next Steps

### **1. Get Service Role Key (Required for Server-Side)**

1. Go to Supabase Dashboard:
   ```
   https://supabase.com/dashboard/project/utovzxpmfnzihurotqnv/settings/api
   ```

2. Under "Project API keys", find **"service_role"** key
   - ⚠️ **Keep this secret!** Never expose in frontend
   - Only use for server-side operations

3. Copy the key and add to `.env.local`:
   ```bash
   SUPABASE_SERVICE_KEY=your-service-role-key-here
   ```

### **2. Run Database Migrations**

The database schema needs to be created. You can do this in two ways:

#### **Option A: Using Supabase SQL Editor (Recommended)**

1. Go to SQL Editor:
   ```
   https://supabase.com/dashboard/project/utovzxpmfnzihurotqnv/sql/new
   ```

2. Open the migration file:
   ```
   infra/db/migrations/001_initial_schema.sql
   ```

3. Copy the entire SQL script

4. Paste into Supabase SQL Editor

5. Click "Run" to execute

#### **Option B: Using Supabase CLI (If Installed)**

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref utovzxpmfnzihurotqnv

# Run migrations
supabase db push
```

### **3. Verify Tables Created**

1. Go to Table Editor:
   ```
   https://supabase.com/dashboard/project/utovzxpmfnzihurotqnv/editor
   ```

2. You should see these tables:
   - ✅ `owners`
   - ✅ `animals`
   - ✅ `events`
   - ✅ `anchors`
   - ✅ `transfers`
   - ✅ `batches`
   - ✅ `devices`
   - ✅ `qa_tests`
   - ✅ `custody_log`
   - ✅ `contracts`
   - ✅ `wallets`
   - ✅ `rwa_iot`

### **4. Test Connection**

Create a test script to verify connection:

```bash
cd apps/web
npm run dev
```

Then test the Supabase connection in your app.

## 🔐 Security Notes

### **Service Role Key:**
- ⚠️ **NEVER** expose in frontend code
- ⚠️ **NEVER** commit to Git
- ✅ Only use in server-side API routes
- ✅ Keep in `.env.local` (already in `.gitignore`)

### **Anon Key:**
- ✅ Safe to use in frontend
- ✅ Already configured
- ✅ Row Level Security (RLS) will protect data

## 📊 Database Schema Overview

The migration creates 12 tables:

1. **`owners`** - User/owner accounts
2. **`animals`** - Animal records linked to tags
3. **`events`** - Animal events (vaccination, movement, etc.)
4. **`anchors`** - Blockchain data anchors
5. **`transfers`** - Ownership transfers
6. **`batches`** - Tag batch production
7. **`devices`** - Physical tag devices
8. **`qa_tests`** - Quality assurance tests
9. **`custody_log`** - Chain of custody tracking
10. **`contracts`** - Smart contract addresses
11. **`wallets`** - Wallet addresses
12. **`rwa_iot`** - IoT device data

## 🚀 After Setup

Once migrations are run:

1. ✅ Database ready
2. ✅ Tables created
3. ✅ Can start using Supabase in your app
4. ⏳ Next: Get other API keys (Alchemy, Coinbase CDP)

## 💡 Quick Commands

```bash
# Test Supabase connection
cd apps/web
npm run dev

# Check environment variables
cat .env.local | grep SUPABASE

# Verify tables (in Supabase Dashboard)
# Go to: https://supabase.com/dashboard/project/utovzxpmfnzihurotqnv/editor
```

## 🆘 Troubleshooting

### **Connection Issues:**
- Check `.env.local` has correct URL and keys
- Verify Supabase project is active
- Check network/firewall settings

### **Migration Issues:**
- Check SQL syntax in migration file
- Verify you have permissions in Supabase
- Check Supabase logs for errors

### **Service Role Key:**
- Make sure you're copying the full key
- Check there are no extra spaces
- Verify key starts with `eyJhbGc...`

Ready to run migrations? Let me know when you have the service role key! 🚀


