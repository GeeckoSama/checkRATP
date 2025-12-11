import type { TransportIncident } from '../types/transport.type.js'

export class TransportService {
  /**
   * Filtre les incidents actifs pour des lignes spécifiques
   * @param incidents La liste brute reçue de l'API
   * @param targetLineIds Tableau des IDs IDFM des lignes (ex: ['C01378', 'C01382'])
   */
  public getActiveIncidents(incidents: TransportIncident[], targetLineIds: string[]) {
    // 1. Obtenir la date actuelle formatée YYYYMMDDTHHmmss pour comparaison
    const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0]

    return incidents.filter((incident) => {
      // Vérification 1 : L'incident est-il actif en ce moment ?
      const isActive = incident.applicationPeriods.some(
        (period) => now >= period.begin && now <= period.end
      )

      if (!isActive) return false

      // Vérification 2 : L'incident concerne-t-il une de mes lignes ?
      // On regarde dans impactedSections
      const affectsMyLine = incident.impactedSections?.some((section) =>
        targetLineIds.some((targetId) => section.lineId.includes(targetId))
      )

      return affectsMyLine
    })
  }
}
