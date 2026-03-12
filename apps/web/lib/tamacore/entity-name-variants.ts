/**
 * TAMACORE skill: entity name–variant / typo intelligence.
 * When the exact pipeline name returns no result in the state registry,
 * suggest plausible variants to re-query (typos, word swaps, punctuation).
 */

export type NameVariant = { value: string; reason: string }

/**
 * Generate plausible legal-name variants for registry search.
 * Use when exact match fails; try each variant in order.
 */
export function entityNameVariants(pipelineName: string): NameVariant[] {
  const trimmed = pipelineName.trim()
  if (!trimmed) return []
  const out: NameVariant[] = []

  // One-letter / common typos (e.g. Brahman → Braham)
  const typoPairs: [string, string][] = [
    ['Brahman', 'Braham'],
    ['McClaren', 'McLaren'],
    ['McLaren', 'McClaren'],
    ['Volleman\'s', 'Vollemans'],
    ['Vollemans', "Volleman's"],
  ]
  for (const [from, to] of typoPairs) {
    if (trimmed.includes(from)) {
      const v = trimmed.replace(new RegExp(from.replace(/'/g, "\\'"), 'g'), to)
      if (v !== trimmed) out.push({ value: v, reason: `typo variant: ${from} → ${to}` })
    }
  }

  // Composite: Brahman + Country Beef → Braham Country Genetics (real-world correction)
  if (/\bBrahman\b/i.test(trimmed) && /Country Beef/i.test(trimmed)) {
    const v = trimmed.replace(/\bBrahman\b/i, 'Braham').replace(/Country Beef/i, 'Country Genetics')
    if (v !== trimmed) out.push({ value: v, reason: 'composite: Brahman→Braham, Country Beef→Country Genetics' })
  }

  // Word swaps / synonyms (e.g. Beef → Genetics, Ranch → Farm)
  const wordSwaps: [string, string][] = [
    ['Country Beef', 'Country Genetics'],
    ['Country Genetics', 'Country Beef'],
    ['Ranch', 'Farm'],
    ['Farm', 'Ranch'],
    [' and ', ' & '],
    [' & ', ' and '],
    ["4C Ranch", "4C's Ranch"],
    ["4C's Ranch", '4Cs Ranch'],
    ['4Cs Ranch', "4C Ranch"],
  ]
  for (const [from, to] of wordSwaps) {
    if (trimmed.includes(from)) {
      const v = trimmed.replace(from, to)
      out.push({ value: v, reason: `word swap: "${from}" → "${to}"` })
    }
  }

  // LLC ↔ Inc
  if (/\bLLC\b/i.test(trimmed)) {
    out.push({ value: trimmed.replace(/\bLLC\b/i, 'Inc'), reason: 'entity type: LLC → Inc' })
  }
  if (/\bInc\.?\b/i.test(trimmed)) {
    out.push({ value: trimmed.replace(/\bInc\.?\b/i, 'LLC'), reason: 'entity type: Inc → LLC' })
  }

  // JB Ranch: common alternate "JB Ranch I LLC" (SOS style)
  if (/^JB Ranch LLC$/i.test(trimmed)) {
    out.push({ value: 'JB Ranch I LLC', reason: 'SOS-style variant' })
    out.push({ value: 'JB Ranch', reason: 'without LLC' })
  }

  // Dedupe by value
  const seen = new Set<string>([trimmed])
  return out.filter(({ value }) => {
    const n = value.trim()
    if (seen.has(n)) return false
    seen.add(n)
    return true
  })
}

/**
 * Ordered list of search names: exact first, then variants.
 * Use this to drive Comptroller/SOS search loop.
 */
export function searchNameSequence(pipelineName: string): string[] {
  const exact = pipelineName.trim()
  const variants = entityNameVariants(pipelineName)
  return [exact, ...variants.map((v) => v.value)]
}
