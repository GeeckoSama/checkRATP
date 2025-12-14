import { test } from '@japa/runner'
import { LineMapperService } from '../../app/services/line_mapper.service.js'

test.group('LineMapperService - getLineId', () => {
  test('should return correct ID for metro line 1', ({ assert }) => {
    const service = new LineMapperService()
    const id = service.getLineId('1')
    assert.equal(id, 'C01371')
  })

  test('should return correct ID for metro line 8', ({ assert }) => {
    const service = new LineMapperService()
    const id = service.getLineId('8')
    assert.equal(id, 'C01378')
  })

  test('should return correct ID for metro line 12', ({ assert }) => {
    const service = new LineMapperService()
    const id = service.getLineId('12')
    assert.equal(id, 'C01382')
  })

  test('should return correct ID for metro line 3bis', ({ assert }) => {
    const service = new LineMapperService()
    const id = service.getLineId('3bis')
    assert.equal(id, 'C01386')
  })

  test('should return correct ID for metro line 7bis', ({ assert }) => {
    const service = new LineMapperService()
    const id = service.getLineId('7bis')
    assert.equal(id, 'C01387')
  })

  test('should return correct ID for RER A (lowercase)', ({ assert }) => {
    const service = new LineMapperService()
    const id = service.getLineId('a')
    assert.equal(id, 'C01742')
  })

  test('should return correct ID for RER B (uppercase)', ({ assert }) => {
    const service = new LineMapperService()
    const id = service.getLineId('B')
    assert.equal(id, 'C01743')
  })

  test('should be case insensitive', ({ assert }) => {
    const service = new LineMapperService()
    assert.equal(service.getLineId('A'), service.getLineId('a'))
    assert.equal(service.getLineId('3BIS'), service.getLineId('3bis'))
  })

  test('should return undefined for invalid line name', ({ assert }) => {
    const service = new LineMapperService()
    const id = service.getLineId('99')
    assert.isUndefined(id)
  })

  test('should return undefined for non-existent line', ({ assert }) => {
    const service = new LineMapperService()
    const id = service.getLineId('invalid')
    assert.isUndefined(id)
  })
})

test.group('LineMapperService - convertLines', () => {
  test('should convert valid metro line names to IDs', ({ assert }) => {
    const service = new LineMapperService()
    const result = service.convertLines(['8', '12'])

    assert.deepEqual(result.validIds, ['C01378', 'C01382'])
    assert.deepEqual(result.invalidNames, [])
  })

  test('should convert valid RER line names to IDs', ({ assert }) => {
    const service = new LineMapperService()
    const result = service.convertLines(['a', 'b', 'c'])

    assert.deepEqual(result.validIds, ['C01742', 'C01743', 'C01727'])
    assert.deepEqual(result.invalidNames, [])
  })

  test('should handle mixed metro and RER lines', ({ assert }) => {
    const service = new LineMapperService()
    const result = service.convertLines(['1', 'a', '8', 'b'])

    assert.deepEqual(result.validIds, ['C01371', 'C01742', 'C01378', 'C01743'])
    assert.deepEqual(result.invalidNames, [])
  })

  test('should identify invalid line names', ({ assert }) => {
    const service = new LineMapperService()
    const result = service.convertLines(['8', '99', '12', 'invalid'])

    assert.deepEqual(result.validIds, ['C01378', 'C01382'])
    assert.deepEqual(result.invalidNames, ['99', 'invalid'])
  })

  test('should trim whitespace from line names', ({ assert }) => {
    const service = new LineMapperService()
    const result = service.convertLines([' 8 ', '  12  ', ' a '])

    assert.deepEqual(result.validIds, ['C01378', 'C01382', 'C01742'])
    assert.deepEqual(result.invalidNames, [])
  })

  test('should handle empty array', ({ assert }) => {
    const service = new LineMapperService()
    const result = service.convertLines([])

    assert.deepEqual(result.validIds, [])
    assert.deepEqual(result.invalidNames, [])
  })

  test('should handle already-formatted IDFM IDs (lowercase)', ({ assert }) => {
    const service = new LineMapperService()
    const result = service.convertLines(['c01378', 'c01382'])

    assert.deepEqual(result.validIds, ['C01378', 'C01382'])
    assert.deepEqual(result.invalidNames, [])
  })

  test('should handle already-formatted IDFM IDs (uppercase)', ({ assert }) => {
    const service = new LineMapperService()
    const result = service.convertLines(['C01378', 'C01382'])

    assert.deepEqual(result.validIds, ['C01378', 'C01382'])
    assert.deepEqual(result.invalidNames, [])
  })

  test('should handle mixed simple names and IDFM IDs', ({ assert }) => {
    const service = new LineMapperService()
    const result = service.convertLines(['8', 'C01382', '1'])

    assert.deepEqual(result.validIds, ['C01378', 'C01382', 'C01371'])
    assert.deepEqual(result.invalidNames, [])
  })

  test('should reject invalid IDFM ID format', ({ assert }) => {
    const service = new LineMapperService()
    const result = service.convertLines(['C0138', 'C013782', 'X01378'])

    assert.deepEqual(result.validIds, [])
    assert.deepEqual(result.invalidNames, ['C0138', 'C013782', 'X01378'])
  })

  test('should handle duplicate line names', ({ assert }) => {
    const service = new LineMapperService()
    const result = service.convertLines(['8', '8', '12'])

    // Les doublons sont conservés
    assert.deepEqual(result.validIds, ['C01378', 'C01378', 'C01382'])
    assert.deepEqual(result.invalidNames, [])
  })

  test('should handle all metro lines', ({ assert }) => {
    const service = new LineMapperService()
    const result = service.convertLines([
      '1',
      '2',
      '3',
      '3bis',
      '4',
      '5',
      '6',
      '7',
      '7bis',
      '8',
      '9',
      '10',
      '11',
      '12',
      '13',
      '14',
    ])

    assert.lengthOf(result.validIds, 16)
    assert.lengthOf(result.invalidNames, 0)
  })

  test('should handle all RER lines', ({ assert }) => {
    const service = new LineMapperService()
    const result = service.convertLines(['a', 'b', 'c', 'd', 'e'])

    assert.lengthOf(result.validIds, 5)
    assert.lengthOf(result.invalidNames, 0)
    assert.deepEqual(result.validIds, ['C01742', 'C01743', 'C01727', 'C01728', 'C01729'])
  })
})

test.group('LineMapperService - getAvailableLines', () => {
  test('should return all available metro and RER lines', ({ assert }) => {
    const service = new LineMapperService()
    const lines = service.getAvailableLines()

    // 16 lignes de métro + 5 lignes RER
    assert.lengthOf(lines, 21)
  })

  test('should return lines with correct structure', ({ assert }) => {
    const service = new LineMapperService()
    const lines = service.getAvailableLines()

    // Vérifier qu'un line a la bonne structure
    const line1 = lines.find((l) => l.name === '1')
    assert.isDefined(line1)
    assert.equal(line1?.id, 'C01371')
    assert.equal(line1?.type, 'metro')
  })

  test('should return metro lines with type "metro"', ({ assert }) => {
    const service = new LineMapperService()
    const lines = service.getAvailableLines()

    const metroLines = lines.filter((l) => l.type === 'metro')
    assert.lengthOf(metroLines, 16)
  })

  test('should return RER lines with type "rer"', ({ assert }) => {
    const service = new LineMapperService()
    const lines = service.getAvailableLines()

    const rerLines = lines.filter((l) => l.type === 'rer')
    assert.lengthOf(rerLines, 5)
  })

  test('should return RER lines with uppercase names', ({ assert }) => {
    const service = new LineMapperService()
    const lines = service.getAvailableLines()

    const rerLines = lines.filter((l) => l.type === 'rer')
    rerLines.forEach((line) => {
      assert.equal(line.name, line.name.toUpperCase())
    })
  })

  test('should include all expected metro lines', ({ assert }) => {
    const service = new LineMapperService()
    const lines = service.getAvailableLines()

    const metroNames = lines.filter((l) => l.type === 'metro').map((l) => l.name)

    assert.includeMembers(metroNames, [
      '1',
      '2',
      '3',
      '3bis',
      '4',
      '5',
      '6',
      '7',
      '7bis',
      '8',
      '9',
      '10',
      '11',
      '12',
      '13',
      '14',
    ])
  })

  test('should include all expected RER lines', ({ assert }) => {
    const service = new LineMapperService()
    const lines = service.getAvailableLines()

    const rerNames = lines.filter((l) => l.type === 'rer').map((l) => l.name)

    assert.includeMembers(rerNames, ['A', 'B', 'C', 'D', 'E'])
  })

  test('should map line 8 to correct ID', ({ assert }) => {
    const service = new LineMapperService()
    const lines = service.getAvailableLines()

    const line8 = lines.find((l) => l.name === '8')
    assert.equal(line8?.id, 'C01378')
  })

  test('should map line 12 to correct ID', ({ assert }) => {
    const service = new LineMapperService()
    const lines = service.getAvailableLines()

    const line12 = lines.find((l) => l.name === '12')
    assert.equal(line12?.id, 'C01382')
  })

  test('should map RER A to correct ID', ({ assert }) => {
    const service = new LineMapperService()
    const lines = service.getAvailableLines()

    const rerA = lines.find((l) => l.name === 'A')
    assert.equal(rerA?.id, 'C01742')
  })
})
