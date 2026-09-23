# RanchLink — Launch Readiness & Security Audit

Scope: `apps/web` (Next.js 14 App Router), Supabase Postgres/Storage, Base mainnet
(8453) contracts, Stripe checkout, Pinata/IPFS. Reviewed: authentication and
sessions, API authorization, data exposure, input validation and rate limiting,
uploads, RLS and service-role usage, blockchain/server-wallet paths, Stripe
webhooks, response headers, secret handling, and the ownership model.

No secret values are reproduced in this document.

---

## 1. Summary

The pipeline (factory mint → assemble/ship → QR scan → attach identity → IPFS +
`setCID` → public card → ongoing events) works end to end. The gaps were
concentrated in **authorization** and **ownership**, not in the minting flow:
privileged routes that accepted anonymous callers, ownership checks that failed
*open* when metadata was missing, public endpoints returning internal columns
including bearer credentials, permissive RLS on public tables, and an account
model where a signed-in farmer was never actually linked to the tag they
attached.

This change set closes the authorization gaps, binds tags and animals to the
authenticated ranch account, locks down direct database access, and adds a
superadmin backup/export tool.

---

## 2. Findings and remediation

### High

| # | Finding | Remediation |
|---|---|---|
| H1 | `POST /api/superadmin/devices` performed privileged writes with no auth check — any anonymous caller could create devices. | `verifySuperadminAuth` added before any work. |
| H2 | `update-animal` fell back to *allowing* the update when a tag had no `claim_token` and no owner — missing ownership metadata meant open access. | Rewritten to fail closed: superadmin, or matching ranch session (`owner_user_id` / `ranch_id`), or timing-safe claim-token match; otherwise `403`. |
| H3 | `GET /api/orders/session/[session_id]` returned `order_view_secret`. A checkout session id is not a secret, so it was sufficient to obtain the private order-tracking credential. | Field removed from the response; the success page links by order number. |
| H4 | The admin session cookie was signed with `SUPERADMIN_PASSWORD` when `SUPERADMIN_SESSION_SECRET` was unset — knowing the password (which was committed to repo markdown) allowed forging sessions offline. | Production requires an explicit `SUPERADMIN_SESSION_SECRET`; the password fallback is dev-only. Same fix applied to finalize-claim link signing. |
| H5 | Private keys, Supabase service JWTs and the admin password were committed in tracked markdown files. | Values redacted in the repo. **These must be treated as compromised and rotated** — see §5. |
| H6 | Public tables (`animals`, `tags`, `ranches`, `batches`, `animal_events`, `kits`, `kit_tags`, `devices`) had `USING (true)` RLS policies plus anon grants, so the anon key could read operational data directly from PostgREST. | Migration `008_LOCKDOWN_PUBLIC_RLS.sql` drops those policies and revokes anon/authenticated grants. All app reads go through the service role server-side, so behavior is unchanged. |
| H7 | Session tokens were stored in plaintext in `ranch_sessions`: a database read yielded usable cookies. | Tokens are stored as SHA-256 digests (`009_SESSION_HASHING_AND_CONSTRAINTS.sql`). Existing rows are purged; users sign in again. |
| H8 | No account ↔ asset link: attaching while signed in did not set `owner_user_id`, so ownership rested entirely on an anonymous claim token. | Attach resolves the ranch session and writes `owner_user_id` and `ranch_id` on the tag and `ranch_id` on the animal. |

### Medium

| # | Finding | Remediation |
|---|---|---|
| M1 | OTP codes were generated with `Math.random()` — predictable. | `crypto.randomInt`. |
| M2 | OTP consumption was an unconditional update, allowing a race to reuse one code. | Conditional update on `used_at IS NULL`, verified by returned rows. |
| M3 | Credential comparison used `===` (timing oracle). | `timingSafeEqualString` for admin login and claim tokens. |
| M4 | Public tag/animal endpoints used `select('*')`, exposing claim tokens, owner ids and internal ops fields. | Explicit public field allowlists; `*` only for superadmin. |
| M5 | Tag attach and claim finalization were read-then-write, so concurrent requests could both "win" a tag. | Compare-and-set updates gated on status / current owner, returning `409` when no row is claimed; unique indexes added. |
| M6 | `POST /api/upload-photo` linked an uploaded photo to any animal by `public_id` with no authorization. | Linking requires superadmin, a matching ranch session, or a matching claim token; otherwise the upload returns `linked: false`. |
| M7 | Legacy `/api/claim` performed privileged writes with no validation or throttling. | Retired: returns `410` unless `ENABLE_LEGACY_CLAIM_API=true`; Zod validation and rate limiting added. |
| M8 | Rate limiting keyed on IP only, so one endpoint's traffic consumed another's budget. | Keyed on IP + pathname. Still in-process — see §4. |
| M9 | Custodial wallet keys were encrypted under `SUPERADMIN_SESSION_SECRET` when `WALLET_ENCRYPTION_KEY` was unset: one leak compromised both admin sessions and farmer keys. | Production requires `WALLET_ENCRYPTION_KEY`; decryption falls back to the legacy secret for already-stored wallets so custody is not lost. |
| M10 | No CSP or HSTS. | Added in `next.config.js`, alongside the existing frame/nosniff/referrer headers. |
| M11 | `/api/dashboard/*` ignored the ranch session, so a signed-in farmer saw a public/demo view instead of their herd. | Scoped to `ranch_id` for ranch sessions; admin and public scopes unchanged. |

### Low / accepted for launch

- `claim-kit` performs several privileged writes non-transactionally; a failure
  mid-sequence leaves partial state. Should move to a Postgres function.
- Upload validation checks MIME type and size but not file signatures.
- Public animal events expose the full event row; consider an allowlist.
- CSP still needs `'unsafe-inline'`/`'unsafe-eval'` for the current bundle;
  tighten with nonces before hardening further.

---

## 3. Backup / save tool

`GET /api/superadmin/export` (superadmin only) streams a JSON snapshot of
`ranches`, `batches`, `tags`, `animals`, `animal_events` and a reduced view of
`stripe_orders`, paginated at 1000 rows, with `Content-Disposition: attachment`
and `Cache-Control: no-store`. A **Backup data** button is in the superadmin
header.

Deliberately excluded: `claim_token`, encrypted wallet keys, ranch sessions,
verification codes, `order_view_secret`. The export is a recovery/migration
snapshot, **not** a point-in-time transactional backup — Supabase PITR remains
the primary backup. There is no import endpoint yet; a restore path needs
idempotency and conflict rules before it can be trusted.

---

## 4. Before going live

1. **Rotate every credential that appeared in the repository** (§5) — redaction
   is not rotation.
2. Set `SUPERADMIN_SESSION_SECRET` (≥32 chars) and `WALLET_ENCRYPTION_KEY` in
   Vercel production; without them admin sessions and wallet encryption fail
   closed by design.
3. Apply migrations `008` and `009` to the Supabase project, then verify the
   public site still renders (all app reads use the service role).
4. Replace the in-process rate limiter with a shared store (Upstash/Redis or
   Vercel KV); serverless instances do not share counters.
5. Confirm the Stripe webhook secret is the production one and that the endpoint
   is subscribed to `checkout.session.completed` and the async payment events.
6. Keep the server wallet funded and alert on low balance — attach and every
   update call `setCID`, so an empty wallet silently degrades traceability.

## 5. Credential rotation list

Rotate through your secret manager and update Vercel; do not commit new values:
Supabase service key and anon key, `SERVER_WALLET_PRIVATE_KEY` /
`RANCHLINK_PRIVATE_KEY`, `PINATA_JWT`, Stripe secret and webhook secret,
`RESEND_API_KEY`, `SUPERADMIN_PASSWORD`, `SUPERADMIN_SESSION_SECRET`.

Because the server wallet key was exposed, move funds and `MINTER_ROLE` to a
fresh EOA rather than only rotating the environment variable.

## 6. Not addressed (product roadmap, not security)

Custodial → self-custody NFT transfer, delegation to staff, account recovery
beyond email OTP, animal sale/transfer between ranches, and on-chain/IPFS
reconciliation monitoring.
