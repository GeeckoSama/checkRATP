# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

checkRATP is an AdonisJS v6 application for monitoring Paris RATP public transport incidents. The application checks for active incidents on specific metro lines (8 and 12) by consuming an external transport API and filtering incidents based on application periods and impacted sections.

## Development Commands

```bash
# Start development server with hot module reload
npm run dev

# Build the application for production
npm run build

# Start production server
npm start

# Run all tests
npm test
node ace test

# Run specific test suite
node ace test --suite=unit
node ace test --suite=functional

# Lint code
npm run lint

# Format code
npm run format

# Type checking
npm run typecheck
```

## Project Architecture

### Framework Structure

This is an AdonisJS v6 application following standard AdonisJS conventions:

- **Entry points**: Located in [bin/](bin/) directory
  - [bin/server.ts](bin/server.ts) - HTTP server entry point
  - [bin/console.ts](bin/console.ts) - CLI entry point
  - [bin/test.ts](bin/test.ts) - Test runner entry point

- **Application bootstrap**: [start/](start/) directory
  - [start/kernel.ts](start/kernel.ts) - HTTP middleware stack configuration (server and router middleware)
  - [start/routes.ts](start/routes.ts) - Route definitions
  - [start/env.ts](start/env.ts) - Environment variable validation

- **Configuration**: [config/](config/) directory contains app configuration files (app, cors, logger, hash, bodyparser)

### Path Aliases

The project uses TypeScript path aliases (defined in [package.json](package.json) `imports` field):
- `#controllers/*` → `./app/controllers/*.js`
- `#services/*` → `./app/services/*.js`
- `#middleware/*` → `./app/middleware/*.js`
- `#types/*` → `./app/types/*.js`
- `#exceptions/*` → `./app/exceptions/*.js`
- `#validators/*` → `./app/validators/*.js`
- `#models/*`, `#mails/*`, `#listeners/*`, `#events/*`, `#providers/*`, `#policies/*`, `#abilities/*`, `#database/*`, `#start/*`, `#tests/*`, `#config/*`

Always use these aliases when importing application code.

### Application Structure

#### Middleware Stack

Two custom middleware are registered globally (in [start/kernel.ts](start/kernel.ts#L25-L28)):

1. **ContainerBindingsMiddleware** ([app/middleware/container_bindings_middleware.ts](app/middleware/container_bindings_middleware.ts))
   - Binds `HttpContext` and `Logger` to the IoC container for dependency injection
   - Runs first in the middleware stack

2. **ForceJsonResponseMiddleware** ([app/middleware/force_json_response_middleware.ts](app/middleware/force_json_response_middleware.ts))
   - Forces all responses to be JSON by setting Accept header to `application/json`
   - Ensures validation errors, auth errors, etc. return JSON format

#### Transport Incident System

The core business logic for checking transport incidents:

- **Types** ([app/types/transport.type.ts](app/types/transport.type.ts))
  - `TransportIncident` - Main incident structure with cause, severity, title, message
  - `ApplicationPeriod` - Time period format: `YYYYMMDDTHHmmss`
  - `ImpactedSection` - Affected line sections with line IDs (format: `line:IDFM:C01378`)

- **Services**
  - **TransportService** ([app/services/transport.service.ts](app/services/transport.service.ts))
    - `getActiveIncidents(incidents, targetLineIds)` - Filters incidents by:
      1. Current time within application period
      2. Line ID matches in impactedSections
    - Time comparison: Converts current datetime to `YYYYMMDDTHHmmss` format string for comparison

  - **LineMapperService** ([app/services/line_mapper.service.ts](app/services/line_mapper.service.ts))
    - Maps simple metro line names ("8", "12") to IDFM IDs
    - `convertLines(lineNames)` - Converts array of line names to IDFM IDs
    - `getLineId(lineName)` - Gets single line ID from name
    - `getAvailableLines()` - Returns all available lines with their IDs
    - Supports 16 metro lines: 1-14, 3bis, 7bis
    - Uses correct IDFM line IDs (C01371-C01387)

  - **CacheService** ([app/services/cache.service.ts](app/services/cache.service.ts))
    - Simple in-memory cache with TTL (Time To Live)
    - `get<T>(key)` - Retrieves cached value if not expired
    - `set(key, data, ttlSeconds)` - Stores value with expiration
    - Automatic cleanup every minute
    - Used to cache RATP API responses for 30 seconds

- **Controller** ([app/controllers/metro.controller.ts](app/controllers/metro.controller.ts))
  - `MetroController.check()` - Main endpoint to check incidents
    - Accepts simple line names: `?lines=8,12`
    - Converts to IDFM IDs using LineMapperService
    - Uses 30-second cache to reduce API calls
    - Filters by matching line IDs in impactedSections
    - Route: `GET /metro/check?lines=8,12`
  - `MetroController.listLines()` - Lists all available metro lines
    - Route: `GET /metro/lines`

### Test Configuration

Tests are organized into two suites (configured in [adonisrc.ts](adonisrc.ts#L69-L81)):
- **unit**: Files in `tests/unit/**/*.spec.ts`, timeout 2000ms
- **functional**: Files in `tests/functional/**/*.spec.ts`, timeout 30000ms

Uses Japa test runner with plugins: `@japa/assert`, `@japa/api-client`, `@japa/plugin-adonisjs`

### Hot Module Reload

HMR is configured for controllers and middleware ([package.json](package.json#L60-L64)):
```json
"hotHook": {
  "boundaries": [
    "./app/controllers/**/*.ts",
    "./app/middleware/*.ts"
  ]
}
```

## API Routes

### List Available Metro Lines
`GET /metro/lines`

Returns a list of all available metro lines with their IDFM IDs.

**Response:**
```json
{
  "lines": [
    { "name": "1", "id": "C01371" },
    { "name": "2", "id": "C01372" },
    { "name": "3", "id": "C01373" },
    { "name": "3bis", "id": "C01386" },
    ...
  ],
  "total": 16
}
```

### Metro Incident Check
`GET /metro/check`

Checks for active incidents on specified metro lines by matching IDFM line IDs in impacted sections.

**Query Parameters:**
- `lines` (required) - Comma-separated list of metro line numbers
  - Format: `lines=8,12`
  - Supported: 1-14, 3bis, 7bis

**Response (with incidents):**
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

**Response (no incidents):**
```json
{
  "alert": false,
  "requestedLines": ["8"],
  "lineIds": ["C01378"],
  "message": "Trafic fluide sur toutes les lignes demandées"
}
```

**Error Response (invalid lines):**
```json
{
  "error": "Lignes invalides détectées",
  "invalidLines": ["99"],
  "availableLines": ["1", "2", "3", "3bis", "4", "5", "6", "7", "7bis", "8", "9", "10", "11", "12", "13", "14"]
}
```

**Note:** API responses are cached for 30 seconds to reduce load on the RATP API.

## Environment Configuration

The application requires the following environment variables in `.env`:

```bash
# RATP/IDFM API Configuration
RATP_API_URL=https://prim.iledefrance-mobilites.fr/marketplace/traffic-schedule/disruptions
RATP_API_KEY=your_api_key_here
```

Get your API key from: https://prim.iledefrance-mobilites.fr/

## Docker Deployment

### Prerequisites
- Docker and Docker Compose installed on your VPS
- A valid RATP API key

### Quick Start

1. **Clone the repository on your VPS:**
   ```bash
   git clone <your-repo-url>
   cd checkRATP
   ```

2. **Create production environment file:**
   ```bash
   cp .env.production.example .env
   nano .env  # Edit with your configuration
   ```

3. **Generate a secure APP_KEY:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

4. **Build and start the application:**
   ```bash
   docker compose build
   docker compose up -d
   ```

5. **Check the application status:**
   ```bash
   docker compose ps
   docker compose logs -f
   ```

### Using the Deploy Script

A convenient deploy script is provided for common operations:

```bash
# Make the script executable (first time only)
chmod +x deploy.sh

# Build the Docker image
./deploy.sh build

# Start the application
./deploy.sh start

# View logs
./deploy.sh logs

# Restart the application
./deploy.sh restart

# Stop the application
./deploy.sh stop

# Check status
./deploy.sh status
```

### Docker Configuration

**Dockerfile:**
- Multi-stage build for optimized image size
- Non-root user for security
- Health check configured
- Production-ready with dumb-init for proper signal handling

**docker-compose.yml:**
- Exposes port 3333
- Auto-restart unless stopped
- Health checks enabled
- Environment variables from .env file

### Reverse Proxy Configuration (Nginx)

Example Nginx configuration for proxying to the application:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3333;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Updating the Application

```bash
# Pull latest changes
git pull

# Rebuild and restart
docker compose build
docker compose up -d

# Or use the deploy script
./deploy.sh build
./deploy.sh restart
```

### Monitoring

View application logs:
```bash
docker compose logs -f checkratp
```

Check container health:
```bash
docker compose ps
```

### Troubleshooting

**Container won't start:**
```bash
# Check logs
docker compose logs checkratp

# Verify environment variables
docker compose config
```

**Port already in use:**
Edit `docker-compose.yml` and change the port mapping:
```yaml
ports:
  - "8080:3333"  # Use port 8080 instead of 3333
```

## Important Implementation Notes

- **Line filtering** - Incidents are filtered by matching IDFM line IDs (C01371-C01387) in the `impactedSections` array
- **Line mapping** - Simple line names ("8", "12") are converted to IDFM IDs using LineMapperService
- **Caching** - API responses are cached in memory for 30 seconds to reduce load on the RATP API
- **API authentication** - Uses `apikey` header with the value from `RATP_API_KEY` environment variable
- **Incident severity levels** - `BLOQUANTE`, `PERTURBEE`, `INFORMATION`
- **JSON responses** - All responses are forced to JSON format by the ForceJsonResponseMiddleware
- **Supported lines** - Metro lines 1-14, 3bis, 7bis
- **Path aliases** - May not work correctly with TypeScript - use relative imports for types and services
