# TAMACORE Agent — Comptroller Lookup Runbook (Human-Like Browser Flow)

This runbook is the **canonical process** for getting **Comptroller-verified owner/director addresses**. The agent replicates human activity in the browser: navigate, type, click, capture. Use it to run lookups yourself and to scale (repeat for each entity).

---

## Prerequisites

- **Browser MCP** (cursor-ide-browser): `browser_navigate`, `browser_lock`, `browser_fill`, `browser_click`, `browser_snapshot`, `browser_wait_for`, `browser_scroll`, `browser_unlock`.
- **Texas Comptroller search:** https://comptroller.texas.gov/taxes/franchise/account-status/search/
- **Entity list:** From `docs/TAMACORE_VERIFIED_OUTREACH_TARGETS.md` or pipeline API `GET /api/tamacore/pipeline?include_search_sequence=1`.

---

## Step-by-step (one entity)

### 1. Open Comptroller search

- **Navigate:** `https://comptroller.texas.gov/taxes/franchise/account-status/search/`
- **Lock** the browser tab (optional but recommended so the page doesn’t change under you).

### 2. Search by entity name

- **Entity Name** field: ref is typically `e9` (confirm with `browser_snapshot`).
- **Fill** the exact legal name (e.g. `Smith Genetics LLC`). If no result, try **name variants** from `lib/tamacore/entity-name-variants.ts` (e.g. `Braham Country Genetics LLC` for “Brahman Country Beef LLC”).
- **Click** the **Submit** button (ref usually `e11`).
- **Wait** for “Loading results, please wait...” to disappear: `browser_wait_for` with `textGone: "Loading results, please wait..."`.

### 3. Get the result

- **Snapshot:** You should see a link like `SMITH GENETICS LLC` (ref e81 or similar). The result table may also show a **taxpayer number** (11-digit).
- **Option A — Click result link:** Click the entity name link to open the detail page. (If click is intercepted by an overlay, scroll the link into view with `browser_scroll` then click, or press Escape and retry.)
- **Option B — Direct URL:** If you have the **taxpayer number** from a previous run or from the table, navigate to `https://comptroller.texas.gov/taxes/franchise/account-status/search/{TAXPAYER_NUMBER}` (e.g. `32085431230` for Smith Genetics LLC).

### 4. Detail page — capture owner/director address

- **Detail page** shows:
  - Entity name (e.g. “SMITH GENETICS LLC”).
  - **Public Information Report (PIR)** section and “Public Information Report for Year 2025.”
  - A **table or block** with officer/director names and addresses (mailing address, registered agent, etc.). This may be below the fold; **scroll down** with `browser_scroll` (e.g. `direction: "down"`, `amount: 400`).
- **Capture:** The PIR table is not always fully exposed in the accessibility snapshot. To capture it:
  - **Screenshot:** Use `browser_take_screenshot` with `fullPage: true` or scroll to the PIR table and screenshot, then transcribe or OCR the address.
  - **Snapshot:** Run `browser_snapshot` after scrolling; if the table has proper roles/labels, copy the text nodes for “Owner” / “Director” / “Mailing address” / “Registered agent.”
- **Record** in your pipeline/table:
  - `entity_name` (exact as on Comptroller)
  - `taxpayer_number` (11-digit)
  - `mailing_address`, `registered_agent_name`, `pir_name_and_address` (owner/director name and address from PIR).

### 5. Next entity

- **New Search:** Click “New Search” link (ref e8) or navigate again to the search URL.
- **Reset:** Optionally click “Reset Form” (ref e12) then fill the next entity name.
- Repeat from step 2 for the next entity. Use **search_name_sequence** (name variants) if the exact name returns no result.

### 6. Unlock

- When done, call **browser_unlock** so the user can use the tab again.

---

## Name variants (when exact name fails)

Use `searchNameSequence(legalName)` from `apps/web/lib/tamacore/entity-name-variants.ts` (or the same logic):

- Try exact name first.
- Then typo variants (e.g. Brahman → Braham, McClaren → McLaren).
- Then word swaps (e.g. Country Beef → Country Genetics, 4C Ranch → 4C's Ranch).
- Then entity type (LLC → Inc, etc.).

Try each in Comptroller search until one returns a result; use that official legal name and taxpayer number for the detail page and for your table.

---

## Batch scaling

- **Same steps, repeated:** For each entity in the pipeline, run steps 1–4; append the captured row to a Comptroller-verified table (CSV or pipeline DB).
- **Save taxpayer numbers:** Once you have a taxpayer number for an entity, you can open the detail page directly next time via `.../search/{TAXPAYER_NUMBER}`.
- **API (if available):** If you obtain a Texas Comptroller API key, use their Public API for “Search FTAS records” and “Get franchise account details” to avoid browser steps and scale to hundreds/thousands of entities.

---

## Logging (TAMACORE activity)

After each successful capture, post to the TAMACORE activity API so the dashboard shows progress:

```bash
curl -s -X POST "$BASE_URL/api/tamacore/activity" \
  -H "Content-Type: application/json" \
  -d '{"action_type":"comptroller_capture","step":"detail","payload":{"entity_name":"SMITH GENETICS LLC","taxpayer_number":"32085431230","mailing_address":"P.O. BOX 330, GIDDINGS, TX 78942"}}'
```

Use `pipeline_contact_id` when you have it so activity is tied to the pipeline row.

---

## Reference (verified once this runbook is used)

- **Smith Genetics LLC** — Taxpayer #32085431230. Detail URL: `https://comptroller.texas.gov/taxes/franchise/account-status/search/32085431230`. Owner/director address from PIR: Timothy J. Smith, P.O. BOX 330, GIDDINGS, TX 78942 (already in TAMACORE docs).

*End of runbook.*
