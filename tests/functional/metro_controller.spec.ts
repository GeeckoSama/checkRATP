import { test } from '@japa/runner'

test.group('MetroController - /metro/check', (group) => {

  test('should return 400 when lines parameter is missing', async ({ client }) => {
    const response = await client.get('/metro/check')

    response.assertStatus(400)
    response.assertBodyContains({
      error: 'Le paramètre "lines" est requis',
    })
  })

  test('should return 400 for invalid line names', async ({ client }) => {
    const response = await client.get('/metro/check?lines=99,invalid')

    response.assertStatus(400)
    response.assertBodyContains({
      error: 'Lignes invalides détectées',
      invalidLines: ['99', 'invalid'],
    })
  })

  test('should accept valid metro line number', async ({ client }) => {
    const response = await client.get('/metro/check?lines=8')

    response.assertStatus(200)
    // La réponse doit être valide (soit trafic fluide, soit incidents)
  })

  test('should accept multiple valid metro lines', async ({ client }) => {
    const response = await client.get('/metro/check?lines=8,12')

    response.assertStatus(200)
  })

  test('should accept metro line with "bis"', async ({ client }) => {
    const response = await client.get('/metro/check?lines=3bis')

    response.assertStatus(200)
  })

  test('should accept RER lines (lowercase)', async ({ client }) => {
    const response = await client.get('/metro/check?lines=a')

    response.assertStatus(200)
  })

  test('should accept RER lines (uppercase)', async ({ client }) => {
    const response = await client.get('/metro/check?lines=A')

    response.assertStatus(200)
  })

  test('should accept mixed metro and RER lines', async ({ client }) => {
    const response = await client.get('/metro/check?lines=8,a,12')

    response.assertStatus(200)
  })

  test('should handle whitespace in line parameter', async ({ client }) => {
    const response = await client.get('/metro/check?lines= 8 , 12 ')

    response.assertStatus(200)
  })

  test('should return 400 when all lines are invalid', async ({ client }) => {
    const response = await client.get('/metro/check?lines=99,100')

    response.assertStatus(400)
    response.assertBodyContains({
      error: 'Lignes invalides détectées',
      invalidLines: ['99', '100'],
    })
  })

  test('should return 400 when some lines are invalid', async ({ client }) => {
    const response = await client.get('/metro/check?lines=8,99,12')

    response.assertStatus(400)
    response.assertBodyContains({
      error: 'Lignes invalides détectées',
      invalidLines: ['99'],
    })
  })

  test('should use cache for repeated requests', async ({ client }) => {
    // Première requête (fait un appel API)
    const response1 = await client.get('/metro/check?lines=8')
    response1.assertStatus(200)

    // Deuxième requête immédiate (devrait utiliser le cache)
    const response2 = await client.get('/metro/check?lines=8')
    response2.assertStatus(200)

    // Les réponses devraient être identiques
    response1.assertBody(response2.body())
  })

  test('should handle IDFM ID format directly', async ({ client }) => {
    const response = await client.get('/metro/check?lines=C01378')

    response.assertStatus(200)
  })

  test('should accept all metro lines', async ({ client }) => {
    const response = await client.get(
      '/metro/check?lines=1,2,3,3bis,4,5,6,7,7bis,8,9,10,11,12,13,14'
    )

    response.assertStatus(200)
  })

  test('should accept all RER lines', async ({ client }) => {
    const response = await client.get('/metro/check?lines=a,b,c,d,e')

    response.assertStatus(200)
  })

  test('should handle single line request', async ({ client }) => {
    const response = await client.get('/metro/check?lines=1')

    response.assertStatus(200)
  })
})

test.group('MetroController - /metro/lines', (group) => {

  test('should return list of available lines', async ({ client }) => {
    const response = await client.get('/metro/lines')

    response.assertStatus(200)
    response.assertBodyContains({
      total: 21, // 16 métro + 5 RER
    })
  })

  test('should return lines with correct structure', async ({ assert, client }) => {
    const response = await client.get('/metro/lines')

    response.assertStatus(200)

    const body = response.body()
    const { lines } = body

    // Vérifier qu'il y a des lignes
    assert.isArray(lines)
    assert.isAtLeast(lines.length, 1)

    // Vérifier la structure d'une ligne
    const line = lines[0]
    assert.property(line, 'name')
    assert.property(line, 'id')
    assert.property(line, 'type')
  })

  test('should include metro lines', async ({ assert, client }) => {
    const response = await client.get('/metro/lines')

    response.assertStatus(200)

    const body = response.body()
    const metroLines = body.lines.filter((l: any) => l.type === 'metro')

    assert.lengthOf(metroLines, 16)
  })

  test('should include RER lines', async ({ assert, client }) => {
    const response = await client.get('/metro/lines')

    response.assertStatus(200)

    const body = response.body()
    const rerLines = body.lines.filter((l: any) => l.type === 'rer')

    assert.lengthOf(rerLines, 5)
  })

  test('should include line 1 with correct ID', async ({ assert, client }) => {
    const response = await client.get('/metro/lines')

    response.assertStatus(200)

    const body = response.body()
    const line1 = body.lines.find((l: any) => l.name === '1')

    assert.isDefined(line1)
    assert.equal(line1.id, 'C01371')
    assert.equal(line1.type, 'metro')
  })

  test('should include line 8 with correct ID', async ({ assert, client }) => {
    const response = await client.get('/metro/lines')

    response.assertStatus(200)

    const body = response.body()
    const line8 = body.lines.find((l: any) => l.name === '8')

    assert.isDefined(line8)
    assert.equal(line8.id, 'C01378')
    assert.equal(line8.type, 'metro')
  })

  test('should include line 12 with correct ID', async ({ assert, client }) => {
    const response = await client.get('/metro/lines')

    response.assertStatus(200)

    const body = response.body()
    const line12 = body.lines.find((l: any) => l.name === '12')

    assert.isDefined(line12)
    assert.equal(line12.id, 'C01382')
    assert.equal(line12.type, 'metro')
  })

  test('should include RER A with correct ID', async ({ assert, client }) => {
    const response = await client.get('/metro/lines')

    response.assertStatus(200)

    const body = response.body()
    const rerA = body.lines.find((l: any) => l.name === 'A')

    assert.isDefined(rerA)
    assert.equal(rerA.id, 'C01742')
    assert.equal(rerA.type, 'rer')
  })

  test('should include special lines (3bis, 7bis)', async ({ assert, client }) => {
    const response = await client.get('/metro/lines')

    response.assertStatus(200)

    const body = response.body()
    const line3bis = body.lines.find((l: any) => l.name === '3bis')
    const line7bis = body.lines.find((l: any) => l.name === '7bis')

    assert.isDefined(line3bis)
    assert.equal(line3bis.id, 'C01386')

    assert.isDefined(line7bis)
    assert.equal(line7bis.id, 'C01387')
  })

  test('should return JSON response', async ({ client }) => {
    const response = await client.get('/metro/lines')

    response.assertStatus(200)
    response.assertHeader('content-type', 'application/json; charset=utf-8')
  })
})

test.group('MetroController - Rate limiting', (group) => {

  test('should allow reasonable number of requests', async ({ client }) => {
    // Faire 5 requêtes rapides
    for (let i = 0; i < 5; i++) {
      const response = await client.get('/metro/check?lines=8')
      response.assertStatus(200)
    }
  })

  test('/metro/lines should have rate limit', async ({ client }) => {
    // Faire quelques requêtes rapides
    for (let i = 0; i < 3; i++) {
      const response = await client.get('/metro/lines')
      response.assertStatus(200)
    }
  })
})

test.group('MetroController - Error handling', (group) => {

  test('should handle empty lines parameter', async ({ client }) => {
    const response = await client.get('/metro/check?lines=')

    // Devrait retourner une erreur car le paramètre est vide
    response.assertStatus(400)
  })

  test('should return JSON error for invalid request', async ({ client }) => {
    const response = await client.get('/metro/check')

    response.assertStatus(400)
    response.assertHeader('content-type', 'application/json; charset=utf-8')
  })

  test('should handle non-existent routes', async ({ client }) => {
    const response = await client.get('/metro/invalid-route')

    response.assertStatus(404)
  })
})
