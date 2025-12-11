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
      return null
    }

    // Vérifier si le cache a expiré
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  /**
   * Stocke une valeur dans le cache avec une durée de vie en secondes
   */
  public set(key: string, data: any, ttlSeconds: number): void {
    const expiresAt = Date.now() + ttlSeconds * 1000
    this.cache.set(key, { data, expiresAt })
  }

  /**
   * Supprime une entrée du cache
   */
  public delete(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Vide tout le cache
   */
  public clear(): void {
    this.cache.clear()
  }

  /**
   * Nettoie les entrées expirées du cache
   */
  public cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
      }
    }
  }
}

// Instance singleton du cache
export const cacheService = new CacheService()

// Nettoyage automatique toutes les minutes
setInterval(() => {
  cacheService.cleanup()
}, 60000)
