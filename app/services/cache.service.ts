import logger from '@adonisjs/core/services/logger'

/**
 * Service de cache simple en mémoire avec expiration
 */
export class CacheService {
  private cache: Map<string, { data: any; expiresAt: number }> = new Map()

  /**
   * Récupère une valeur du cache si elle existe et n'a pas expiré
   */
  public get<T>(key: string): T | null {
    const entry = this.cache.get(key)

    if (!entry) {
      logger.debug('Cache miss', { key })
      return null
    }

    // Vérifier si le cache a expiré
    if (Date.now() > entry.expiresAt) {
      logger.debug('Cache expired', { key })
      this.cache.delete(key)
      return null
    }

    logger.debug('Cache hit', { key })
    return entry.data as T
  }

  /**
   * Stocke une valeur dans le cache avec une durée de vie en secondes
   */
  public set(key: string, data: any, ttlSeconds: number): void {
    const expiresAt = Date.now() + ttlSeconds * 1000
    this.cache.set(key, { data, expiresAt })
    logger.debug('Cache set', { key, ttlSeconds })
  }

  /**
   * Supprime une entrée du cache
   */
  public delete(key: string): void {
    this.cache.delete(key)
    logger.debug('Cache delete', { key })
  }

  /**
   * Vide tout le cache
   */
  public clear(): void {
    const size = this.cache.size
    this.cache.clear()
    logger.info('Cache cleared', { entriesCleared: size })
  }

  /**
   * Nettoie les entrées expirées du cache
   */
  public cleanup(): void {
    const now = Date.now()
    let cleaned = 0
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
        cleaned++
      }
    }
    if (cleaned > 0) {
      logger.debug('Cache cleanup completed', { entriesCleaned: cleaned })
    }
  }
}

// Instance singleton du cache
export const cacheService = new CacheService()

// Nettoyage automatique toutes les minutes
setInterval(() => {
  cacheService.cleanup()
}, 60000)
