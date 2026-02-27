# 🚨 URGENTE: DRENAJE AUTOMÁTICO DE FONDOS

## ⚠️ PROBLEMA IDENTIFICADO

**Tu server wallet está siendo drenada automáticamente:**
- ✅ Recibe fondos en: `0x6801078adCbEF93B9b7a5cbFb3BAb87Fdb9F8d83`
- ❌ Los fondos se transfieren inmediatamente a: `0xDDb46b0a251667781eDFEA26d6Fb110964104a62`
- 🚨 **Esto es un DRENAJE AUTOMÁTICO**

---

## 🔍 ANÁLISIS TÉCNICO

### Posibles Causas:

#### 1. **Delegación EIP-7702 Maliciosa** (MÁS PROBABLE)
- La delegación a `0x0138833a645BE9311a21c19035F18634DFeEf776` podría tener código que drena fondos
- EIP-7702 permite que una dirección delegada ejecute código en nombre de tu wallet
- Si la delegación es maliciosa, puede transferir fondos automáticamente

#### 2. **Contrato Inteligente Malicioso**
- La wallet podría ser un "smart wallet" (contrato) en lugar de una EOA (Externally Owned Account)
- Si es un contrato, podría tener lógica que drena fondos
- Coinbase CDP crea "smart wallets" que pueden tener este comportamiento

#### 3. **Aprobaciones (Approvals) Excesivas**
- Podría haber approvals a tokens que permiten drenar fondos
- Necesito verificar approvals en la wallet

#### 4. **CDP_WALLET_SECRET Comprometido**
- Si `CDP_WALLET_SECRET` está comprometido, Coinbase CDP podría controlar la wallet
- Esto explicaría el drenaje automático

---

## 🚨 ACCIÓN INMEDIATA

### PASO 1: REVOCAR DELEGACIÓN (URGENTE)

**La delegación EIP-7702 es la causa más probable:**

1. Ve a: **https://revoke.cash**
2. Conecta tu wallet: `0x6801078adCbEF93B9b7a5cbFb3BAb87Fdb9F8d83`
3. Selecciona red: **Base Mainnet**
4. Busca: **"EIP-7702 Delegations"** o **"Authorizations"**
5. **REVOCA INMEDIATAMENTE** la delegación a: `0x0138833a645BE9311a21c19035F18634DFeEf776`
6. Confirma la transacción
7. ⚠️ **Esto puede costar gas, pero es CRÍTICO**

### PASO 2: REVOCAR TODAS LAS APROBACIONES

1. En **revoke.cash**, busca la pestaña **"Token Approvals"**
2. **REVOCA TODAS** las aprobaciones
3. Esto previene que tokens sean drenados

### PASO 3: NO ENVIAR MÁS FONDOS

**⚠️ NO ENVÍES MÁS FONDOS A ESTA WALLET HASTA QUE SE RESUELVA**

---

## 🔍 VERIFICACIÓN TÉCNICA

### Verificar si es Smart Wallet:

**En Basescan:**
1. Ve a: https://basescan.org/address/0x6801078adCbEF93B9b7a5cbFb3BAb87Fdb9F8d83
2. Click en la pestaña **"Contract"**
3. Si muestra código = Es un contrato (smart wallet)
4. Si dice "This address is not a contract" = Es EOA normal

### Verificar Delegación:

**En Basescan:**
1. Ve a: https://basescan.org/address/0x6801078adCbEF93B9b7a5cbFb3BAb87Fdb9F8d83
2. Click en **"Authorizations (EIP-7702)"**
3. Verifica si hay delegaciones activas
4. **REVOCA TODAS**

### Verificar Aprobaciones:

**En revoke.cash:**
1. Conecta la wallet
2. Busca **"Token Approvals"**
3. **REVOCA TODAS**

---

## 🔧 SOLUCIÓN PERMANENTE

### Opción 1: Crear Nueva Wallet (RECOMENDADO)

**Si la wallet está comprometida, crea una nueva:**

1. **Genera nueva wallet:**
   ```bash
   # En Node.js/Hardhat
   npx hardhat run scripts/generate-wallet.js
   ```

2. **Actualiza `.env.local`:**
   ```bash
   SERVER_WALLET_ADDRESS=0x... (nueva dirección)
   SERVER_WALLET_PRIVATE_KEY=0x... (nueva private key)
   ```

3. **Actualiza Vercel:**
   - Ve a Vercel → Settings → Environment Variables
   - Actualiza `SERVER_WALLET_ADDRESS` y `SERVER_WALLET_PRIVATE_KEY`

4. **Otorga MINTER_ROLE a la nueva wallet:**
   ```bash
   npx hardhat run packages/contracts/scripts/grant-minter.ts
   ```

5. **Fondea la nueva wallet:**
   - Envía ETH a la nueva dirección
   - **NO uses la wallet vieja**

### Opción 2: Si es Coinbase CDP

**Si la wallet es de Coinbase CDP:**

1. Ve a: https://portal.cdp.coinbase.com
2. Verifica la configuración de la wallet
3. Revoca cualquier delegación o permiso
4. Considera crear una nueva wallet CDP

---

## 📊 ANÁLISIS DE LA DIRECCIÓN SOSPECHOSA

**Dirección que recibe los fondos:**
```
0xDDb46b0a251667781eDFEA26d6Fb110964104a62
```

**Verificación:**
- Ve a: https://basescan.org/address/0xDDb46b0a251667781eDFEA26d6Fb110964104a62
- Revisa:
  - ¿Es un contrato?
  - ¿Qué transacciones tiene?
  - ¿De dónde viene?

**Esta dirección está drenando tus fondos automáticamente.**

---

## 🚨 CHECKLIST URGENTE

### HACER AHORA:

- [ ] **REVOCAR delegación EIP-7702** en https://revoke.cash
- [ ] **REVOCAR todas las aprobaciones** en https://revoke.cash
- [ ] **NO enviar más fondos** a la wallet comprometida
- [ ] **Verificar si es smart wallet** en Basescan
- [ ] **Crear nueva wallet** si es necesario
- [ ] **Actualizar Vercel** con nueva wallet
- [ ] **Otorgar MINTER_ROLE** a nueva wallet

---

## ⚠️ IMPORTANTE

**La wallet `0x6801078adCbEF93B9b7a5cbFb3BAb87Fdb9F8d83` está COMPROMETIDA.**

**NO uses esta wallet para nada más hasta que:**
1. Revoces la delegación
2. Revoces todas las aprobaciones
3. Verifiques que el drenaje se detuvo
4. O crees una nueva wallet

**El sistema puede seguir funcionando con una nueva wallet, pero esta está comprometida.**

---

## 🔗 LINKS RÁPIDOS

**Revocar Delegación y Aprobaciones:**
- https://revoke.cash

**Verificar Wallet:**
- https://basescan.org/address/0x6801078adCbEF93B9b7a5cbFb3BAb87Fdb9F8d83

**Dirección que Drena Fondos:**
- https://basescan.org/address/0xDDb46b0a251667781eDFEA26d6Fb110964104a62

---

**ACCIÓN INMEDIATA: Ve a revoke.cash y revoca TODO.** 🚨


