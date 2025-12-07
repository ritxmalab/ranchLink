# 🚀 Cómo Completar el Mint

## 🎯 Problema Actual

El tag **RL-001** está:
- ✅ **Attached** (vinculado al animal Gonzo)
- ❌ **OFF-CHAIN** (el mint no se completó, `token_id` es NULL)

---

## 🔍 Por Qué el Mint No Se Completó

El mint debería ejecutarse automáticamente cuando generas un batch, pero puede fallar por:

1. ❌ **Falta de ETH en server wallet** (no hay gas)
2. ❌ **Variables de entorno incorrectas** (RPC, contract address)
3. ❌ **MINTER_ROLE no concedido** (server wallet sin permisos)
4. ❌ **Error en la transacción** (network, contract, etc.)

---

## ✅ Solución: Reintentar el Mint

He creado un endpoint `/api/retry-mint` para reintentar el mint de tags pendientes.

### Opción 1: Desde la UI (Más Fácil)

1. Ve a `/superadmin` → Tab **Inventory**
2. Busca el tag **RL-001** (o cualquier tag con "OFF-CHAIN")
3. Click en el botón **"🔄 Retry Mint"** que aparece junto a "OFF-CHAIN"
4. Confirma el diálogo
5. Espera a que se complete el mint
6. El `token_id` aparecerá y el estado cambiará a "ON-CHAIN"

### Opción 2: Desde la API (Directo)

Puedes llamar directamente al endpoint:

```bash
curl -X POST https://ranch-link.vercel.app/api/retry-mint \
  -H "Content-Type: application/json" \
  -d '{"tagCode": "RL-001"}'
```

O desde el navegador (consola):
```javascript
fetch('/api/retry-mint', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ tagCode: 'RL-001' })
})
.then(r => r.json())
.then(console.log)
```

---

## 🔧 Sobre `/start` (Claim)

**La página `/start` es LEGACY** (v0.9). En v1.0:

- ✅ **NO uses `/start`** para tags nuevos
- ✅ **Usa directamente `/t/[tag_code]`** (el QR ya apunta ahí)
- ✅ **He mejorado `/start`** para que redirija automáticamente si ingresas un `tag_code` (RL-XXX)

**Si ingresas "RL-001" en `/start`:**
- Ahora redirige automáticamente a `/t/RL-001`
- No necesitas llenar el formulario de claim

---

## 📊 Diferencia: Attach vs Mint

### **Attach** (Adjuntar)
- **Qué hace**: Vincula el tag a un animal en la base de datos
- **Cuándo**: Cuando escaneas el QR y llenas el formulario del animal
- **Resultado**: `tags.animal_id` → `animals.id`
- **No requiere blockchain**: Funciona sin mint

### **Mint** (Acuñar NFT)
- **Qué hace**: Crea el NFT en la blockchain
- **Cuándo**: Automáticamente al generar el batch (o manualmente con Retry Mint)
- **Resultado**: `tags.token_id` se llena con el ID del NFT
- **Requiere blockchain**: Necesita transacción exitosa

**Son independientes:**
- Puedes tener un tag **Attached** pero **OFF-CHAIN** (como RL-001 ahora)
- Puedes tener un tag **ON-CHAIN** pero no **Attached** (tag minted pero sin animal)

---

## 🎯 Pasos para Completar el Mint de RL-001

### Paso 1: Verificar Variables de Entorno en Vercel

Asegúrate de que estas variables estén configuradas:
- `RANCHLINKTAG_ADDRESS` = `0xCE165B70379Ca6211f9dCf6ffe8c3AC1eedB6242`
- `SERVER_WALLET_PRIVATE_KEY` = (tu private key)
- `ALCHEMY_BASE_RPC` = (tu endpoint de Alchemy)

### Paso 2: Verificar Balance del Server Wallet

Abre: https://basescan.org/address/0x6801078adCbEF93B9b7a5cbFb3BAb87Fdb9F8d83

**¿Tiene ETH?** (necesita > 0.001 ETH para gas)

### Paso 3: Reintentar el Mint

**Opción A - Desde la UI:**
1. Ve a `/superadmin` → Tab **Inventory**
2. Click **"🔄 Retry Mint"** en el tag RL-001

**Opción B - Desde la consola del navegador:**
```javascript
fetch('/api/retry-mint', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ tagCode: 'RL-001' })
})
.then(r => r.json())
.then(data => {
  if (data.success) {
    alert(`✅ Mint successful! Token ID: ${data.token_id}`)
    location.reload()
  } else {
    alert(`❌ Error: ${data.error || data.message}`)
  }
})
```

### Paso 4: Verificar Resultado

Después del mint exitoso:
- ✅ `token_id` aparecerá en la tabla
- ✅ Estado cambiará a "ON-CHAIN"
- ✅ Podrás ver el link a Basescan

---

## 🔍 Si el Retry Mint Falla

Revisa los logs de Vercel para ver el error exacto:
1. Ve a Vercel → Deployments → Último deployment
2. Click en **Functions** → `/api/retry-mint`
3. Busca el error en los logs
4. Comparte el error y lo solucionamos

---

## ✅ Resumen

1. **El mint se completa** con el botón "🔄 Retry Mint" en Inventory
2. **`/start` es legacy** - ahora redirige automáticamente si ingresas un tag_code
3. **Attach y Mint son separados** - RL-001 está attached pero necesita mint
4. **Una vez que el mint se complete**, el estado cambiará a ON-CHAIN automáticamente

**Prueba el botón "Retry Mint" en Inventory y me cuentas qué pasa.** ✅

