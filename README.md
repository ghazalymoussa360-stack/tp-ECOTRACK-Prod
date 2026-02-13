# ECOTRACK API - Production Ready Node.js API

API REST complète pour la gestion des poubelles connectées (ECOTRACK) avec architecture professionnelle, sécurité avancée, et optimisations de performance.

## Table des Matières

- [Prérequis](#prérequis)
- [Installation Rapide](#installation-rapide)
- [Docker Compose](#docker-compose-tout-en-un)
- [Configuration](#configuration)
- [Démarrage](#démarrage)
- [PM2 Clustering](#pm2-clustering)
- [API Endpoints](#api-endpoints)
- [Architecture](#architecture)
- [Tests](#tests)
- [Performance](#performance)
- [Troubleshooting](#troubleshooting)

## Prérequis

- Node.js >= 18.0.0
- npm >= 9
- Docker & Docker Compose (optionnel mais recommandé)
- PM2 global (pour production)

## Installation Rapide

### 1. Dépendances
```bash
npm install
```

### 2. Configuration
```bash
cp .env.example .env
```

Fichier `.env` avec variables essentielles :
```env
PORT=3005
NODE_ENV=development

# Base de données (Docker sur 5434)
DB_HOST=127.0.0.1
DB_PORT=5434
DB_USER=postgres
DB_PASSWORD=postgres
DB_DATABASE=ecotrack

# Redis (Docker sur 6379)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# JWT
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRES_IN=7d
```

## Docker Compose (Tout-en-un)

**Démarrage complet (API + PostgreSQL + Redis)**:

```bash
# Démarrer tous les services
docker-compose up -d

# Vérifier que tout est prêt
docker-compose logs

# Test de santé
curl http://localhost:3005/health
```

**Commandes utiles** :

```bash
# Voir les logs de l'API en direct
docker-compose logs -f api

# Accéder au shell PostgreSQL
docker-compose exec postgres psql -U postgres -d ecotrack

# Accéder à Redis
docker-compose exec redis redis-cli

# Arrêter tous les services
docker-compose down

# Arrêter et supprimer volumes (données)
docker-compose down -v

# Rebuild après changements
docker-compose up -d --build
```

**Services disponibles**:
- API: http://localhost:3005
- PostgreSQL: localhost:5434 (user: postgres, pass: postgres)
- Redis: localhost:6379

## Configuration

### Environnement de Développement

```bash
npm run dev
```
- Mode watch activé
- Logs structurés en JSON (Pino)
- API disponible sur http://localhost:3005

### Variables d'Environnement Critiques

```env
# Port (Important: PM2 utilise 3005)
PORT=3005

# PostgreSQL (Docker sur 5434, local sur 5432)
DB_HOST=127.0.0.1      # IPv4 obligatoire (pas de localhost en IPv6)
DB_PORT=5434           # Pour Docker, 5432 pour local
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=ecotrack

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# JWT Secrets (générer des clés fortes en production!)
JWT_SECRET=super_secret_access_key
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=super_secret_refresh_key
JWT_REFRESH_EXPIRES_IN=7d
```

## Démarrage

### Mode Développement
```bash
npm run dev
# Logs: "Server running on port 3005 in development mode"
# Health check: http://localhost:3005/health
```

### Mode Production (PM2 Clustering)

**Installation de PM2** (une seule fois):
```bash
npm install -g pm2
pm2 install pm2-logrotate
```

**Lancer l'application avec clustering** (20 workers):
```bash
pm2 start ecosystem.config.js
```

**Vérifier le status** :
```bash
pm2 list
# Affiche : 20 instances en "cluster" mode
# App Name | id | version | mode    | pid  | status  
# ecotrack | 0  | 1.0.0   | cluster | xxxx | online
# ...     | 1-19 (autres instances)
```

**Voir les logs en direct** :
```bash
pm2 logs ecotrack-api
```

**Arrêter/redémarrer** :
```bash
pm2 stop ecotrack-api      # Arrêter
pm2 start ecotrack-api     # Redémarrer
pm2 restart ecotrack-api   # Redémarrer (with reload)
pm2 delete ecotrack-api    # Supprimer de PM2
```

## PM2 Clustering

Le fichier `ecosystem.config.js` configure :

```javascript
{
  apps: [{
    name: 'ecotrack-api',
    script: './src/index.js',
    instances: 'max',        // Utilise tous les CPUs disponibles
    exec_mode: 'cluster',    // Mode cluster pour load balancing
    env: {
      PORT: 3005,
      NODE_ENV: 'production',
      DB_HOST: '127.0.0.1',  // IPv4 (important pour Windows)
      DB_PORT: 5434,         // Docker PostgreSQL
      REDIS_HOST: '127.0.0.1'
    }
  }]
}
```

**Vérifier que PM2 fonctionne** :
```bash
# Voir tous les processus PM2
pm2 list

# Voir seulement ecotrack-api
pm2 list | grep ecotrack

# Status détaillé
pm2 status

# Voir la mémoire/CPU utilisés
pm2 monit
```

## API Endpoints

### Health Checks (Sans Auth)

```bash
# Santé générale
curl http://localhost:3005/health

# Connexion PostgreSQL
curl http://localhost:3005/health/db

# Connexion Redis
curl http://localhost:3005/health/redis
```

### Authentication

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | /api/auth/register | Créer un compte |
| POST | /api/auth/login | Connexion |
| POST | /api/auth/refresh | Rafraîchir token |
| GET | /api/auth/me | Profil utilisateur |

#### Exemples

**Inscription** :
```bash
curl -X POST http://localhost:3005/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "role": "collector"
  }'
```

**Connexion** :
```bash
curl -X POST http://localhost:3005/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
# Retour: { "accessToken": "...", "refreshToken": "..." }
```

**Utiliser le token** :
```bash
curl -X GET http://localhost:3005/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Bins (Poubelles)

| Méthode | Endpoint | Description | Rôle Requis |
|---------|----------|-------------|-------------|
| GET | /api/bins | Lister les poubelles | Tous |
| GET | /api/bins/:id | Détails d'une poubelle | Tous |
| POST | /api/bins | Créer une poubelle | admin, manager |
| PUT | /api/bins/:id | Modifier une poubelle | admin, manager, collector |
| DELETE | /api/bins/:id | Supprimer une poubelle | admin |
| GET | /api/bins/stats | Statistiques | Tous |
| GET | /api/bins/critical | Poubelles critiques | Tous |

**Exemple - Créer une poubelle** :
```bash
curl -X POST http://localhost:3005/api/bins \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "bin_code": "BIN001",
    "latitude": 48.8566,
    "longitude": 2.3522,
    "waste_type": "recyclable",
    "capacity_liters": 500
  }'
```

## Architecture

Architecture en couches (Layered Architecture) :

```
┌──────────────────────────────────┐
│      Routes (Express.js)         │  Request entry point
├──────────────────────────────────┤
│    Middleware (Auth/Validation)  │  Cross-cutting concerns
├──────────────────────────────────┤
│    Controllers (HTTP Handler)    │  Request/Response orchestration
├──────────────────────────────────┤
│    Services (Business Logic)     │  Core logic + Redis caching
├──────────────────────────────────┤
│  Repositories (Data Access)      │  Database abstraction layer
├──────────────────────────────────┤
│  PostgreSQL + Redis              │  Persistence layer
└──────────────────────────────────┘
```

**Flux d'une requête** :
1. **Routes** (`src/routes/`) : Définition des endpoints
2. **Middleware** : Authentication (JWT), Validation (Joi), Rate Limiting
3. **Controllers** : Parsing requête, appel service
4. **Services** : Logique métier + Redis cache (cache-aside pattern)
5. **Repositories** : Requêtes SQL, connection pooling
6. **Database** : PostgreSQL (persistence)

Plus de détails dans [docs/architecture.md](docs/architecture.md) et [docs/audit_architecture.md](docs/audit_architecture.md)

## Tests

```bash
# Tous les tests
npm test

# Tests unitaires uniquement
npm run test:unit

# Tests intégration uniquement
npm run test:integration

# Avec couverture de code
npm test -- --coverage
```

**Fichiers de test** :
- `tests/unit/auth.service.test.js` : Logique authentification
- `tests/unit/bins.service.test.js` : Logique poubelles
- `tests/integration/bins.routes.test.js` : Routes poubelles

## Visualiser les fichiers .txt et .log

### Ouvrir dans VS Code
```bash
code test_results.txt
code test_final.txt
code test-results.log
```

### Afficher les 200 derniere lignes (PowerShell)
```powershell
Get-Content test_results.txt -Tail 200
Get-Content test_final.txt -Tail 200
Get-Content test-results.log -Tail 200
```

### Filtrer les erreurs
```powershell
Get-Content test_results.txt | Select-String -Pattern "FAIL|Error|Jest"
Get-Content test-results.log | Select-String -Pattern "ERROR|WARN"
```

## Performance

### Optimisations Mises en Place

| Feature | Impact |
|---------|--------|
| Redis Caching (Cache-Aside) | 20-80x plus rapide pour requêtes cachées |
| Connection Pooling (PostgreSQL) | Réduit overhead connexions |
| Compression (gzip) | Réduit taille réponses |
| Rate Limiting | Protège contre abuse |
| Clustering PM2 | Utilise tous les CPUs |

### Load Testing (Optionnel)

```bash
# Installation
npm install -g artillery

# Test simple
artillery quick --count 100 --num 50 http://localhost:3005/api/bins

# Fichier config personnalisé
artillery run load-test.yml
```

Plus de détails dans [docs/performance.md](docs/performance.md)

## Troubleshooting

### Problème: "Cannot connect to database"

**Solution** :
```bash
# Vérifier que PostgreSQL est démarré (Docker)
docker ps | grep postgres

# Si absent, recréer avec Docker Compose
docker-compose up -d postgres

# Vérifier la connexion directement
docker-compose exec postgres psql -U postgres -d ecotrack -c "SELECT 1;"
```

### Problème: "Redis connection refused"

**Solution** :
```bash
# Vérifier que Redis est démarré
docker ps | grep redis

# Si absent, relancer avec Docker Compose
docker-compose up -d redis

# Test connexion
docker-compose exec redis redis-cli ping
# Doit retourner: PONG
```

### Problème: "PM2 workers not responding"

**Solution** :
```bash
# Vérifier que DB_HOST utilisé est 127.0.0.1 (pas localhost)
grep DB_HOST .env

# Redémarrer PM2
pm2 delete ecotrack-api
pm2 start ecosystem.config.js

# Attendre 5-10 secondes pour initialisation
sleep 10

# Vérifier avec health check
curl http://localhost:3005/health
```

### Problème: "Port 3005 already in use"

**Solution** :
```bash
# Trouver le processus utilisant le port
netstat -ano | findstr :3005  # Windows

# Arrêter PM2
pm2 stop ecotrack-api
pm2 delete ecotrack-api

# Ou changer PORT dans .env et ecosystem.config.js
```

### Problème: "Database schema not initialized"

**Solution** :
```bash
# Vérifier les tables
docker-compose exec postgres psql -U postgres -d ecotrack -c "\dt"

# Si vides, réinitaliser (lancer l'app une fois)
npm run dev  # Lance l'init automatique
```

## Documentation Complète

- [Architecture Détaillée](docs/architecture.md)
- [API Complète](docs/api.md)
- [Sécurité](docs/security.md)
- [Performance & Optimisations](docs/performance.md)
- [Audit Architecture](docs/audit_architecture.md)
- [PM2 Activity Logs](docs/pm2_activity.md)

## Scripts npm

```bash
npm run dev        # Développement (watch mode)
npm start         # Production (direct node)
npm test          # Tests complets
npm run test:unit # Tests unitaires
npm run test:integration # Tests intégration
```

## License

MIT
