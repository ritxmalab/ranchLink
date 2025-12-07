# 🔗 Links del Sistema RanchLink en Vercel

## 🌐 Dominio Base
**Producción:** `https://ranch-link.vercel.app`  
**Preview:** `https://ranch-link-{branch}.vercel.app` (para cada branch)

---

## 📄 Páginas Públicas (Frontend)

### Home / Landing
- **Home:** https://ranch-link.vercel.app/
- **Get Started:** https://ranch-link.vercel.app/start
- **Models:** https://ranch-link.vercel.app/models
- **Marketplace:** https://ranch-link.vercel.app/market

### Tag & Animal Routes (v1.0)
- **Tag Scan (Dynamic):** https://ranch-link.vercel.app/t/[tag_code]
  - Ejemplo: https://ranch-link.vercel.app/t/RL-001
  - Ejemplo: https://ranch-link.vercel.app/t/RL-002

- **Animal Card (Query):** https://ranch-link.vercel.app/a?id=[public_id]
  - Ejemplo: https://ranch-link.vercel.app/a?id=AUS0001
  - Ejemplo: https://ranch-link.vercel.app/a?id=AUS0002

- **Animal Card (Dynamic):** https://ranch-link.vercel.app/a/[public_id]
  - Ejemplo: https://ranch-link.vercel.app/a/AUS0001
  - Ejemplo: https://ranch-link.vercel.app/a/AUS0002

### Dashboard & Admin
- **Dashboard:** https://ranch-link.vercel.app/dashboard
- **Super Admin (Factory):** https://ranch-link.vercel.app/superadmin
- **QR Generator:** https://ranch-link.vercel.app/superadmin/qr-generator

### Retail Kits
- **Claim Kit:** https://ranch-link.vercel.app/claim-kit

---

## 🔌 API Endpoints (Backend)

### Factory / Batch Management
- **Create Batch:** `POST https://ranch-link.vercel.app/api/factory/batches`
- **Get Devices/Tags:** `GET https://ranch-link.vercel.app/api/superadmin/devices`
- **Upsert Device/Tag:** `POST https://ranch-link.vercel.app/api/superadmin/devices`

### Tag & Animal Management
- **Tag Scan Info:** `GET https://ranch-link.vercel.app/api/t/[tag_code]` (via page)
- **Attach Tag to Animal:** `POST https://ranch-link.vercel.app/api/attach-tag`
- **Claim Tag (Legacy):** `POST https://ranch-link.vercel.app/api/claim`

### Animal Data
- **Get Animal:** `GET https://ranch-link.vercel.app/api/animals/[public_id]`
  - Ejemplo: `GET https://ranch-link.vercel.app/api/animals/AUS0001`

### Dashboard Data
- **Get Animals:** `GET https://ranch-link.vercel.app/api/dashboard/animals`
- **Get Tags:** `GET https://ranch-link.vercel.app/api/dashboard/tags`

### Retail Kits
- **Claim Kit:** `POST https://ranch-link.vercel.app/api/claim-kit`

### Health & Diagnostics
- **Health Check:** `GET https://ranch-link.vercel.app/api/health`
- **Test Supabase:** `GET https://ranch-link.vercel.app/api/test-supabase`

---

## 🔗 Links Útiles

### Blockchain
- **Contract on Basescan:** https://basescan.org/address/0xCE165B70379Ca6211f9dCf6ffe8c3AC1eedB6242
- **Server Wallet:** https://basescan.org/address/0x6801078adCbEF93B9b7a5cbFb3BAb87Fdb9F8d83

### External Services
- **Supabase Dashboard:** https://supabase.com/dashboard/project/utovzxpmfnzihurotqnv
- **Vercel Dashboard:** https://vercel.com/dashboard

---

## 📋 Flujos Completos (Ejemplos)

### Flujo 1: Factory → Tag → Animal
1. **Create Batch:** https://ranch-link.vercel.app/superadmin
2. **Scan Tag:** https://ranch-link.vercel.app/t/RL-001
3. **Attach Animal:** (via form on tag page)
4. **View Animal:** https://ranch-link.vercel.app/a/AUS0001
5. **Dashboard:** https://ranch-link.vercel.app/dashboard

### Flujo 2: Retail Kit Claim
1. **Claim Kit:** https://ranch-link.vercel.app/claim-kit
2. **Enter Kit Code:** (form on page)
3. **Scan Tags:** https://ranch-link.vercel.app/t/RL-XXX
4. **Dashboard:** https://ranch-link.vercel.app/dashboard

---

## 🎯 Páginas Principales para Testing

### Para Usuarios Finales:
- ✅ Home: https://ranch-link.vercel.app/
- ✅ Tag Scan: https://ranch-link.vercel.app/t/RL-001
- ✅ Animal Card: https://ranch-link.vercel.app/a/AUS0001
- ✅ Dashboard: https://ranch-link.vercel.app/dashboard

### Para Administradores:
- ✅ Super Admin: https://ranch-link.vercel.app/superadmin
- ✅ QR Generator: https://ranch-link.vercel.app/superadmin/qr-generator
- ✅ Dashboard: https://ranch-link.vercel.app/dashboard

### Para Desarrolladores:
- ✅ Health Check: https://ranch-link.vercel.app/api/health
- ✅ Contract: https://basescan.org/address/0xCE165B70379Ca6211f9dCf6ffe8c3AC1eedB6242

---

**Nota:** Reemplaza `ranch-link.vercel.app` con tu dominio personalizado si lo tienes configurado.

