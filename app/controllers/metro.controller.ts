import { HttpContext } from '@adonisjs/core/http'
import env from '#start/env'
import { TransportService } from '../services/transport.service.js'
import { LineMapperService } from '../services/line_mapper.service.js'
import { cacheService } from '../services/cache.service.js'
import type { TransportIncident } from '../types/transport.type.js'

const CACHE_KEY = 'ratp_incidents'
const CACHE_TTL_SECONDS = 30

export default class MetroController {
  public async check({ request, response }: HttpContext) {
    const transportService = new TransportService()
    const lineMapper = new LineMapperService()

    // Récupérer les lignes depuis les query params (format: ?lines=8,12)
    const linesParam = request.input('lines')

    if (!linesParam) {
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
      return response.badRequest({
        error: 'Lignes invalides détectées',
        invalidLines: invalidNames,
        availableLines: lineMapper.getAvailableLines().map((l) => l.name),
      })
    }

    // Vérifier que l'URL et la clé API sont configurées
    const apiUrl = env.get('RATP_API_URL')
    const apiKey = env.get('RATP_API_KEY')

    if (!apiUrl || !apiKey) {
      return response.internalServerError({
        error: 'Configuration API manquante',
        message: 'RATP_API_URL et RATP_API_KEY doivent être configurés dans .env',
      })
    }

    // Vérifier le cache en premier
    let incidents = cacheService.get<TransportIncident[]>(CACHE_KEY)

    if (!incidents) {
      // Appel à l'API RATP/IDFM
      const apiResponse = await fetch(apiUrl, {
        headers: {
          apikey: apiKey,
        },
      })

      if (!apiResponse.ok) {
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
        return response.internalServerError({
          error: 'Format de réponse API invalide',
          message: "La réponse de l'API ne contient pas de tableau d'incidents",
          receivedType: typeof apiData,
        })
      }

      // Mettre en cache pour 30 secondes
      cacheService.set(CACHE_KEY, incidents, CACHE_TTL_SECONDS)
    }

    const problems = transportService.getActiveIncidents(incidents, validIds)

    if (problems.length > 0) {
      return response.json({
        alert: true,
        requestedLines: lineNames,
        lineIds: validIds,
        count: problems.length,
        details: problems.map((p) => ({
          id: p.id,
          title: p.title,
          severity: p.severity,
          cause: p.cause,
          message: p.message,
          impactedSections: p.impactedSections,
        })),
      })
    }

    return response.json({
      alert: false,
      requestedLines: lineNames,
      lineIds: validIds,
      message: 'Trafic fluide sur toutes les lignes demandées',
    })
  }

  public async listLines({ response }: HttpContext) {
    const lineMapper = new LineMapperService()
    const lines = lineMapper.getAvailableLines()

    return response.json({
      lines,
      total: lines.length,
    })
  }
}
