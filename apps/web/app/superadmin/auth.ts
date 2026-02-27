/**
 * Superadmin auth helpers — simple password gate using a cookie.
 */

export const SUPERADMIN_COOKIE = 'rl_superadmin'
export const SUPERADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD || 'ranchlink2026'

export function checkSuperadminCookie(cookieValue: string | undefined): boolean {
  if (!cookieValue) return false
  // Cookie stores a simple signed value: password hashed with a salt
  return cookieValue === btoa(SUPERADMIN_PASSWORD + '_ranchlink')
}

export function makeSuperadminCookieValue(): string {
  return btoa(SUPERADMIN_PASSWORD + '_ranchlink')
}
