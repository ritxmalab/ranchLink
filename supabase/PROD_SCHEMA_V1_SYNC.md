# RanchLink v1.0 Production Schema Documentation

**Date:** December 7, 2025  
**Purpose:** Document the exact Supabase schema expected by v1.0 code

---

## Overview

RanchLink v1.0 uses three core tables: `tags`, `batches`, and `animals`, with `ranches` as a supporting table. The schema is designed to support blockchain-linked tags with one-to-one relationships between tags and animals.

---

## Core Tables

### 1. `public.tags` (Canonical v1.0 Table)

**Purpose:** Represents physical tags with blockchain metadata. This is the source of truth for all tag operations in v1.0.

**Columns:**
- `id` (uuid, PK) - Primary key
- `tag_code` (text, UNIQUE, NOT NULL) - Human-readable tag code, e.g. "RL-001"
- `chain` (text, NOT NULL, DEFAULT 'BASE') - Blockchain network (e.g. "BASE")
- `contract_address` (text, nullable) - Smart contract address on the chain
- `token_id` (text, nullable) - On-chain token ID (stored as string)
- `mint_tx_hash` (text, nullable) - Transaction hash of the mint operation
- `batch_id` (uuid, nullable, FK → batches.id) - Batch this tag belongs to
- `ranch_id` (uuid, nullable, FK → ranches.id) - Ranch that owns this tag
- `animal_id` (uuid, nullable, FK → animals.id) - Animal this tag is attached to
- `status` (text, NOT NULL, DEFAULT 'in_inventory') - Tag status: 'in_inventory', 'assigned', 'attached', 'retired'
- `activation_state` (text, NOT NULL, DEFAULT 'active') - Activation state: 'active', 'inactive'
- `created_at` (timestamptz, NOT NULL, DEFAULT now())
- `updated_at` (timestamptz, NOT NULL, DEFAULT now())

**Indexes:**
- `idx_tags_tag_code` - Fast lookup by tag_code (used in `/t/[tag_code]` route)
- `idx_tags_batch_id` - Batch queries
- `idx_tags_animal_id` - Animal-tag joins
- `idx_tags_ranch_id` - Ranch filtering
- `idx_tags_status` - Status filtering

**Key Relationships:**
- `tags.batch_id` → `batches.id` (many-to-one: many tags per batch)
- `tags.ranch_id` → `ranches.id` (many-to-one: many tags per ranch)
- `tags.animal_id` → `animals.id` (many-to-one: many tags can reference one animal, but v1.0 uses one tag per animal)

---

### 2. `public.batches`

**Purpose:** Represents a production batch of tags created in the Factory.

**Columns:**
- `id` (uuid, PK) - Primary key
- `name` (text, nullable) - Batch name (used in some queries)
- `batch_name` (text, nullable) - **CRITICAL:** Batch name (this was missing in PROD, causing errors)
- `model` (text, nullable) - Tag model (e.g. "BASIC_QR", "BOOTS_ON")
- `material` (text, nullable) - Material (e.g. "PETG", "PLA")
- `color` (text, nullable) - Color (e.g. "Mesquite", "Yellow")
- `chain` (text, DEFAULT 'BASE') - Blockchain network
- `count` (integer, nullable) - Number of tags in batch
- `target_ranch_id` (uuid, nullable, FK → ranches.id) - Target ranch for this batch
- `status` (text, DEFAULT 'draft') - Batch status: 'draft', 'printed'
- `created_at` (timestamptz, DEFAULT now())
- `updated_at` (timestamptz, DEFAULT now())

**Indexes:**
- `idx_batches_status` - Status filtering
- `idx_batches_target_ranch_id` - Ranch filtering

**Key Relationships:**
- `batches.target_ranch_id` → `ranches.id` (many-to-one)

---

### 3. `public.animals`

**Purpose:** Represents animals that can be linked to tags.

**Columns:**
- `id` (uuid, PK) - Primary key
- `public_id` (text, UNIQUE, nullable) - Human-readable animal ID, e.g. "AUS0001"
- `name` (text, nullable) - Animal name
- `species` (text, nullable) - Species (e.g. "Cattle", "Sheep")
- `breed` (text, nullable) - Breed (e.g. "Angus", "Hereford")
- `birth_year` (integer, nullable) - Birth year
- `sex` (text, nullable) - Sex (e.g. "Male", "Female")
- `ranch_id` (uuid, nullable, FK → ranches.id) - Ranch that owns this animal
- `status` (text, DEFAULT 'active') - Animal status: 'active', 'inactive'
- `created_at` (timestamptz, DEFAULT now())
- `updated_at` (timestamptz, DEFAULT now())

**Indexes:**
- `idx_animals_public_id` - Unique index for public_id lookups (used in `/a/[public_id]` route)
- `idx_animals_public_id_lookup` - Additional index for fast lookups
- `idx_animals_ranch_id` - Ranch filtering
- `idx_animals_status` - Status filtering

**Key Relationships:**
- `animals.ranch_id` → `ranches.id` (many-to-one)
- **Reverse relationship:** `tags.animal_id` → `animals.id` (enables `animals.tags(*)` queries)

---

### 4. `public.ranches`

**Purpose:** Represents ranches/farms that own tags and animals.

**Columns:**
- `id` (uuid, PK) - Primary key
- `name` (text, NOT NULL) - Ranch name
- `contact_email` (text, nullable) - Contact email
- `phone` (text, nullable) - Phone number
- `created_at` (timestamptz, DEFAULT now())
- `updated_at` (timestamptz, DEFAULT now())

**Key Relationships:**
- Referenced by `tags.ranch_id`
- Referenced by `animals.ranch_id`
- Referenced by `batches.target_ranch_id`

---

## Relationships Summary

### Tags ↔ Animals (One-to-Many, but v1.0 uses One-to-One)

**Direction:** `tags.animal_id` → `animals.id`

**How it works:**
- Each tag can reference one animal via `tags.animal_id`
- PostgREST enables reverse queries:
  - `tags.animals(*)` - Get animal info when querying tags
  - `animals.tags(*)` - Get tag info when querying animals (PostgREST automatically handles reverse lookup)

**v1.0 Usage:**
- Factory creates tags with `animal_id = null`
- `/api/attach-tag` sets `tags.animal_id` when attaching to an animal
- Dashboard queries use `animals.tags(*)` to show tag info for each animal

---

### Tags ↔ Batches (Many-to-One)

**Direction:** `tags.batch_id` → `batches.id`

**How it works:**
- Many tags belong to one batch
- Factory creates a batch, then creates multiple tags with `batch_id` set

---

### Tags ↔ Ranches (Many-to-One)

**Direction:** `tags.ranch_id` → `ranches.id`

**How it works:**
- Tags can be assigned to ranches
- Used for filtering tags by ranch in dashboard

---

### Animals ↔ Ranches (Many-to-One)

**Direction:** `animals.ranch_id` → `ranches.id`

**How it works:**
- Animals belong to ranches
- Used for filtering animals by ranch in dashboard

---

## Optional Tables (for Kit Feature)

### `public.kits`

**Purpose:** Represents retail kits that can be claimed by ranches.

**Columns:**
- `id` (uuid, PK)
- `kit_code` (text, UNIQUE, NOT NULL) - Kit code, e.g. "RLKIT-XXXXX"
- `status` (text, DEFAULT 'unclaimed') - 'unclaimed', 'claimed'
- `claimed_ranch_id` (uuid, nullable, FK → ranches.id)
- `created_at`, `updated_at`

---

### `public.kit_tags`

**Purpose:** Links tags to kits (many-to-many).

**Columns:**
- `id` (uuid, PK)
- `kit_id` (uuid, FK → kits.id)
- `tag_id` (uuid, FK → tags.id)
- `created_at`
- UNIQUE constraint on `(kit_id, tag_id)`

---

## How v1.0 Uses This Schema

### Factory Flow (`POST /api/factory/batches`):

1. Creates `batches` row with `batch_name`, `model`, `material`, `color`, `chain`, `count`
2. For each tag:
   - Creates `tags` row with `tag_code`, `batch_id`, `chain`, `contract_address`
   - Mints NFT on blockchain
   - Updates `tags` with `token_id` and `mint_tx_hash`
3. Updates `batches.status` to 'printed'

### Tag Scan Flow (`GET /api/tags/[tag_code]`):

1. Queries `tags` with `tag_code`
2. Joins `animals(*)` and `ranches(*)` via PostgREST
3. Returns tag info with animal and ranch details

### Attach Tag Flow (`POST /api/attach-tag`):

1. Finds `tags` by `tag_code`
2. Creates or updates `animals` row
3. Updates `tags.animal_id` to link tag to animal
4. Updates `tags.status` to 'attached'

### Dashboard Flow (`GET /api/dashboard/animals`):

1. Queries `animals` with `tags(*)` join
2. PostgREST automatically handles reverse lookup: `tags.animal_id = animals.id`
3. Returns animals with their associated tags

### Dashboard Tags Flow (`GET /api/dashboard/tags`):

1. Queries `tags` with `animals(*)` join
2. PostgREST automatically handles forward lookup: `tags.animal_id = animals.id`
3. Returns tags with their associated animals

---

## Critical Foreign Keys

The following foreign keys are **required** for PostgREST to understand relationships:

1. `tags.animal_id` → `animals.id` - **CRITICAL** for `animals.tags(*)` and `tags.animals(*)` queries
2. `tags.batch_id` → `batches.id` - For batch queries
3. `tags.ranch_id` → `ranches.id` - For ranch filtering
4. `animals.ranch_id` → `ranches.id` - For ranch filtering

Without these foreign keys, PostgREST will throw errors like:
- "Could not find a relationship between 'animals' and 'tags' in the schema cache"

---

## Status Values

### Tag Status:
- `in_inventory` - Tag created but not assigned
- `assigned` - Tag assigned to ranch (via kit claim)
- `attached` - Tag attached to an animal
- `retired` - Tag no longer in use

### Batch Status:
- `draft` - Batch created but not finalized
- `printed` - Batch finalized and tags printed

### Animal Status:
- `active` - Animal is active
- `inactive` - Animal is inactive (sold, deceased, etc.)

---

## Notes

- All timestamps use `timestamptz` (timezone-aware)
- All UUIDs use `gen_random_uuid()` as default
- RLS (Row Level Security) is enabled but policies are not created in this migration (assumes existing policies)
- The migration is idempotent - safe to run multiple times

