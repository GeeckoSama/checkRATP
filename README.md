# checkRATP

API de surveillance des incidents en temps réel sur le métro parisien RATP.

## Description

**checkRATP** est une API REST développée avec AdonisJS v6 qui permet de surveiller les incidents en cours sur les lignes de métro RATP. L'application interroge l'API officielle Île-de-France Mobilités et filtre les incidents en fonction des lignes demandées.

## Fonctionnalités

- Vérification des incidents en temps réel sur les lignes de métro (1-14, 3bis, 7bis)
- Liste de toutes les lignes de métro disponibles avec leurs identifiants IDFM
- Cache intelligent de 30 secondes pour optimiser les appels API
- Réponses JSON standardisées
- Filtre par période d'application et sections impactées

## Installation

### Prérequis

- Node.js >= 20.x
- npm ou pnpm
- Clé API Île-de-France Mobilités ([obtenir une clé](https://prim.iledefrance-mobilites.fr/))

### Installation locale

```bash
# Cloner le repository
git clone https://github.com/votre-username/checkRATP.git
cd checkRATP

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env
# Éditer .env et ajouter votre RATP_API_KEY

# Générer la clé d'application
node ace generate:key

# Démarrer le serveur de développement
npm run dev
```

L'API sera accessible sur `http://localhost:3333`

### Déploiement Docker

```bash
# Créer le fichier d'environnement
cp .env.production.example .env
# Éditer .env avec vos configurations

# Construire et démarrer avec Docker Compose
docker compose up -d

# Vérifier les logs
docker compose logs -f
```

Le script `deploy.sh` est également disponible pour faciliter le déploiement :

```bash
./deploy.sh build   # Construire l'image
./deploy.sh start   # Démarrer l'application
./deploy.sh logs    # Voir les logs
./deploy.sh restart # Redémarrer
./deploy.sh stop    # Arrêter
```

## Utilisation de l'API

### Lister les lignes disponibles

```http
GET /metro/lines
```

**Réponse :**
```json
{
  "lines": [
    { "name": "1", "id": "C01371" },
    { "name": "2", "id": "C01372" },
    ...
  ],
  "total": 16
}
```

### Vérifier les incidents

```http
GET /metro/check?lines=8,12
```

**Paramètres :**
- `lines` (requis) : Liste des lignes séparées par des virgules (ex: `8,12`)

**Réponse (avec incidents) :**
```json
{
  "alert": true,
  "requestedLines": ["8", "12"],
  "lineIds": ["C01378", "C01382"],
  "count": 2,
  "details": [
    {
      "id": "...",
      "title": "...",
      "severity": "BLOQUANTE",
      "cause": "...",
      "message": "...",
      "impactedSections": [...]
    }
  ]
}
```

**Réponse (sans incident) :**
```json
{
  "alert": false,
  "requestedLines": ["8"],
  "lineIds": ["C01378"],
  "message": "Trafic fluide sur toutes les lignes demandées"
}
```

## Commandes de développement

```bash
# Développement avec hot reload
npm run dev

# Tests
npm test

# Linting
npm run lint

# Formatage du code
npm run format

# Vérification des types
npm run typecheck

# Build de production
npm run build

# Démarrer en production
npm start
```

## Architecture

### Stack technique

- **Framework** : AdonisJS v6
- **Runtime** : Node.js
- **Language** : TypeScript
- **Tests** : Japa
- **Linting** : ESLint
- **Formatage** : Prettier

### Structure du projet

```
checkRATP/
├── app/
│   ├── controllers/     # Contrôleurs HTTP
│   ├── middleware/      # Middleware personnalisés
│   ├── services/        # Logique métier
│   │   ├── transport.service.ts    # Filtrage des incidents
│   │   ├── line_mapper.service.ts  # Mapping lignes/IDs
│   │   └── cache.service.ts        # Système de cache
│   └── types/          # Types TypeScript
├── config/             # Configuration de l'application
├── start/              # Bootstrap de l'application
├── tests/              # Tests unitaires et fonctionnels
└── docker-compose.yml  # Configuration Docker
```

## Configuration

Les variables d'environnement requises :

```bash
# Serveur
PORT=3333
HOST=localhost
NODE_ENV=production

# API RATP/IDFM
RATP_API_URL=https://prim.iledefrance-mobilites.fr/marketplace/traffic-schedule/disruptions
RATP_API_KEY=your_api_key_here

# Application
APP_KEY=your_generated_app_key
LOG_LEVEL=info
TZ=UTC
```

## Licence

UNLICENSED - Projet privé

## Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

## Auteur

Développé avec AdonisJS
