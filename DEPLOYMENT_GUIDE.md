# RanchLink Deployment Guide

## Quick Decision

**Recommendation: Deploy Next.js app to Vercel, keep ritxma.com on Hostinger**

This gives you:
- ✅ Fastest deployment (minutes, not hours)
- ✅ Best performance (Next.js optimized)
- ✅ Free tier for MVP
- ✅ Easy to migrate later if needed
- ✅ Keep ritxma.com marketing site on Hostinger

## Deployment Options

### Option 1: Vercel (Recommended) ⭐

**Best for: Speed, Performance, Simplicity**

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd apps/web
vercel

# Add custom domain
vercel domains add app.ritxma.com
```

**Setup:**
1. Connect GitHub repo to Vercel
2. Auto-deploy on push
3. Environment variables in dashboard
4. Free SSL, CDN, edge functions

**Cost:** Free → $20/mo (pro)

### Option 2: Hostinger VPS

**Best for: Full Control, Custom Setup**

```bash
# Build standalone
cd apps/web
NEXT_OUTPUT=standalone npm run build

# Creates: .next/standalone folder
# Copy to Hostinger VPS

# On VPS:
npm install -g pm2
pm2 start server.js --name ranchlink
pm2 save
pm2 startup
```

**Nginx Config:**
```nginx
server {
    listen 80;
    server_name app.ritxma.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Cost:** $4-10/mo

### Option 3: Split Architecture

**Frontend (Hostinger) + Backend (Separate)**

```bash
# Build static frontend
cd apps/web
npm run build
# Output: out/ folder

# Deploy out/ to Hostinger (static files)
# Deploy API to: Railway, Render, Fly.io, or VPS
```

**Pros:**
- Use existing Hostinger setup
- Frontend static (fast)

**Cons:**
- More complex
- Need to split API routes
- CORS configuration needed

**Cost:** $10-20/mo

## Recommended Architecture

```
┌─────────────────────────────────────┐
│  ritxma.com (Hostinger)             │
│  Marketing site, company info        │
└─────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│  app.ritxma.com (Vercel)            │
│  RanchLink Next.js App               │
│  ├── Frontend (React)                │
│  └── API Routes (Serverless)         │
└─────────────────────────────────────┘
                │
                ├──► Supabase (Database)
                ├──► Base L2 (Blockchain)
                └──► IPFS (Storage)
```

## Environment Variables

Create `.env.production`:

```bash
# Database
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_KEY=...

# Blockchain
ALCHEMY_BASE_RPC=https://...
PRIVATE_KEY=...

# IPFS
WEB3STORAGE_TOKEN=...

# App
NEXT_PUBLIC_APP_URL=https://app.ritxma.com
```

## Deployment Steps (Vercel)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/ranchlink.git
   git push -u origin main
   ```

2. **Connect to Vercel**
   - Go to vercel.com
   - Import GitHub repo
   - Select `apps/web` as root directory
   - Add environment variables
   - Deploy!

3. **Custom Domain**
   - Vercel dashboard → Domains
   - Add `app.ritxma.com`
   - Update DNS in Hostinger:
     ```
     Type: CNAME
     Name: app
     Value: cname.vercel-dns.com
     ```

## Deployment Steps (Hostinger VPS)

1. **Build Standalone**
   ```bash
   cd apps/web
   NEXT_OUTPUT=standalone npm run build
   ```

2. **Upload to VPS**
   ```bash
   scp -r .next/standalone user@your-vps:/var/www/ranchlink
   ```

3. **Setup PM2**
   ```bash
   cd /var/www/ranchlink
   npm install --production
   pm2 start server.js --name ranchlink
   pm2 save
   ```

4. **Configure Nginx** (see above)

5. **SSL Certificate**
   ```bash
   certbot --nginx -d app.ritxma.com
   ```

## Migration Path

**Start with Vercel → Move to Hostinger later if needed**

- Next.js standalone build works on any Node.js server
- No vendor lock-in
- Can export anytime

## Cost Comparison

| Option | Setup Time | Monthly Cost | Maintenance |
|--------|-----------|--------------|-------------|
| Vercel | 5 min | $0-20 | Low |
| Hostinger VPS | 1-2 hours | $4-10 | Medium |
| Split | 2-3 hours | $10-20 | High |

## My Recommendation

**Start with Vercel for MVP, migrate later if needed**

**Why:**
- Ship faster (focus on features, not infrastructure)
- Better performance (optimized for Next.js)
- Easier maintenance (automatic deployments)
- Free tier covers MVP
- Can always migrate to Hostinger later

**When to migrate:**
- Need full server control
- Want everything on one platform
- Have specific compliance requirements
- Budget constraints

## Questions?

Let me know your preference and I'll help you set it up!

