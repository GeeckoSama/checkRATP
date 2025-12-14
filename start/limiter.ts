import limiter from '@adonisjs/limiter/services/main'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * Throttle global pour l'endpoint /metro/check
 * Limite: 100 requêtes par jour par IP
 */
export const dailyThrottle = limiter.define('daily', (ctx: HttpContext) => {
  const ip = ctx.request.ip() || 'unknown'
  return limiter.allowRequests(100).every('1 day').usingKey(`daily_${ip}`)
})

/**
 * Throttle pour l'endpoint /metro/lines
 * Limite: 50 requêtes par heure par IP (moins restrictif)
 */
export const hourlyThrottle = limiter.define('hourly', (ctx: HttpContext) => {
  const ip = ctx.request.ip() || 'unknown'
  return limiter.allowRequests(50).every('1 hour').usingKey(`hourly_${ip}`)
})

/**
 * Throttle strict pour prévenir les abus
 * Limite: 10 requêtes par minute par IP
 */
export const strictThrottle = limiter.define('strict', (ctx: HttpContext) => {
  const ip = ctx.request.ip() || 'unknown'
  return limiter.allowRequests(10).every('1 minute').usingKey(`strict_${ip}`)
})
