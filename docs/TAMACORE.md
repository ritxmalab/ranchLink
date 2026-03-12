# TAMACORE Agent — Pipeline & Comptroller Flow

## Setup

1. **Supabase:** Run in SQL Editor (in order):
   - `supabase/migrations/ADD_TAMACORE_PIPELINE.sql`
   - `supabase/migrations/SEED_TAMACORE_PIPELINE.sql`  
   Or seed via API: `POST /api/tamacore/seed` (seeds only if table is empty).

2. **Env:** `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_KEY` in `apps/web/.env.local`.  
   Optional for scripted/agent use: `TAMACORE_INTERNAL_KEY` — when set, requests with header `x-tamacore-key: <value>` or `Authorization: Bearer <value>` are treated as authenticated for TAMACORE APIs (pipeline, comptroller, comptroller/batch).

3. **Dashboard:** Open `/tamacore` (superadmin password) to see pipeline and live agent activity.

## Core process (agent steps)

1. **Entity lookup (multi-state fallback)**  
   - **First:** Search [Texas Comptroller Franchise Tax Account Status](https://comptroller.texas.gov/taxes/franchise/account-status/search) by Entity Name. This is **public-access data**; the agent must **run the lookup** (not treat “not found in a web search” as “no data”).  
   - **How to run the lookup:** Use the **browser like a human**: navigate to the Comptroller search page, fill Entity Name, click Submit, open the result (or detail URL by taxpayer number), scroll to the PIR section, and **capture** the owner/director name and mailing address from the page. See **[TAMACORE_AGENT_RUNBOOK_COMPTROLLER_LOOKUP.md](TAMACORE_AGENT_RUNBOOK_COMPTROLLER_LOOKUP.md)** for the exact step-by-step. Addresses are **Comptroller-verified** only when captured from this flow (or from the Comptroller Public API); web/directory sources are not verified.  
   - **If the LLC does not appear on the Texas Comptroller page:** Search the equivalent official registry in **other states** until the entity is found (e.g. [Texas Secretary of State SOSDirect](https://direct.sos.state.tx.us) for Texas entities that may use a different name; or the Secretary of State / business entity search of another state suggested by the contact’s location or state of formation).  
   - **Capture:** Official legal name, legal address, mailing address, registered agent, and owner/director name and address (from PIR or state equivalent).

2. **Comptroller search (when in Texas)** — Navigate to the Comptroller search URL, fill Entity Name, Submit.
3. **Verify** — Exact name match, zip within 50 mi of ATX (see `lib/tamacore/zip-atx.ts`) when applicable, click correct LLC/entity.
4. **Capture** — Detail page + PIR (or state equivalent): taxpayer number, mailing address, registered agent, PIR name/address; validate owner address.
5. **Enrich** — Web/LinkedIn + Whitepages (API or keyboard/mouse).
6. **Message** — Generate personalized mail card text; send prototype via USPS.

## Skill: Entity name–variant / typo intelligence

When the **exact pipeline name returns no result** in the state registry, treat it as a signal that the **pipeline name may be wrong** (typo, DBA vs legal name, or similar). The agent should:

- **Try plausible name variants** before giving up or switching state:
  - **Typos / one-letter:** e.g. Brahman → Braham, McClaren → McLaren.
  - **Word swaps / synonyms:** e.g. Country Beef → Country Genetics; Ranch → Farm; LLC → Inc.
  - **Punctuation & formatting:** apostrophes (Volleman's vs Vollemans), ampersands (Mill-King Market & Creamery vs Mill-King Market and Creamery), abbreviations (Co. vs Company).
- **Re-query the same registry** with each variant; when one matches, **record the official legal name** and use it for all downstream (mailing, invoice, CRM).
- **Log the correction** (e.g. pipeline had "Brahman Country Beef LLC", official name "Braham Country Genetics LLC") so the pipeline can be updated and future runs use the correct name.

This skill reduces false "not found" outcomes and improves match rate when pipeline data is incomplete or misspelled.

**Implementation:** `apps/web/lib/tamacore/entity-name-variants.ts` — `entityNameVariants(name)` and `searchNameSequence(name)` for Comptroller/SOS search loops.

## Logging activity

The agent logs each step so the dashboard shows actionables live:

```bash
# Example: log from shell
curl -s -X POST http://localhost:3000/api/tamacore/activity \
  -H "Content-Type: application/json" \
  -d '{"action_type":"comptroller_search_started","step":"1","payload":{"entity_name":"Smith Genetics LLC"}}'
```

From code or another agent: `POST /api/tamacore/activity` with body `{ pipeline_contact_id?, action_type, step?, payload? }`.

## Saving Comptroller data

After capturing from the Comptroller detail page:

```bash
curl -s -X POST http://localhost:3000/api/tamacore/comptroller \
  -H "Content-Type: application/json" \
  -d '{
    "pipeline_contact_id": "<uuid>",
    "entity_name": "SMITH GENETICS LLC",
    "taxpayer_number": "32085431230",
    "mailing_address": "PO BOX 330, GIDDINGS, TX 78942-0330",
    "mailing_zip": "78942",
    "registered_agent_name": "TIMOTHY J SMITH",
    "pir_name_and_address": "TIMOTHY J. SMITH, P.O. BOX 330, GIDDINGS, TX 78942",
    "zip_within_50_mi_atx": true,
    "address_validated": true
  }'
```

## 50-mile-ATX check

Use `lib/tamacore/zip-atx.ts`: `isZipWithinMilesOfATX(zip, 50)`. Returns `true`/`false`/`null` (null = zip not in known list).

## Batch plug (all at once)

To **plug Comptroller data for all pipeline contacts in one go**:

1. **Ensure pipeline is seeded** (POST `/api/tamacore/seed` once if table is empty). Seed #2 is corrected to **Braham Country Genetics LLC**.

2. **Get pipeline with search sequences** (so the agent knows which names to try per contact):
   ```bash
   GET /api/tamacore/pipeline?include_search_sequence=1
   ```
   Optionally use `x-tamacore-key: <TAMACORE_INTERNAL_KEY>` or superadmin cookie. Response includes for each contact: `id`, `legal_name`, `contact`, `location`, … and `search_name_sequence`: `["Exact Name LLC", "Variant One LLC", …]`.

3. **For each contact:** For each name in `search_name_sequence`, run the Comptroller (or state) lookup (browser or automated). On first match: capture entity_name, mailing_address, mailing_zip, registered_agent_name, pir_name_and_address, zip_within_50_mi_atx, address_validated, etc. If no match after all variants, try Texas SOS or other state; if still none, skip or leave fields null.

4. **POST all snapshots in one request:**
   ```bash
   POST /api/tamacore/comptroller/batch
   Content-Type: application/json
   x-tamacore-key: <TAMACORE_INTERNAL_KEY>   # or use superadmin cookie

   { "snapshots": [ { "pipeline_contact_id": "<uuid>", "entity_name": "...", "mailing_address": "...", "mailing_zip": "...", "registered_agent_name": "...", "pir_name_and_address": "...", "zip_within_50_mi_atx": true, "address_validated": true }, ... ] }
   ```
   Each object must include `pipeline_contact_id`; other fields are optional. Response: `{ inserted: N, snapshots: [...] }`.

The agent is ready to run steps 2–4: fetch pipeline with `include_search_sequence=1`, run lookups for all contacts (using name variants when exact name fails), then submit the full list via `POST /api/tamacore/comptroller/batch`.
