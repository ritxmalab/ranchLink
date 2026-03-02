# RanchLink — Deployment & Path Verification

Use this to confirm the app is freshly deployed and to trace every path and action across the platform.

---

## 1. Confirm Fresh Deployment

| Check | How |
|-------|-----|
| **Latest code** | `git log -1 --oneline` should show the latest fix (e.g. `de06406` or newer). |
| **Vercel** | Push to `main` triggers a production deploy. Check [Vercel Dashboard](https://vercel.com) → ranchlink project → Deployments. Latest deployment should be from the same commit. |
| **Build ID in UI** | Open https://ranch-link.vercel.app/superadmin (after login). Footer/header shows **build: XXXXXX**. Compare to `git rev-parse --short HEAD` (e.g. `de06406`). If they match, the live app is from that commit. |
| **Cache** | Hard refresh (Cmd+Shift+R / Ctrl+Shift+R) or open in incognito so you don’t see old JS. |

**After pushing the Assemble fix:** A new commit will trigger a new Vercel deploy. Wait for it to finish, then confirm the build ID in the superadmin UI matches the new commit (e.g. `git rev-parse --short HEAD`). That guarantees the Assemble tab gets `batch_name`/`color`/`material` from the API and "Print Batch 'X'" works for new batches.

---

## 2. Base URL & Key Routes

| Purpose | URL |
|---------|-----|
| **App base** | `https://ranch-link.vercel.app` |
| **Home** | `/` |
| **Claim tag (entry)** | `/start` |
| **Full-screen scanner** | `/scan` |
| **Tag claim flow** | `/t/[tag_code]` (e.g. `/t/RL-030`) |
| **Animal card** | `/a/[public_id]` (e.g. `/a/AUS0007`) |
| **Dashboard** | `/dashboard` |
| **Superadmin** | `/superadmin` (Factory, Assemble, Dashboard, Inventory tabs) |
| **Marketplace** | `/marketplace` |

All links and redirects use `NEXT_PUBLIC_APP_URL` (or fallback `https://ranch-link.vercel.app`). QR codes point to `{appUrl}/t/{tag_code}`.

---

## 3. Paths & Actions by User Level

### Superadmin

| Action | Page / API | Path / Method |
|--------|------------|----------------|
| Log in | Superadmin login form | `POST /api/superadmin/login` (sets cookie `rl_superadmin`) |
| Open Factory | Superadmin → Factory tab | `GET /superadmin` (client); batch list from Factory UI state |
| Create batch (9 tags) | Factory form → "Generate & Mint Tags" | `POST /api/factory/batches` (body: batchName, batchSize, model, material, color, …) |
| Open Assemble | Superadmin → Assemble tab | `GET /api/superadmin/assemble` → list of tags with `batch_name`, `base_qr_url`, … |
| Print one QR | Assemble → "Print QR" on a tag | Client opens print window; URL used = `tag.base_qr_url` (e.g. `https://ranch-link.vercel.app/t/RL-030`) |
| Print batch QR | Assemble → "Print Batch 'Demo_Tags_030226' (9 tags)" | Same; one print window with 9 stickers, each with `base_qr_url` for that tag |
| Mark assembled | Assemble → "Assemble" on a tag | `POST /api/superadmin/assemble` body: `{ tag_id: "<tag.uuid>", action: "assemble" }` |
| Confirm print (post-assemble) | Assemble → "Print Label" then confirm dialog | Client-only (print window + confirm); no API |
| Push to Inventory | Assemble → "Push to Inventory" | `POST /api/superadmin/assemble` body: `{ tag_id: "<tag.uuid>", action: "push_to_inventory" }` |
| View Inventory | Superadmin → Inventory tab | `GET /api/superadmin/devices` (returns tags with batch_name, status, etc.) |
| Change status (demo/for_sale/…) | Inventory → status dropdown | `POST /api/superadmin/assemble` (or equivalent) with action `mark_demo` / `mark_for_sale` / … |
| Retry mint | Inventory → "Retry Mint" | `POST /api/retry-mint` (superadmin-only) |

### Farmer (claim & attach)

| Action | Page / API | Path / Method |
|--------|------------|----------------|
| Open claim entry | "Claim Tag" in nav or direct | `GET /start` |
| Enter code or scan QR | /start | Client: parse code → `router.push('/t/' + tagCode)` (e.g. `/t/RL-030`) |
| Open tag claim page | From QR or manual entry | `GET /t/RL-030` → `GET /api/tags/RL-030` (loads tag; 404 if not found) |
| Submit animal form | /t/[tag_code] → "Attach Animal" | `POST /api/attach-tag` body: `{ tagCode: "RL-030", animalData: { name, species, … } }` |
| After attach | Redirect | Response sets cookie `rl_owner_{public_id}` and redirect to `/a/{public_id}` |
| View/update animal | Animal card | `GET /a/AUS0007`; updates: `POST /api/update-animal` (owner/superadmin only) |

### Public

| Action | Page / API | Path / Method |
|--------|------------|----------------|
| View animal card | Direct link or from dashboard | `GET /a/[public_id]` (read-only unless owner or superadmin) |

---

## 4. 9-Tag Flow (Exact Paths)

Use this to verify the full flow for your 9 new tags.

1. **Create batch**
   - Go to https://ranch-link.vercel.app/superadmin → Factory.
   - Batch Name: e.g. `Demo_Tags_030226`, Batch Size: `9`, Color: e.g. Bambu Yellow, Material: PETG, etc.
   - Click **Generate & Mint Tags**.
   - **Expected:** Success message; new batch and 9 tags (e.g. RL-030…RL-038) in DB; no red ERROR (batch insert uses only existing columns).

2. **Assemble tab**
   - Open **Assemble** tab.
   - **Expected:** `GET /api/superadmin/assemble` returns tags with `batch_name` (e.g. `Demo_Tags_030226`), `base_qr_url`, `color`, `material`. Button **Print Batch 'Demo_Tags_030226' (9 tags)** visible.

3. **Print**
   - Click **Print Batch 'Demo_Tags_030226' (9 tags)** (or Print QR per tag).
   - **Expected:** New window with 9 stickers; each sticker’s QR points to `https://ranch-link.vercel.app/t/RL-030` … `/t/RL-038`. After printing, confirm "Did the QR label print successfully?" so Assemble state updates.

4. **Assemble & push**
   - For each tag (or in bulk if UI allows): **Assemble** → then **Print Label** (confirm) → **Push to Inventory**.
   - **Expected:** `POST /api/superadmin/assemble` with `action: "assemble"` then `action: "push_to_inventory"`; tags move to `in_inventory`.

5. **Claim**
   - On phone or second browser: open https://ranch-link.vercel.app/start, scan one printed QR (or type e.g. `RL-030`).
   - **Expected:** Navigate to `https://ranch-link.vercel.app/t/RL-030`; tag loads; form shown.

6. **Attach**
   - Fill name, species, optional fields, photo if needed. Submit **Attach Animal**.
   - **Expected:** `POST /api/attach-tag` returns 200; redirect to `/a/AUS0007` (or next AUS id); no ERR_MM6VS10Z; animal card loads; cookie `rl_owner_AUS0007` set.

7. **Animal card**
   - Open `/a/AUS0007` (or link from success).
   - **Expected:** Card loads; owner can update (cookie present); superadmin can open with `?superadmin=1` and edit.

---

## 5. API Summary (Server-Side)

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/api/superadmin/login` | POST | — | Set superadmin cookie |
| `/api/factory/batches` | POST | Superadmin | Create batch + tags (Merkle anchor); no optional batch columns |
| `/api/superadmin/assemble` | GET | Superadmin | List tags for Assemble (with batch_name, base_qr_url) |
| `/api/superadmin/assemble` | POST | Superadmin | assemble | push_to_inventory | mark_demo | … |
| `/api/superadmin/devices` | GET | Superadmin | Inventory list |
| `/api/tags/[tag_code]` | GET | — | Load tag for /t/[tag_code] |
| `/api/attach-tag` | POST | — | Create animal, link tag, lazy mint, set owner cookie |
| `/api/update-animal` | POST | Owner or superadmin | Update animal fields |
| `/api/upload-photo` | POST | — | Upload photo for attach/update |
| `/api/retry-mint` | POST | Superadmin | Retry mint for failed tag |

---

## 6. What Was Fixed (This Pass)

- **Factory:** Batch insert no longer sends `filament_brand`, `itw_grams`, `batch_weight_grams` (columns don’t exist). New batches create successfully.
- **Assemble:** GET now returns `batch_name`, `material`, `color` per tag (via `batches` join, with fallback if join not available). Assemble tab shows correct "Print Batch 'X'" and sticker data.
- **Claim/Attach:** Still as in Session 3: `claim_token` migration applied; attach-tag fallback for missing column removed from critical path once migration is done.

After deploy, run through **Section 4** once with the 9-tag batch to confirm everything works end-to-end before redoing the 18.
