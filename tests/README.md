# Tests checkRATP

Documentation complète de la suite de tests pour l'application checkRATP.

## Structure des tests

```
tests/
├── bootstrap.ts              # Configuration Japa
├── unit/                     # Tests unitaires
│   ├── cache_service.spec.ts
│   ├── line_mapper_service.spec.ts
│   └── transport_service.spec.ts
└── functional/               # Tests fonctionnels (E2E)
    └── metro_controller.spec.ts
```

## Exécuter les tests

### Tous les tests

```bash
npm test
```

### Tests unitaires uniquement

```bash
npm run test:unit
```

### Tests fonctionnels uniquement

```bash
npm run test:functional
```

### Avec couverture de code

```bash
npm run test:coverage
```

Le rapport de couverture HTML sera généré dans `coverage/index.html`.

## Tests unitaires

### CacheService (21 tests)

Tests du service de cache en mémoire :

- **set and get** (9 tests) : Stockage et récupération de valeurs (string, object, array, null, undefined, boolean, number)
- **TTL and expiration** (4 tests) : Expiration des entrées après le TTL
- **delete** (3 tests) : Suppression d'entrées
- **clear** (3 tests) : Vidage complet du cache
- **cleanup** (4 tests) : Nettoyage des entrées expirées
- **complex scenarios** (3 tests) : Scénarios complexes (sets rapides, opérations mixtes, objets imbriqués)

### LineMapperService (33 tests)

Tests du service de mapping des lignes :

- **getLineId** (10 tests) :
  - Conversion des noms de lignes (1-14, 3bis, 7bis, A-E)
  - Case insensitive
  - Gestion des erreurs

- **convertLines** (13 tests) :
  - Conversion de tableaux de lignes
  - Validation des IDs IDFM
  - Gestion des espaces
  - Détection des lignes invalides

- **getAvailableLines** (10 tests) :
  - Liste complète des lignes (16 métro + 5 RER)
  - Structure correcte des données
  - Typage (metro/rer)

### TransportService (10 tests)

Tests du service de filtrage des incidents :

- Filtrage des incidents actifs
- Filtrage par période (actif, futur, passé)
- Filtrage par ligne
- Gestion des incidents sans `impactedSections`
- Gestion des périodes multiples

## Tests fonctionnels

### MetroController (31 tests)

Tests des endpoints API :

**GET /metro/check** (16 tests) :
- Validation des paramètres (required, invalid)
- Acceptation de toutes les combinaisons de lignes
- Support des formats multiples (noms simples, IDFM IDs)
- Cache
- Rate limiting

**GET /metro/lines** (10 tests) :
- Liste complète des lignes
- Structure des données
- Métro et RER séparés

**Error handling** (5 tests) :
- Gestion des erreurs
- Réponses JSON
- Routes invalides

## Couverture de code

Objectifs de couverture configurés dans `.c8rc.json` :

- **Lines**: 80%
- **Statements**: 80%
- **Functions**: 80%
- **Branches**: 70%

### Fichiers couverts

- ✅ `app/services/cache.service.ts` - 100%
- ✅ `app/services/line_mapper.service.ts` - 100%
- ✅ `app/services/transport.service.ts` - 100%
- ✅ `app/controllers/metro.controller.ts` - Couvert par tests fonctionnels

### Fichiers exclus

- `tests/**` - Tests eux-mêmes
- `bin/**` - Points d'entrée
- `config/**` - Configuration
- `start/**` - Bootstrap
- `database/**` - Migrations

## Technologies utilisées

- **Japa** - Test runner
- **@japa/assert** - Assertions
- **@japa/api-client** - Tests HTTP
- **@japa/plugin-adonisjs** - Intégration AdonisJS
- **c8** - Couverture de code (Istanbul)

## Bonnes pratiques

### Tests unitaires

1. **Isolation** : Chaque test est indépendant
2. **Nomenclature** : `should [action] [expected result]`
3. **AAA Pattern** : Arrange, Act, Assert
4. **Edge cases** : Tester les cas limites (null, undefined, empty, etc.)

### Tests fonctionnels

1. **Setup/Teardown** : Utiliser les hooks de groupe
2. **HTTP assertions** : Utiliser `assertStatus`, `assertBodyContains`, etc.
3. **Isolation** : Chaque test démarre un nouveau serveur
4. **Real data** : Tests avec la vraie API quand possible

## Debugging

### Activer les logs de debug

```bash
LOG_LEVEL=debug npm test
```

### Exécuter un seul test

```bash
# Filtrer par nom de test
node ace test --grep "should filter incidents that are currently active"

# Filtrer par fichier
node ace test tests/unit/cache_service.spec.ts
```

### Mode watch (non configuré)

Pour l'instant, relancer manuellement les tests à chaque modification.

## CI/CD

Les tests peuvent être intégrés dans un pipeline CI/CD :

```yaml
# Exemple GitHub Actions
- name: Run tests
  run: npm test

- name: Check coverage
  run: npm run test:coverage

- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/lcov.info
```

## Maintenance

### Ajouter un nouveau test

1. Créer un fichier `.spec.ts` dans `tests/unit/` ou `tests/functional/`
2. Importer le test runner : `import { test } from '@japa/runner'`
3. Organiser en groupes : `test.group('Group name', () => { ... })`
4. Écrire les tests : `test('should...', ({ assert }) => { ... })`

### Mettre à jour la couverture

Modifier les seuils dans `.c8rc.json` selon les besoins du projet.

## Problèmes connus

- Les tests fonctionnels nécessitent que le serveur ne soit pas déjà en cours d'exécution
- Le cache en mémoire persiste entre les tests (intentionnel pour tester le cleanup)
- Les tests d'expiration utilisent `setTimeout` et peuvent être lents

## Support

Pour toute question sur les tests, consulter :
- Documentation Japa : https://japa.dev
- Documentation AdonisJS Testing : https://docs.adonisjs.com/guides/testing
