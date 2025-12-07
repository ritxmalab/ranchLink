# 🔮 Roadmap: Burner Wallets para Rancheros

## Nota para Futuro Desarrollo

**Fecha:** 2024-12-06  
**Estado:** Documentado, no implementado

---

## Concepto

En el futuro, los rancheros deberían poder usar **burner wallets** como opción de autocustodia para sus tags y animales. Esto permitiría:

- **Autocustodia:** Los rancheros controlan sus propias wallets
- **Sin gas fees iniciales:** Burner wallets pueden ser creadas sin fondos
- **Transferencia fácil:** Los rancheros pueden transferir tags entre wallets
- **Privacidad:** Cada ranchero puede tener múltiples wallets

---

## Consideraciones Técnicas Futuras

### 1. Integración con Smart Contracts

- El contrato `RanchLinkTag` ya soporta transferencias (soulbound se desbloquea en primera transferencia)
- Los rancheros podrían recibir tags minted directamente a sus burner wallets
- O transferir tags desde la wallet del servidor a sus burner wallets

### 2. UI/UX

- Opción en dashboard: "Conectar Wallet" o "Crear Burner Wallet"
- Usar librerías como:
  - `viem` para crear wallets en el cliente
  - `@coinbase/onchainkit` para integración con Coinbase Wallet
  - `wagmi` para gestión de wallets

### 3. Flujo Propuesto

1. Ranchero crea/importa burner wallet en la UI
2. Ranchero conecta wallet al dashboard
3. Tags pueden ser:
   - Minted directamente a la burner wallet del ranchero
   - Transferidos desde server wallet a burner wallet
4. Ranchero puede ver todos sus tags en dashboard
5. Ranchero puede transferir tags a otras wallets si lo desea

### 4. Seguridad

- Burner wallets son temporales por diseño
- Rancheros deben exportar/backup de sus private keys
- Considerar integración con hardware wallets (Ledger, Trezor) para rancheros avanzados

---

## No Implementar Ahora

**v1.0 se enfoca en:**
- Server wallet para minting centralizado
- Tags minted a server wallet, luego transferibles
- Dashboard muestra tags sin requerir wallet del usuario

**Burner wallets serán v1.5+ o v2.0 feature**

---

## Referencias Técnicas

- [Burner Wallets](https://docs.burnerwallets.com/)
- [Viem Wallet Creation](https://viem.sh/docs/accounts/local.html)
- [Wagmi Wallet Management](https://wagmi.sh/)

---

**Nota:** Esta es documentación para futuro desarrollo, no requiere acción inmediata.

