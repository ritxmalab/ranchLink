const TIER_TAG_COUNT: Record<string, number> = {
  single: 1,
  five_pack: 5,
  stack: 10,
  label_100: 100,
  tpp_1: 1,
  tpp_5: 5,
  tpp_15: 15,
  orange_3: 3,
  yellow_abs_3: 3,
  fluoro_3: 3,
}

export function getTierTagCount(tier: string | null | undefined): number {
  if (!tier) return 0
  return TIER_TAG_COUNT[tier] ?? 0
}

export function makeOrderNumber(input: {
  createdAt?: Date
  checkoutSessionId: string
}): string {
  const createdAt = input.createdAt ?? new Date()
  const y = createdAt.getUTCFullYear()
  const m = String(createdAt.getUTCMonth() + 1).padStart(2, '0')
  const d = String(createdAt.getUTCDate()).padStart(2, '0')
  const suffix = input.checkoutSessionId.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase()
  return `RL-${y}${m}${d}-${suffix}`
}
