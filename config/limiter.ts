import { defineConfig, stores } from '@adonisjs/limiter'

/**
 * Configuration du rate limiter
 * Utilise le stockage en mémoire pour la simplicité
 * En production, vous pouvez utiliser Redis pour un meilleur scaling
 */
const limiterConfig = defineConfig({
  /**
   * Le store par défaut à utiliser pour le rate limiting
   */
  default: 'memory',

  /**
   * Les différents stores disponibles pour le rate limiting
   */
  stores: {
    /**
     * Stockage en mémoire (pour développement et petite production)
     */
    memory: stores.memory({}),

    /**
     * Stockage Redis (décommenter pour l'utiliser en production)
     * Nécessite @adonisjs/redis installé et configuré
     */
    // redis: stores.redis({}),
  },
})

export default limiterConfig

/**
 * Inférence des types pour les stores configurés
 */
declare module '@adonisjs/limiter/types' {
  export interface LimitersList extends InferLimiters<typeof limiterConfig> {}
}
