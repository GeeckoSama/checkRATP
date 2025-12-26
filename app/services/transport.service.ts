import logger from '@adonisjs/core/services/logger'
import type { TransportIncident } from '../types/transport.type.js'

export class TransportService {
  /**
   * Filtre les incidents actifs pour des lignes spécifiques
   * @param incidents La liste brute reçue de l'API
   * @param targetLineIds Tableau des IDs IDFM des lignes (ex: ['C01378', 'C01382'])
   */
  public getActiveIncidents(incidents: TransportIncident[], targetLineIds: string[]) {
    // 1. Obtenir la date actuelle formatée YYYYMMDDTHHmmss en timezone Europe/Paris
    // IMPORTANT: L'API RATP utilise l'heure locale de Paris, pas UTC
    // Le format doit inclure un 'T' entre la date et l'heure pour correspondre au format de l'API
    const now = new Date()
      .toLocaleString('sv-SE', { timeZone: 'Europe/Paris' })
      .replace(/[-:]/g, '')
      .replace(' ', 'T') // YYYYMMDDTHHmmss

    const nowReadable = new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })

    logger.debug('Filtering incidents', {
      totalIncidents: incidents.length,
      targetLineIds,
      now,
      nowReadable,
      timezone: 'Europe/Paris',
    })

    const filteredIncidents = incidents.filter((incident) => {
      // Vérification 1 : L'incident est-il actif en ce moment ?
      const isActive = incident.applicationPeriods.some(
        (period) => now >= period.begin && now <= period.end
      )

      if (!isActive) {
        logger.debug('Incident not active', {
          incidentId: incident.id,
          title: incident.title,
          now,
          applicationPeriods: incident.applicationPeriods,
        })
        return false
      }

      // Vérification 2 : L'incident concerne-t-il une de mes lignes ?
      // On regarde dans impactedSections

      // Cas 1: impactedSections est absent ou vide
      if (!incident.impactedSections || incident.impactedSections.length === 0) {
        logger.warn('Incident has no impactedSections', {
          incidentId: incident.id,
          title: incident.title,
          severity: incident.severity,
        })
        return false
      }

      // Cas 2: vérifier si une des sections correspond à nos lignes
      const affectsMyLine = incident.impactedSections.some((section) =>
        targetLineIds.some((targetId) => section.lineId.includes(targetId))
      )

      if (!affectsMyLine) {
        logger.debug('Incident does not affect target lines', {
          incidentId: incident.id,
          title: incident.title,
          impactedLineIds: incident.impactedSections.map((s) => s.lineId),
          targetLineIds,
        })
      } else {
        logger.info('Active incident found affecting target lines', {
          incidentId: incident.id,
          title: incident.title,
          severity: incident.severity,
          impactedLineIds: incident.impactedSections.map((s) => s.lineId),
          targetLineIds,
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
