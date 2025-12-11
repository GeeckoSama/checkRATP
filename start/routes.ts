/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
const MetroController = () => import('../app/controllers/metro.controller.js')

router.get('/', async () => {
  return {
    hello: 'world',
  }
})

/**
 * Route pour lister toutes les lignes de métro disponibles
 * Exemple: GET /metro/lines
 */
router.get('/metro/lines', [MetroController, 'listLines'])

/**
 * Route pour vérifier les incidents sur des lignes de métro
 * Query params: lines (string séparée par des virgules)
 * Exemple: GET /metro/check?lines=8,12
 */
router.get('/metro/check', [MetroController, 'check'])
