import { NextRequest } from 'next/server'

const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

/**
 * Rate limiting utility to prevent DoS attacks
 * 
 * @param request - Next.js request object
 * @param maxRequests - Maximum requests allowed in the time window (default: 10)
 * @param windowMs - Time window in milliseconds (default: 60000 = 1 minute)
 * @returns true if request is allowed, false if rate limit exceeded
 */
export function rateLimit(
  request: NextRequest,
  maxRequests: number = 10,
  windowMs: number = 60000 // 1 minuto
): boolean {
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
  const now = Date.now()
  
  const record = rateLimitMap.get(ip)
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs })
    return true
  }
  
  if (record.count >= maxRequests) {
    return false
  }
  
  record.count++
  return true
}

/**
 * Clear old entries from rate limit map (cleanup)
 * Call this periodically to prevent memory leaks
 */
export function cleanupRateLimitMap() {
  const now = Date.now()
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(ip)
    }
  }
}


