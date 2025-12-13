import { HttpContext } from '@adonisjs/core/http'
import env from '#start/env'
import { TransportService } from '../services/transport.service.js'
import { LineMapperService } from '../services/line_mapper.service.js'
import { cacheService } from '../services/cache.service.js'
import type { TransportIncident } from '../types/transport.type.js'

const CACHE_KEY = 'ratp_incidents'
const CACHE_TTL_SECONDS = 5 // Cache pendant 5 secondes

export default class MetroController {
  public async check({ request, response, logger }: HttpContext) {
    const startTime = Date.now()
    const ip = request.ip()

    logger.info('Incident check initiated', {
      ip,
      userAgent: request.header('user-agent'),
      lines: request.input('lines'),
    })

    const transportService = new TransportService()
    const lineMapper = new LineMapperService()

    // Récupérer les lignes depuis les query params (format: ?lines=8,12)
    const linesParam = request.input('lines')

    if (!linesParam) {
      logger.warn('Missing lines parameter', { ip })
      return response.badRequest({
        error: 'Le paramètre "lines" est requis',
        example: 'lines=8,12',
      })
    }

    // Convertir la chaîne en tableau
    const lineNames = Array.isArray(linesParam)
      ? linesParam
      : linesParam.split(',').map((line: string) => line.trim())

    // Convertir les noms de lignes en IDs IDFM
    const { validIds, invalidNames } = lineMapper.convertLines(lineNames)

    if (invalidNames.length > 0) {
      logger.warn('Invalid lines detected', { invalidLines: invalidNames, ip })
      return response.badRequest({
        error: 'Lignes invalides détectées',
        invalidLines: invalidNames,
        availableLines: lineMapper.getAvailableLines().map((l) => l.name),
      })
    }

    logger.debug('Lines validated', { lineNames, validIds })

    // Vérifier que l'URL et la clé API sont configurées
    const apiUrl = env.get('RATP_API_URL')
    const apiKey = env.get('RATP_API_KEY')

    if (!apiUrl || !apiKey) {
      logger.error('Missing API configuration')
      return response.internalServerError({
        error: 'Configuration API manquante',
        message: 'RATP_API_URL et RATP_API_KEY doivent être configurés dans .env',
      })
    }

    // Vérifier le cache en premier
    let incidents = cacheService.get<TransportIncident[]>(CACHE_KEY)

    if (!incidents) {
      logger.debug('Fetching data from RATP API', { url: apiUrl })

      try {
        // Appel à l'API RATP/IDFM
        const apiResponse = await fetch(apiUrl, {
          headers: {
            apikey: apiKey,
          },
        })

        if (!apiResponse.ok) {
          logger.error('API call failed', {
            status: apiResponse.status,
            statusText: apiResponse.statusText,
          })
          return response.status(apiResponse.status).json({
            error: "Erreur lors de l'appel à l'API RATP",
            status: apiResponse.status,
            statusText: apiResponse.statusText,
          })
        }

        const apiData = await apiResponse.json()

        // L'API RATP peut retourner soit un tableau, soit un objet avec une propriété contenant le tableau
        // On vérifie et on extrait le tableau d'incidents
        if (Array.isArray(apiData)) {
          incidents = apiData
        } else if (apiData && typeof apiData === 'object') {
          // Chercher un tableau dans les propriétés de l'objet
          const dataObj = apiData as Record<string, any>
          incidents =
            dataObj.disruptions || dataObj.incidents || dataObj.data || dataObj.results || []
        }

        if (!Array.isArray(incidents)) {
          logger.error('Invalid API response format', { receivedType: typeof apiData })
          return response.internalServerError({
            error: 'Format de réponse API invalide',
            message: "La réponse de l'API ne contient pas de tableau d'incidents",
            receivedType: typeof apiData,
          })
        }

        logger.info('Data fetched from API', { incidentCount: incidents.length })

        // Mettre en cache pour 5 secondes
        cacheService.set(CACHE_KEY, incidents, CACHE_TTL_SECONDS)
      } catch (error) {
        logger.error('Error fetching data from API', {
          error: error.message,
          stack: error.stack,
        })
        return response.internalServerError({
          error: "Erreur lors de l'appel à l'API RATP",
          message: error.message,
        })
      }
    }

    const problems = transportService.getActiveIncidents(incidents, validIds)

    const duration = Date.now() - startTime

    if (problems.length > 0) {
      logger.warn('Active incidents found', {
        count: problems.length,
        lines: lineNames,
        duration: `${duration}ms`,
        ip,
      })

      // Construire un message avec tous les incidents
      const messages = problems.map((p) => {
        return `${p.title}: ${p.message}`
      })
      return response.send(messages.join('\n\n'))
    }

    logger.info('No incidents found - traffic is normal', {
      lines: lineNames,
      duration: `${duration}ms`,
      ip,
    })

    return response.send('Trafic fluide sur toutes les lignes demandées')
  }

  public async listLines({ response, logger }: HttpContext) {
    logger.debug('Listing available metro lines')

    const lineMapper = new LineMapperService()
    const lines = lineMapper.getAvailableLines()

    logger.info('Available lines retrieved', { total: lines.length })

    return response.json({
      lines,
      total: lines.length,
    })
  }
}
