# 🔗 Alchemy RPC URL para Vercel

## 📍 Lo que Necesitas

**Variable en Vercel:** `NEXT_PUBLIC_ALCHEMY_BASE_RPC`

**Valor:** La URL de Alchemy para **Base Mainnet** (no Ethereum)

---

## 🔍 Cómo Obtenerla

### Opción 1: Desde el Dashboard de Alchemy (Recomendado)

1. En tu dashboard de Alchemy, ve a la sección **"Endpoints"** o **"Node"**
2. Busca la red **"Base"** o **"Base Mainnet"** (no Ethereum)
3. Copia la URL HTTPS que aparece

**Formato esperado:**
```
https://base-mainnet.g.alchemy.com/v2/trKkGtYbzcwRqIW4JtlK5
```

### Opción 2: Construirla Manualmente

Si no encuentras la opción de Base en el dashboard:

**Tu API Key:** `trKkGtYbzcwRqIW4JtlK5`

**URL para Base Mainnet:**
```
https://base-mainnet.g.alchemy.com/v2/trKkGtYbzcwRqIW4JtlK5
```

---

## ✅ Valor Exacto para Vercel

**Variable Name:** `NEXT_PUBLIC_ALCHEMY_BASE_RPC`

**Variable Value:**
```
https://base-mainnet.g.alchemy.com/v2/trKkGtYbzcwRqIW4JtlK5
```

**Environment:** ✅ Production, ✅ Preview, ✅ Development

---

## 🔄 Si No Tienes Base Configurado en Alchemy

1. En el dashboard de Alchemy, haz clic en **"Create App"** o **"Add Network"**
2. Selecciona **"Base"** → **"Mainnet"**
3. Copia la URL HTTPS que te da

**Nota:** Si tu app actual solo tiene Ethereum, necesitas agregar Base como una red adicional o crear una nueva app para Base.

---

## ⚠️ Diferencia Importante

- ❌ **NO uses:** `https://eth-mainnet.g.alchemy.com/v2/...` (Ethereum)
- ✅ **USA:** `https://base-mainnet.g.alchemy.com/v2/...` (Base)

La diferencia está en `eth-mainnet` vs `base-mainnet`.

---

## 🧪 Verificar que Funciona

Después de agregar la variable en Vercel:

1. Espera 1-2 minutos para que Vercel haga redeploy
2. Ve a: `https://ranch-link.vercel.app/api/diagnose-mint`
3. Deberías ver:
   ```json
   {
     "checks": {
       "env": {
         "NEXT_PUBLIC_ALCHEMY_BASE_RPC": { "exists": true }
       },
       "rpc": {
         "connected": true,
         "latest_block": "..."
       }
     }
   }
   ```

---

## 📋 Resumen

**Para Vercel:**
- **Variable:** `NEXT_PUBLIC_ALCHEMY_BASE_RPC`
- **Valor:** `https://base-mainnet.g.alchemy.com/v2/trKkGtYbzcwRqIW4JtlK5`
- **Environment:** Todas (Production, Preview, Development)

