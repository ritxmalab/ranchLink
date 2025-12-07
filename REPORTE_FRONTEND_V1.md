# 🎨 REPORTE FRONTEND - RanchLink v1.0

## 📋 ÍNDICE
1. [Arquitectura Frontend](#arquitectura-frontend)
2. [Páginas y Rutas](#páginas-y-rutas)
3. [Componentes](#componentes)
4. [Estilos y Diseño](#estilos-y-diseño)
5. [Estado y Data Fetching](#estado-y-data-fetching)
6. [Errores y Soluciones Frontend](#errores-y-soluciones-frontend)
7. [Diferencias v0.9 vs v1.0 (Frontend)](#diferencias-v09-vs-v10-frontend)
8. [Estado Actual y Pendientes](#estado-actual-y-pendientes-frontend)

---

## 🏗️ ARQUITECTURA FRONTEND

### **Stack Tecnológico**

```
┌─────────────────────────────────────────────────────────┐
│                  RANCHLINK FRONTEND                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Next.js 13.5.6 (App Router)                   │  │
│  │  - Server Components (SSR)                     │  │
│  │  - Client Components ('use client')             │  │
│  │  - API Routes (Backend)                         │  │
│  └──────────────────────────────────────────────────┘  │
│                          │                               │
│                          ▼                               │
│  ┌──────────────────────────────────────────────────┐  │
│  │  React 18.2.0                                   │  │
│  │  - Hooks (useState, useEffect)                  │  │
│  │  - Client-side interactivity                    │  │
│  └──────────────────────────────────────────────────┘  │
│                          │                               │
│                          ▼                               │
│  ┌──────────────────────────────────────────────────┐  │
│  │  TypeScript 5.3.0                               │  │
│  │  - Type safety                                  │  │
│  │  - Interface definitions                        │  │
│  └──────────────────────────────────────────────────┘  │
│                          │                               │
│                          ▼                               │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Tailwind CSS 3.4.0                             │  │
│  │  - Utility-first styling                         │  │
│  │  - Custom CSS variables                           │  │
│  └──────────────────────────────────────────────────┘  │
│                          │                               │
│                          ▼                               │
│  ┌──────────────────────────────────────────────────┐  │
│  │  QRCode Library (qrcode 1.5.3)                  │  │
│  │  - QR code generation                            │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### **Estructura de Directorios**

```
apps/web/
├── app/                          # Next.js App Router
│   ├── page.tsx                 # Homepage (/)
│   ├── layout.tsx               # Root layout
│   ├── globals.css               # Global styles
│   ├── start/                    # Claim flow
│   │   └── page.tsx
│   ├── dashboard/                # Owner dashboard
│   │   └── page.tsx
│   ├── a/                        # Animal card (public)
│   │   └── page.tsx
│   ├── models/                   # Product models
│   │   └── page.tsx
│   ├── market/                   # Marketplace
│   │   └── page.tsx
│   ├── superadmin/              # Factory admin
│   │   ├── page.tsx
│   │   └── qr-generator/
│   │       └── page.tsx
│   ├── t/                        # Tag scan route (v1.0)
│   │   └── [tag_code]/
│   │       └── page.tsx
│   └── api/                      # API routes (backend)
│       ├── health/
│       ├── factory/batches/
│       ├── superadmin/devices/
│       └── animals/[id]/
├── components/                   # Reusable components
│   ├── Navigation.tsx
│   └── QRCodeDisplay.tsx
└── lib/                          # Utilities
    ├── supabase/
    │   ├── client.ts
    │   └── server.ts
    ├── blockchain/
    │   └── ranchLinkTag.ts
    └── ipfs/
        └── client.ts
```

---

## 📄 PÁGINAS Y RUTAS

### **1. Homepage (`/`)** ✅

**Archivo:** `apps/web/app/page.tsx`

**Características:**
- Hero section: "Tag. Scan. Done."
- 4-step process visualization
- Pricing cards (Single $6.50, 4-pack $22, 10-pack $49)
- Call-to-action buttons
- Texas-themed design

**Componentes:**
- Server Component (SSR)
- No data fetching
- Static content

**Estado:** ✅ Completo y funcional

---

### **2. Claim Flow (`/start`)** ⚠️ v0.9 (Deprecado en v1.0)

**Archivo:** `apps/web/app/start/page.tsx`

**Características v0.9:**
- Step 1: Enter claim token (from overlay QR)
- Step 2: Owner info + Animal details form
- Progress indicator
- Form validation

**Estado v1.0:**
- ⚠️ Deprecado - Reemplazado por `/t/[tag_code]`
- Mantenido para compatibilidad temporal

**Nuevo Flujo v1.0:**
- Usuario escanea QR → `/t/RL-001`
- Si tag no tiene animal → Formulario de vinculación
- Si tag tiene animal → Redirige a `/a/[public_id]`

---

### **3. Tag Scan Route (`/t/[tag_code]`)** ✅ NUEVO v1.0

**Archivo:** `apps/web/app/t/[tag_code]/page.tsx`

**Características:**
- Server Component (SSR)
- Busca tag en Supabase por `tag_code`
- Si tag no encontrado → 404
- Si tag sin animal:
  - Usuario autenticado + dueño del ranch → Formulario de vinculación
  - Otro → Mensaje "Tag no vinculado"
- Si tag con animal → Redirige a `/a/[public_id]`

**Data Fetching:**
```typescript
const { data: tag } = await supabase
  .from('tags')
  .select(`
    *,
    animals (public_id, name, species, breed),
    ranches (id, name)
  `)
  .eq('tag_code', tag_code)
  .single()
```

**Estado:** ✅ Implementado, pendiente testing

---

### **4. Animal Card (`/a/[public_id]`)** ⚠️ Necesita Actualización

**Archivo:** `apps/web/app/a/page.tsx`

**Características Actuales:**
- Muestra perfil de animal
- Stats grid (Species, Breed, Age)
- Activity timeline
- Quick action buttons

**Necesita Actualización v1.0:**
- Mostrar `token_id` del NFT
- Link a Basescan: `https://basescan.org/token/{contract}?a={tokenId}`
- Mostrar `tag_code` del tag físico
- Actualizar data fetching para usar nuevo schema

**Estado:** ⚠️ Funcional pero necesita actualización para v1.0

---

### **5. Dashboard (`/dashboard`)** ⚠️ Necesita Actualización

**Archivo:** `apps/web/app/dashboard/page.tsx`

**Características Actuales:**
- Stats overview (Total, Active, Pending, Events)
- Quick actions bar
- Animals grid (Yu-Gi-Oh style cards)
- Click animal → Opens animal page

**Necesita Actualización v1.0:**
- Data fetching desde nuevo schema (`ranches`, `tags`)
- Mostrar `token_id` en cards
- Links a Basescan
- Filtrar por `ranch_id` del usuario autenticado

**Estado:** ⚠️ Funcional pero necesita actualización para v1.0

---

### **6. Marketplace (`/market`)** ✅

**Archivo:** `apps/web/app/market/page.tsx`

**Características:**
- Product cards (Yu-Gi-Oh style design)
- 3 products: Single, 4-pack, 10-pack
- Pricing, shipping, stock info
- 3D preview section (placeholder)

**Estado:** ✅ Completo (UI ready, backend pendiente)

---

### **7. Models Page (`/models`)** ✅

**Archivo:** `apps/web/app/models/page.tsx`

**Características:**
- Muestra diferentes modelos de tags
- Especificaciones técnicas
- Comparación de modelos

**Estado:** ✅ Completo

---

### **8. Super Admin Factory (`/superadmin`)** ⚠️ Necesita Actualización

**Archivo:** `apps/web/app/superadmin/page.tsx`

**Características Actuales:**
- 4 Tabs: Dashboard, Batches, Inventory, QR Generator
- QR Generator genera QRs client-side
- Lista de devices/tags
- Batch creation form

**Problemas Actuales:**
- Genera QRs client-side (no guarda en DB)
- No llama a `POST /api/factory/batches`
- No muestra `token_id` ni links a Basescan

**Necesita Actualización v1.0:**
```typescript
// ❌ ACTUAL (client-side only)
const generateBatchQRCodes = (batchId: string, count: number) => {
  // Genera QRs en memoria, no persiste
}

// ✅ DEBE SER (llamar API)
const handleGenerate = async () => {
  const response = await fetch('/api/factory/batches', {
    method: 'POST',
    body: JSON.stringify({
      batchName,
      batchSize,
      model,
      material,
      color,
      chain: 'BASE'
    })
  })
  const data = await response.json()
  // data.tags contiene token_id, mint_tx_hash, etc.
}
```

**Estado:** ⚠️ Funcional pero necesita integración con nuevo endpoint

---

### **9. QR Generator (`/superadmin/qr-generator`)** ⚠️

**Archivo:** `apps/web/app/superadmin/qr-generator/page.tsx`

**Características:**
- Generación de QRs para impresión
- Preview de QRs
- Download individual
- Print all

**Estado:** ⚠️ Funcional pero necesita usar datos del endpoint

---

### **10. Claim Kit Page (`/claim-kit`)** ⏳ PENDIENTE

**Archivo:** No existe aún

**Necesita Creación:**
- Formulario para ingresar `kit_code`
- Formulario para crear nuevo ranch
- Submit a `POST /api/claim-kit`
- Confirmación de claim exitoso

**Estado:** ⏳ No implementado

---

## 🧩 COMPONENTES

### **1. Navigation Component** ✅

**Archivo:** `apps/web/components/Navigation.tsx`

**Características:**
- Sticky header
- Active page highlighting
- Responsive design
- Links a todas las páginas principales

**Props:**
- Ninguna (usa `usePathname()` hook)

**Estado:** ✅ Completo y funcional

---

### **2. QRCodeDisplay Component** ✅

**Archivo:** `apps/web/components/QRCodeDisplay.tsx`

**Características:**
- Muestra QR code
- Download button
- Print functionality

**Props:**
```typescript
interface QRCodeDisplayProps {
  url: string
  label?: string
  size?: number
}
```

**Estado:** ✅ Completo y funcional

---

## 🎨 ESTILOS Y DISEÑO

### **Sistema de Colores**

Definido en `apps/web/app/globals.css`:

```css
:root {
  --bg: #0A0A0A;              /* Dark background */
  --bg-secondary: #1A1A1A;    /* Secondary background */
  --bg-card: #1F1F1F;         /* Card background */
  --c1: #BF5700;              /* Texas orange (primary) */
  --c2: #E7B552;              /* Gold (accent) */
  --c3: #F8F3E8;              /* Warm beige */
  --c4: #A0A0A0;              /* Gray text */
}
```

### **Tipografía**

- Font family: System fonts (San Francisco, Segoe UI, etc.)
- Headings: Bold, large sizes
- Body: Regular, readable sizes
- Code: Monospace

### **Componentes de Diseño**

**Cards:**
- Yu-Gi-Oh style (bordered, elevated)
- Hover effects
- Smooth transitions

**Buttons:**
- Gradient backgrounds
- Hover states
- Disabled states

**Forms:**
- Clean inputs
- Focus states
- Validation feedback

**Grid Layouts:**
- Responsive columns
- Gap spacing
- Mobile-friendly

---

## 🔄 ESTADO Y DATA FETCHING

### **Client Components**

**Uso de Hooks:**
```typescript
// useState para estado local
const [devices, setDevices] = useState<Device[]>([])
const [isLoading, setIsLoading] = useState(false)

// useEffect para data fetching
useEffect(() => {
  fetchDevices()
}, [])

// Fetch desde API
const fetchDevices = async () => {
  const response = await fetch('/api/superadmin/devices')
  const data = await response.json()
  setDevices(data.devices)
}
```

### **Server Components**

**Data Fetching Directo:**
```typescript
// En Server Component
import { getSupabaseServerClient } from '@/lib/supabase/server'

export default async function TagScanPage({ params }: PageProps) {
  const supabase = getSupabaseServerClient()
  const { data: tag } = await supabase
    .from('tags')
    .select('*')
    .eq('tag_code', params.tag_code)
    .single()
  
  return <div>...</div>
}
```

### **API Routes**

**Fetch desde Client:**
```typescript
// Client Component
const response = await fetch('/api/factory/batches', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ batchName, batchSize, ... })
})
const data = await response.json()
```

---

## 🐛 ERRORES Y SOLUCIONES FRONTEND

### **Error 1: "TypeError: fetch failed" en Super Admin**

**Síntoma:**
```
TypeError: fetch failed
at fetchDevices() in superadmin/page.tsx
```

**Causa Raíz:**
- Backend API route tenía error (usaba cliente incorrecto)
- Frontend no manejaba errores correctamente

**Solución Backend:**
- ✅ Fix en `apps/web/app/api/superadmin/devices/route.ts`
- Cambio de `createServerClient()` a `getSupabaseServerClient()`

**Solución Frontend:**
```typescript
// ✅ Agregar manejo de errores
const fetchDevices = async () => {
  setIsLoadingDevices(true)
  setErrorMessage(null)
  try {
    const response = await fetch('/api/superadmin/devices')
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error || 'Failed to load devices')
    }
    setDevices(data.devices.map(mapDevice))
  } catch (error: any) {
    console.error(error)
    setErrorMessage(error.message)  // ✅ Mostrar error al usuario
  } finally {
    setIsLoadingDevices(false)
  }
}
```

**Archivo Corregido:**
- ✅ `apps/web/app/superadmin/page.tsx`

---

### **Error 2: QR Generation no persiste datos**

**Síntoma:**
- QRs generados en UI pero no guardados en DB
- No se mintean NFTs
- No hay `token_id` disponible

**Causa Raíz:**
- Factory UI genera QRs client-side
- No llama a `POST /api/factory/batches`

**Solución:**
```typescript
// ❌ ACTUAL (incorrecto)
const generateBatchQRCodes = (batchId: string, count: number) => {
  // Genera QRs en memoria
  const generated: Device[] = []
  for (let i = 0; i < count; i++) {
    // ... genera QR localmente
  }
  setDevices(generated)
}

// ✅ DEBE SER (correcto)
const handleGenerate = async () => {
  setIsSaving(true)
  setErrorMessage(null)
  try {
    const response = await fetch('/api/factory/batches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        batchName,
        batchSize,
        model,
        material,
        color,
        chain: 'BASE',
      }),
    })
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error || 'Failed to generate batch')
    }
    // data.tags contiene token_id, mint_tx_hash, etc.
    setDevices(data.tags.map(mapDevice))
    setMessage(`Generated ${data.tags.length} tags with NFTs`)
  } catch (error: any) {
    setErrorMessage(error.message)
  } finally {
    setIsSaving(false)
  }
}
```

**Estado:** ⏳ Pendiente implementación

---

### **Error 3: Variables de entorno no disponibles en build**

**Síntoma:**
```
ReferenceError: process is not defined
at appUrl calculation
```

**Causa Raíz:**
- `process.env` no disponible en client-side sin `NEXT_PUBLIC_` prefix

**Solución:**
```typescript
// ❌ INCORRECTO
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// ✅ CORRECTO (client-side)
const appUrl = typeof window !== 'undefined'
  ? window.location.origin
  : (process.env.NEXT_PUBLIC_APP_URL || 'https://ranch-link.vercel.app')
```

**Archivo Corregido:**
- ✅ `apps/web/app/superadmin/page.tsx`

---

## 🔄 DIFERENCIAS v0.9 vs v1.0 (FRONTEND)

### **1. Claim Flow**

**v0.9:**
```
1. Usuario escanea Overlay QR
2. Visita /start?token=xxx
3. Completa formulario
4. Submit a POST /api/claim
```

**v1.0:**
```
1. Usuario escanea Base QR (único)
2. Visita /t/RL-001 (Server Component)
3. Si tag sin animal:
   - Formulario de vinculación (si autenticado)
   - Mensaje "no vinculado" (si no autenticado)
4. Si tag con animal:
   - Redirige a /a/AUS0001
```

**Cambios:**
- ❌ `/start` deprecado
- ✅ `/t/[tag_code]` nuevo route
- ✅ Server-side rendering
- ✅ No requiere token

---

### **2. Factory/QR Generation**

**v0.9:**
```
1. UI genera QRs client-side
2. Guarda en devices table (POST /api/superadmin/devices)
3. No mintea NFTs
4. Genera claim_token por tag
```

**v1.0:**
```
1. UI llama POST /api/factory/batches
2. Backend:
   - Crea batch en DB
   - Genera tags secuenciales
   - Mintea NFTs
   - Pin metadata en IPFS
3. Retorna tags con token_id
4. UI muestra QRs con links a Basescan
```

**Cambios:**
- ✅ Endpoint centralizado
- ✅ NFTs mintados automáticamente
- ✅ Token IDs disponibles
- ✅ Links a Basescan

---

### **3. Animal Card**

**v0.9:**
```
- Muestra: name, species, breed, age
- Events timeline
- Quick actions
```

**v1.0:**
```
- Todo lo anterior +
- Token ID del NFT
- Link a Basescan
- Tag code del tag físico
- Chain info (Base L2)
```

**Cambios:**
- ✅ Muestra información blockchain
- ✅ Links a exploradores

---

### **4. Dashboard**

**v0.9:**
```
- Data desde animals table
- Filtra por owner_id
- Muestra animales del usuario
```

**v1.0:**
```
- Data desde animals + tags + ranches
- Filtra por ranch_id
- Muestra token_id en cards
- Links a Basescan
```

**Cambios:**
- ✅ Nuevo schema (ranches)
- ✅ Información blockchain
- ✅ Mejor estructura de datos

---

### **5. Navigation**

**v0.9:**
```
- Links estáticos
- No muestra admin links
```

**v1.0:**
```
- Mismo diseño
- /superadmin oculto (admin: true)
- Preparado para autenticación
```

**Cambios:**
- ✅ Preparado para auth
- ✅ Admin routes ocultos

---

## ✅ ESTADO ACTUAL Y PENDIENTES (FRONTEND)

### **✅ Completado**

1. **Páginas:**
   - ✅ Homepage (`/`)
   - ✅ Models (`/models`)
   - ✅ Marketplace (`/market`)
   - ✅ Tag Scan Route (`/t/[tag_code]`) - Nuevo v1.0
   - ✅ Super Admin (`/superadmin`)

2. **Componentes:**
   - ✅ Navigation
   - ✅ QRCodeDisplay

3. **Estilos:**
   - ✅ Sistema de colores
   - ✅ Tipografía
   - ✅ Componentes de diseño
   - ✅ Responsive design

4. **Data Fetching:**
   - ✅ Server Components configurados
   - ✅ Client Components con hooks
   - ✅ API routes integradas

5. **Errores Corregidos:**
   - ✅ Manejo de errores en fetchDevices
   - ✅ Variables de entorno en client-side
   - ✅ TypeScript types

### **⏳ Pendiente**

1. **Actualización de Páginas:**
   - ⏳ `/superadmin` - Integrar con `POST /api/factory/batches`
   - ⏳ `/a/[public_id]` - Mostrar token_id y Basescan links
   - ⏳ `/dashboard` - Actualizar para nuevo schema
   - ⏳ `/start` - Deprecar o actualizar para v1.0

2. **Nuevas Páginas:**
   - ⏳ `/claim-kit` - Página de claim de kits retail
   - ⏳ `/claim-kit/success` - Confirmación de claim

3. **Componentes:**
   - ⏳ `AnimalCard` - Mostrar info blockchain
   - ⏳ `TagCard` - Mostrar tag con token_id
   - ⏳ `BasescanLink` - Componente para links a Basescan

4. **Autenticación:**
   - ⏳ Integrar Supabase Auth
   - ⏳ Proteger rutas admin
   - ⏳ Mostrar usuario autenticado
   - ⏳ Verificar ownership de ranch

5. **UX Improvements:**
   - ⏳ Loading states mejorados
   - ⏳ Error boundaries
   - ⏳ Toast notifications
   - ⏳ Optimistic updates

6. **Testing:**
   - ⏳ Test de tag scan flow
   - ⏳ Test de factory flow
   - ⏳ Test de claim kit flow
   - ⏳ Test responsive design

---

## 📝 NOTAS TÉCNICAS

### **Client vs Server Components**

**Client Components (`'use client'`):**
- Interactividad (onClick, useState, useEffect)
- Browser APIs (window, localStorage)
- Event handlers

**Server Components (default):**
- Data fetching directo
- SEO-friendly
- No JavaScript en cliente
- Acceso a secrets

### **Data Fetching Patterns**

**Server Components:**
```typescript
// Directo desde Supabase
const supabase = getSupabaseServerClient()
const { data } = await supabase.from('tags').select('*')
```

**Client Components:**
```typescript
// Desde API routes
const response = await fetch('/api/superadmin/devices')
const data = await response.json()
```

### **Type Safety**

- Interfaces definidas para todos los datos
- TypeScript en todos los archivos
- Type checking en build

---

## 🚀 PRÓXIMOS PASOS

1. **Inmediato:**
   - Actualizar `/superadmin` para usar nuevo endpoint
   - Actualizar `/a/[public_id]` para mostrar token_id
   - Actualizar `/dashboard` para nuevo schema

2. **Corto Plazo:**
   - Crear `/claim-kit` page
   - Integrar autenticación
   - Agregar componentes de blockchain info

3. **Mediano Plazo:**
   - Mejorar UX (loading, errors, toasts)
   - Testing completo
   - Optimizaciones de performance

---

**Última Actualización:** 2024-01-XX
**Versión:** v1.0 (Frontend)
**Estado:** ✅ Core implementado, pendiente integración completa con v1.0 backend

