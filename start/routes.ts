/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { dailyThrottle, hourlyThrottle } from '#start/limiter'

const MetroController = () => import('../app/controllers/metro.controller.js')

router.get('/', async () => {
  return {
    hello: 'world',
  }
})

/**
 * Route pour lister toutes les lignes de métro disponibles
 * Exemple: GET /metro/lines
 * Rate limit: 50 requêtes par heure par IP
 */
router.get('/metro/lines', [MetroController, 'listLines']).use(hourlyThrottle)

/**
 * Route pour vérifier les incidents sur des lignes de métro
 * Query params: lines (string séparée par des virgules)
 * Exemple: GET /metro/check?lines=8,12
 * Rate limit: 100 requêtes par jour par IP
 */
router.get('/metro/check', [MetroController, 'check']).use(dailyThrottle)
