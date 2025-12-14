import { test } from '@japa/runner'
import { TransportService } from '../../app/services/transport.service.js'
import type { TransportIncident } from '../../app/types/transport.type.js'

test.group('TransportService - getActiveIncidents', () => {
  test('should filter incidents that are currently active', ({ assert }) => {
    const service = new TransportService()

    // Créer un timestamp actuel en format YYYYMMDDTHHmmss (Europe/Paris)
    const now = new Date()
      .toLocaleString('sv-SE', { timeZone: 'Europe/Paris' })
      .replace(/[-:\s]/g, '')
      .replace('T', '')
      .substring(0, 15)

    // Créer des timestamps pour un incident actif (maintenant ± 1 heure)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
      .toLocaleString('sv-SE', { timeZone: 'Europe/Paris' })
      .replace(/[-:\s]/g, '')
      .replace('T', '')
      .substring(0, 15)

    const oneHourLater = new Date(Date.now() + 60 * 60 * 1000)
      .toLocaleString('sv-SE', { timeZone: 'Europe/Paris' })
      .replace(/[-:\s]/g, '')
      .replace('T', '')
      .substring(0, 15)

    const incidents: TransportIncident[] = [
      {
        id: 'incident-1',
        title: 'Incident ligne 8',
        cause: 'TRAVAUX',
        severity: 'BLOQUANTE',
        message: 'Test incident',
        lastUpdate: now,
        applicationPeriods: [
          {
            begin: oneHourAgo,
            end: oneHourLater,
          },
        ],
        impactedSections: [
          {
            lineId: 'line:IDFM:C01378', // Ligne 8
          },
        ],
      },
    ]

    const result = service.getActiveIncidents(incidents, ['C01378'])

    assert.lengthOf(result, 1)
    assert.equal(result[0].id, 'incident-1')
  })

  test('should filter out incidents that are not active (future)', ({ assert }) => {
    const service = new TransportService()

    // Créer un incident futur (commence dans 2 heures)
    const twoHoursLater = new Date(Date.now() + 2 * 60 * 60 * 1000)
      .toLocaleString('sv-SE', { timeZone: 'Europe/Paris' })
      .replace(/[-:\s]/g, '')
      .replace('T', '')
      .substring(0, 15)

    const threeHoursLater = new Date(Date.now() + 3 * 60 * 60 * 1000)
      .toLocaleString('sv-SE', { timeZone: 'Europe/Paris' })
      .replace(/[-:\s]/g, '')
      .replace('T', '')
      .substring(0, 15)

    const incidents: TransportIncident[] = [
      {
        id: 'future-incident',
        title: 'Future incident',
        cause: 'TRAVAUX',
        severity: 'INFORMATION',
        message: 'Future work',
        lastUpdate: twoHoursLater,
        applicationPeriods: [
          {
            begin: twoHoursLater,
            end: threeHoursLater,
          },
        ],
        impactedSections: [
          {
            lineId: 'line:IDFM:C01378',
          },
        ],
      },
    ]

    const result = service.getActiveIncidents(incidents, ['C01378'])

    assert.lengthOf(result, 0)
  })

  test('should filter out incidents that are not active (past)', ({ assert }) => {
    const service = new TransportService()

    // Créer un incident passé (terminé il y a 1 heure)
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000)
      .toLocaleString('sv-SE', { timeZone: 'Europe/Paris' })
      .replace(/[-:\s]/g, '')
      .replace('T', '')
      .substring(0, 15)

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
      .toLocaleString('sv-SE', { timeZone: 'Europe/Paris' })
      .replace(/[-:\s]/g, '')
      .replace('T', '')
      .substring(0, 15)

    const incidents: TransportIncident[] = [
      {
        id: 'past-incident',
        title: 'Past incident',
        cause: 'PERTURBATION',
        severity: 'PERTURBEE',
        message: 'Past problem',
        lastUpdate: threeHoursAgo,
        applicationPeriods: [
          {
            begin: threeHoursAgo,
            end: oneHourAgo,
          },
        ],
        impactedSections: [
          {
            lineId: 'line:IDFM:C01378',
          },
        ],
      },
    ]

    const result = service.getActiveIncidents(incidents, ['C01378'])

    assert.lengthOf(result, 0)
  })

  test('should filter incidents by target line IDs', ({ assert }) => {
    const service = new TransportService()

    const now = new Date()
      .toLocaleString('sv-SE', { timeZone: 'Europe/Paris' })
      .replace(/[-:\s]/g, '')
      .replace('T', '')
      .substring(0, 15)

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
      .toLocaleString('sv-SE', { timeZone: 'Europe/Paris' })
      .replace(/[-:\s]/g, '')
      .replace('T', '')
      .substring(0, 15)

    const oneHourLater = new Date(Date.now() + 60 * 60 * 1000)
      .toLocaleString('sv-SE', { timeZone: 'Europe/Paris' })
      .replace(/[-:\s]/g, '')
      .replace('T', '')
      .substring(0, 15)

    const incidents: TransportIncident[] = [
      {
        id: 'incident-ligne-8',
        title: 'Incident ligne 8',
        cause: 'TRAVAUX',
        severity: 'BLOQUANTE',
        message: 'Ligne 8',
        lastUpdate: now,
        applicationPeriods: [{ begin: oneHourAgo, end: oneHourLater }],
        impactedSections: [{ lineId: 'line:IDFM:C01378' }],
      },
      {
        id: 'incident-ligne-12',
        title: 'Incident ligne 12',
        cause: 'PERTURBATION',
        severity: 'PERTURBEE',
        message: 'Ligne 12',
        lastUpdate: now,
        applicationPeriods: [{ begin: oneHourAgo, end: oneHourLater }],
        impactedSections: [{ lineId: 'line:IDFM:C01382' }],
      },
    ]

    // Filtrer uniquement la ligne 8
    const result = service.getActiveIncidents(incidents, ['C01378'])

    assert.lengthOf(result, 1)
    assert.equal(result[0].id, 'incident-ligne-8')
  })

  test('should filter incidents by multiple target line IDs', ({ assert }) => {
    const service = new TransportService()

    const now = new Date()
      .toLocaleString('sv-SE', { timeZone: 'Europe/Paris' })
      .replace(/[-:\s]/g, '')
      .replace('T', '')
      .substring(0, 15)

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
      .toLocaleString('sv-SE', { timeZone: 'Europe/Paris' })
      .replace(/[-:\s]/g, '')
      .replace('T', '')
      .substring(0, 15)

    const oneHourLater = new Date(Date.now() + 60 * 60 * 1000)
      .toLocaleString('sv-SE', { timeZone: 'Europe/Paris' })
      .replace(/[-:\s]/g, '')
      .replace('T', '')
      .substring(0, 15)

    const incidents: TransportIncident[] = [
      {
        id: 'incident-ligne-8',
        title: 'Incident ligne 8',
        cause: 'TRAVAUX',
        severity: 'BLOQUANTE',
        message: 'Ligne 8',
        lastUpdate: now,
        applicationPeriods: [{ begin: oneHourAgo, end: oneHourLater }],
        impactedSections: [{ lineId: 'line:IDFM:C01378' }],
      },
      {
        id: 'incident-ligne-12',
        title: 'Incident ligne 12',
        cause: 'PERTURBATION',
        severity: 'PERTURBEE',
        message: 'Ligne 12',
        lastUpdate: now,
        applicationPeriods: [{ begin: oneHourAgo, end: oneHourLater }],
        impactedSections: [{ lineId: 'line:IDFM:C01382' }],
      },
      {
        id: 'incident-ligne-1',
        title: 'Incident ligne 1',
        cause: 'PERTURBATION',
        severity: 'INFORMATION',
        message: 'Ligne 1',
        lastUpdate: now,
        applicationPeriods: [{ begin: oneHourAgo, end: oneHourLater }],
        impactedSections: [{ lineId: 'line:IDFM:C01371' }],
      },
    ]

    // Filtrer lignes 8 et 12
    const result = service.getActiveIncidents(incidents, ['C01378', 'C01382'])

    assert.lengthOf(result, 2)
    assert.includeMembers(
      result.map((i) => i.id),
      ['incident-ligne-8', 'incident-ligne-12']
    )
  })

  test('should filter out incidents without impactedSections', ({ assert }) => {
    const service = new TransportService()

    const now = new Date()
      .toLocaleString('sv-SE', { timeZone: 'Europe/Paris' })
      .replace(/[-:\s]/g, '')
      .replace('T', '')
      .substring(0, 15)

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
      .toLocaleString('sv-SE', { timeZone: 'Europe/Paris' })
      .replace(/[-:\s]/g, '')
      .replace('T', '')
      .substring(0, 15)

    const oneHourLater = new Date(Date.now() + 60 * 60 * 1000)
      .toLocaleString('sv-SE', { timeZone: 'Europe/Paris' })
      .replace(/[-:\s]/g, '')
      .replace('T', '')
      .substring(0, 15)

    const incidents: TransportIncident[] = [
      {
        id: 'incident-sans-sections',
        title: 'Incident général',
        cause: 'INFORMATION',
        severity: 'INFORMATION',
        message: 'Info générale',
        lastUpdate: now,
        applicationPeriods: [{ begin: oneHourAgo, end: oneHourLater }],
        // Pas de impactedSections
      },
    ]

    const result = service.getActiveIncidents(incidents, ['C01378'])

    assert.lengthOf(result, 0)
  })

  test('should filter out incidents with empty impactedSections array', ({ assert }) => {
    const service = new TransportService()

    const now = new Date()
      .toLocaleString('sv-SE', { timeZone: 'Europe/Paris' })
      .replace(/[-:\s]/g, '')
      .replace('T', '')
      .substring(0, 15)

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
      .toLocaleString('sv-SE', { timeZone: 'Europe/Paris' })
      .replace(/[-:\s]/g, '')
      .replace('T', '')
      .substring(0, 15)

    const oneHourLater = new Date(Date.now() + 60 * 60 * 1000)
      .toLocaleString('sv-SE', { timeZone: 'Europe/Paris' })
      .replace(/[-:\s]/g, '')
      .replace('T', '')
      .substring(0, 15)

    const incidents: TransportIncident[] = [
      {
        id: 'incident-sections-vides',
        title: 'Incident avec array vide',
        cause: 'INFORMATION',
        severity: 'INFORMATION',
        message: 'Info',
        lastUpdate: now,
        applicationPeriods: [{ begin: oneHourAgo, end: oneHourLater }],
        impactedSections: [], // Array vide
      },
    ]

    const result = service.getActiveIncidents(incidents, ['C01378'])

    assert.lengthOf(result, 0)
  })

  test('should handle incidents with multiple application periods', ({ assert }) => {
    const service = new TransportService()

    const now = new Date()
      .toLocaleString('sv-SE', { timeZone: 'Europe/Paris' })
      .replace(/[-:\s]/g, '')
      .replace('T', '')
      .substring(0, 15)

    // Période passée
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000)
      .toLocaleString('sv-SE', { timeZone: 'Europe/Paris' })
      .replace(/[-:\s]/g, '')
      .replace('T', '')
      .substring(0, 15)

    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
      .toLocaleString('sv-SE', { timeZone: 'Europe/Paris' })
      .replace(/[-:\s]/g, '')
      .replace('T', '')
      .substring(0, 15)

    // Période actuelle
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
      .toLocaleString('sv-SE', { timeZone: 'Europe/Paris' })
      .replace(/[-:\s]/g, '')
      .replace('T', '')
      .substring(0, 15)

    const oneHourLater = new Date(Date.now() + 60 * 60 * 1000)
      .toLocaleString('sv-SE', { timeZone: 'Europe/Paris' })
      .replace(/[-:\s]/g, '')
      .replace('T', '')
      .substring(0, 15)

    const incidents: TransportIncident[] = [
      {
        id: 'incident-multi-periodes',
        title: 'Incident avec plusieurs périodes',
        cause: 'TRAVAUX',
        severity: 'PERTURBEE',
        message: 'Travaux récurrents',
        lastUpdate: now,
        applicationPeriods: [
          { begin: threeHoursAgo, end: twoHoursAgo }, // Passé
          { begin: oneHourAgo, end: oneHourLater }, // Actif
        ],
        impactedSections: [{ lineId: 'line:IDFM:C01378' }],
      },
    ]

    const result = service.getActiveIncidents(incidents, ['C01378'])

    assert.lengthOf(result, 1)
    assert.equal(result[0].id, 'incident-multi-periodes')
  })

  test('should return empty array when no incidents match', ({ assert }) => {
    const service = new TransportService()

    const result = service.getActiveIncidents([], ['C01378'])

    assert.lengthOf(result, 0)
    assert.isArray(result)
  })

  test('should handle incidents with lineId containing the target ID', ({ assert }) => {
    const service = new TransportService()

    const now = new Date()
      .toLocaleString('sv-SE', { timeZone: 'Europe/Paris' })
      .replace(/[-:\s]/g, '')
      .replace('T', '')
      .substring(0, 15)

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
      .toLocaleString('sv-SE', { timeZone: 'Europe/Paris' })
      .replace(/[-:\s]/g, '')
      .replace('T', '')
      .substring(0, 15)

    const oneHourLater = new Date(Date.now() + 60 * 60 * 1000)
      .toLocaleString('sv-SE', { timeZone: 'Europe/Paris' })
      .replace(/[-:\s]/g, '')
      .replace('T', '')
      .substring(0, 15)

    const incidents: TransportIncident[] = [
      {
        id: 'incident-1',
        title: 'Incident',
        cause: 'TRAVAUX',
        severity: 'BLOQUANTE',
        message: 'Test',
        lastUpdate: now,
        applicationPeriods: [{ begin: oneHourAgo, end: oneHourLater }],
        impactedSections: [
          {
            lineId: 'line:IDFM:C01378', // Format complet de l'API
          },
        ],
      },
    ]

    // Le service doit matcher même si on cherche juste l'ID court
    const result = service.getActiveIncidents(incidents, ['C01378'])

    assert.lengthOf(result, 1)
  })
})
