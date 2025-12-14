import { test } from '@japa/runner'
import { CacheService } from '../../app/services/cache.service.js'

test.group('CacheService - set and get', () => {
  test('should store and retrieve a value', ({ assert }) => {
    const cache = new CacheService()
    cache.set('test-key', 'test-value', 60)

    const value = cache.get<string>('test-key')
    assert.equal(value, 'test-value')
  })

  test('should store and retrieve an object', ({ assert }) => {
    const cache = new CacheService()
    const data = { name: 'Test', value: 123 }
    cache.set('object-key', data, 60)

    const retrieved = cache.get<typeof data>('object-key')
    assert.deepEqual(retrieved, data)
  })

  test('should store and retrieve an array', ({ assert }) => {
    const cache = new CacheService()
    const data = [1, 2, 3, 4, 5]
    cache.set('array-key', data, 60)

    const retrieved = cache.get<number[]>('array-key')
    assert.deepEqual(retrieved, data)
  })

  test('should return null for non-existent key', ({ assert }) => {
    const cache = new CacheService()
    const value = cache.get('non-existent')

    assert.isNull(value)
  })

  test('should overwrite existing value', ({ assert }) => {
    const cache = new CacheService()
    cache.set('key', 'first-value', 60)
    cache.set('key', 'second-value', 60)

    const value = cache.get<string>('key')
    assert.equal(value, 'second-value')
  })

  test('should handle null values', ({ assert }) => {
    const cache = new CacheService()
    cache.set('null-key', null, 60)

    const value = cache.get('null-key')
    assert.isNull(value)
  })

  test('should handle undefined values', ({ assert }) => {
    const cache = new CacheService()
    cache.set('undefined-key', undefined, 60)

    const value = cache.get('undefined-key')
    assert.isUndefined(value)
  })

  test('should handle boolean values', ({ assert }) => {
    const cache = new CacheService()
    cache.set('bool-true', true, 60)
    cache.set('bool-false', false, 60)

    assert.isTrue(cache.get<boolean>('bool-true'))
    assert.isFalse(cache.get<boolean>('bool-false'))
  })

  test('should handle number values including zero', ({ assert }) => {
    const cache = new CacheService()
    cache.set('zero', 0, 60)
    cache.set('number', 42, 60)

    assert.equal(cache.get<number>('zero'), 0)
    assert.equal(cache.get<number>('number'), 42)
  })
})

test.group('CacheService - TTL and expiration', () => {
  test('should expire entries after TTL', async ({ assert }) => {
    const cache = new CacheService()
    // TTL de 100ms
    cache.set('expiring-key', 'value', 0.1)

    // Vérifier que la valeur existe immédiatement
    assert.equal(cache.get<string>('expiring-key'), 'value')

    // Attendre 150ms
    await new Promise((resolve) => setTimeout(resolve, 150))

    // La valeur doit avoir expiré
    assert.isNull(cache.get('expiring-key'))
  })

  test('should not expire entries before TTL', async ({ assert }) => {
    const cache = new CacheService()
    // TTL de 1 seconde
    cache.set('persistent-key', 'value', 1)

    // Attendre 500ms (moins que le TTL)
    await new Promise((resolve) => setTimeout(resolve, 500))

    // La valeur doit toujours exister
    assert.equal(cache.get<string>('persistent-key'), 'value')
  })

  test('should handle different TTLs for different keys', async ({ assert }) => {
    const cache = new CacheService()

    cache.set('short-ttl', 'expires-soon', 0.1) // 100ms
    cache.set('long-ttl', 'expires-later', 2) // 2 secondes

    await new Promise((resolve) => setTimeout(resolve, 150))

    // short-ttl doit avoir expiré
    assert.isNull(cache.get('short-ttl'))
    // long-ttl doit toujours exister
    assert.equal(cache.get<string>('long-ttl'), 'expires-later')
  })

  test('should calculate expiration correctly for long TTL', ({ assert }) => {
    const cache = new CacheService()
    cache.set('long-key', 'value', 3600) // 1 heure

    // Doit être disponible immédiatement
    assert.equal(cache.get<string>('long-key'), 'value')
  })
})

test.group('CacheService - delete', () => {
  test('should delete an existing entry', ({ assert }) => {
    const cache = new CacheService()
    cache.set('delete-me', 'value', 60)

    assert.equal(cache.get<string>('delete-me'), 'value')

    cache.delete('delete-me')

    assert.isNull(cache.get('delete-me'))
  })

  test('should not error when deleting non-existent key', ({ assert }) => {
    const cache = new CacheService()

    // Ne devrait pas lancer d'erreur
    assert.doesNotThrow(() => {
      cache.delete('non-existent')
    })
  })

  test('should delete only the specified key', ({ assert }) => {
    const cache = new CacheService()
    cache.set('key1', 'value1', 60)
    cache.set('key2', 'value2', 60)

    cache.delete('key1')

    assert.isNull(cache.get('key1'))
    assert.equal(cache.get<string>('key2'), 'value2')
  })
})

test.group('CacheService - clear', () => {
  test('should clear all entries', ({ assert }) => {
    const cache = new CacheService()
    cache.set('key1', 'value1', 60)
    cache.set('key2', 'value2', 60)
    cache.set('key3', 'value3', 60)

    cache.clear()

    assert.isNull(cache.get('key1'))
    assert.isNull(cache.get('key2'))
    assert.isNull(cache.get('key3'))
  })

  test('should not error when clearing empty cache', ({ assert }) => {
    const cache = new CacheService()

    assert.doesNotThrow(() => {
      cache.clear()
    })
  })

  test('should allow adding entries after clear', ({ assert }) => {
    const cache = new CacheService()
    cache.set('key1', 'value1', 60)
    cache.clear()

    cache.set('key2', 'value2', 60)

    assert.isNull(cache.get('key1'))
    assert.equal(cache.get<string>('key2'), 'value2')
  })
})

test.group('CacheService - cleanup', () => {
  test('should remove expired entries during cleanup', async ({ assert }) => {
    const cache = new CacheService()

    cache.set('expired-1', 'value1', 0.1) // 100ms
    cache.set('expired-2', 'value2', 0.1) // 100ms
    cache.set('active', 'value3', 10) // 10 secondes

    // Attendre que les premiers expirent
    await new Promise((resolve) => setTimeout(resolve, 150))

    cache.cleanup()

    // Les expirés doivent être supprimés
    assert.isNull(cache.get('expired-1'))
    assert.isNull(cache.get('expired-2'))
    // Celui qui n'a pas expiré doit rester
    assert.equal(cache.get<string>('active'), 'value3')
  })

  test('should not remove non-expired entries during cleanup', ({ assert }) => {
    const cache = new CacheService()

    cache.set('key1', 'value1', 60)
    cache.set('key2', 'value2', 60)

    cache.cleanup()

    assert.equal(cache.get<string>('key1'), 'value1')
    assert.equal(cache.get<string>('key2'), 'value2')
  })

  test('should not error when cleaning empty cache', ({ assert }) => {
    const cache = new CacheService()

    assert.doesNotThrow(() => {
      cache.cleanup()
    })
  })

  test('should handle cleanup with all entries expired', async ({ assert }) => {
    const cache = new CacheService()

    cache.set('exp1', 'value1', 0.05) // 50ms
    cache.set('exp2', 'value2', 0.05) // 50ms

    await new Promise((resolve) => setTimeout(resolve, 100))

    cache.cleanup()

    assert.isNull(cache.get('exp1'))
    assert.isNull(cache.get('exp2'))
  })
})

test.group('CacheService - complex scenarios', () => {
  test('should handle rapid consecutive sets', ({ assert }) => {
    const cache = new CacheService()

    for (let i = 0; i < 100; i++) {
      cache.set(`key-${i}`, `value-${i}`, 60)
    }

    for (let i = 0; i < 100; i++) {
      assert.equal(cache.get<string>(`key-${i}`), `value-${i}`)
    }
  })

  test('should handle mixed operations', async ({ assert }) => {
    const cache = new CacheService()

    cache.set('key1', 'value1', 0.1)
    cache.set('key2', 'value2', 10)
    cache.set('key3', 'value3', 10)

    cache.delete('key3')

    await new Promise((resolve) => setTimeout(resolve, 150))

    cache.cleanup()

    assert.isNull(cache.get('key1')) // Expiré
    assert.equal(cache.get<string>('key2'), 'value2') // Toujours actif
    assert.isNull(cache.get('key3')) // Supprimé manuellement
  })

  test('should handle storing complex nested objects', ({ assert }) => {
    const cache = new CacheService()

    const complexData = {
      level1: {
        level2: {
          level3: {
            array: [1, 2, 3],
            string: 'nested value',
            boolean: true,
          },
        },
      },
      topArray: [{ id: 1 }, { id: 2 }],
    }

    cache.set('complex', complexData, 60)

    const retrieved = cache.get<typeof complexData>('complex')
    assert.deepEqual(retrieved, complexData)
  })

  test('should maintain data integrity after multiple operations', ({ assert }) => {
    const cache = new CacheService()

    cache.set('data', { count: 0 }, 60)

    const data1 = cache.get<{ count: number }>('data')
    assert.equal(data1?.count, 0)

    cache.set('data', { count: 1 }, 60)

    const data2 = cache.get<{ count: number }>('data')
    assert.equal(data2?.count, 1)
  })
})
