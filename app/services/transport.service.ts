import logger from '@adonisjs/core/services/logger'
import type { TransportIncident } from '../types/transport.type.js'

export class TransportService {
  /**
   * Filtre les incidents actifs pour des lignes spécifiques
   * @param incidents La liste brute reçue de l'API
   * @param targetLineIds Tableau des IDs IDFM des lignes (ex: ['C01378', 'C01382'])
   */
  public getActiveIncidents(incidents: TransportIncident[], targetLineIds: string[]) {
    logger.debug('Filtering incidents', {
      totalIncidents: incidents.length,
      targetLineIds,
    })

    // 1. Obtenir la date actuelle formatée YYYYMMDDTHHmmss pour comparaison
    const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0]

    const filteredIncidents = incidents.filter((incident) => {
      // Vérification 1 : L'incident est-il actif en ce moment ?
      const isActive = incident.applicationPeriods.some(
        (period) => now >= period.begin && now <= period.end
      )

      if (!isActive) {
        logger.debug('Incident not active', { incidentId: incident.id })
        return false
      }

      // Vérification 2 : L'incident concerne-t-il une de mes lignes ?
      // On regarde dans impactedSections
      const affectsMyLine = incident.impactedSections?.some((section) =>
        targetLineIds.some((targetId) => section.lineId.includes(targetId))
      )

      if (!affectsMyLine) {
        logger.debug('Incident does not affect target lines', {
          incidentId: incident.id,
        })
      }

      return affectsMyLine
    })

    logger.info('Incidents filtered', {
      original: incidents.length,
      filtered: filteredIncidents.length,
      targetLineIds,
    })

    return filteredIncidents
  }
}
