/**
 * Service pour mapper les noms de lignes simples aux IDs IDFM
 */
export class LineMapperService {
  /**
   * Mapping des noms de lignes de métro vers leurs IDs IDFM officiels
   * Format IDFM: C01XXX
   */
  private static readonly METRO_LINES: Record<string, string> = {
    '1': 'C01371',
    '2': 'C01372',
    '3': 'C01373',
    '3bis': 'C01386',
    '4': 'C01374',
    '5': 'C01375',
    '6': 'C01376',
    '7': 'C01377',
    '7bis': 'C01387',
    '8': 'C01378',
    '9': 'C01379',
    '10': 'C01380',
    '11': 'C01381',
    '12': 'C01382',
    '13': 'C01383',
    '14': 'C01384',
  }

  /**
   * Convertit un nom de ligne simple en ID IDFM
   * @param lineName Nom simple de la ligne (ex: "8", "12", "3bis")
   * @returns L'ID IDFM correspondant ou undefined si non trouvé
   */
  public getLineId(lineName: string): string | undefined {
    return LineMapperService.METRO_LINES[lineName.toLowerCase()]
  }

  /**
   * Convertit une liste de noms de lignes en IDs IDFM
   * @param lineNames Tableau de noms de lignes simples
   * @returns Objet avec les IDs trouvés et les noms invalides
   */
  public convertLines(lineNames: string[]): {
    validIds: string[]
    invalidNames: string[]
  } {
    const validIds: string[] = []
    const invalidNames: string[] = []

    for (const name of lineNames) {
      const normalized = name.trim().toLowerCase()
      const id = this.getLineId(normalized)

      if (id) {
        validIds.push(id)
      } else {
        // Si ce n'est pas un nom simple, vérifier si c'est déjà un ID IDFM valide
        if (normalized.startsWith('c01') && normalized.length === 6) {
          validIds.push(name.trim().toUpperCase())
        } else {
          invalidNames.push(name.trim())
        }
      }
    }

    return { validIds, invalidNames }
  }

  /**
   * Retourne la liste de toutes les lignes disponibles
   */
  public getAvailableLines(): Array<{ name: string; id: string }> {
    return Object.entries(LineMapperService.METRO_LINES).map(([name, id]) => ({
      name,
      id,
    }))
  }
}
