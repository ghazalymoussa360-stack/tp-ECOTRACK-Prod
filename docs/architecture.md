# ECOTRACK API - Documentation d'Architecture

## Vue d'Ensemble

L'API ECOTRACK est structurée selon une architecture en couches (Layered Architecture) pour garantir maintenabilité, testabilité et scalabilité.

## Structure des Dossiers

```
src/
├── config/          # Configuration de l'application
├── controllers/     # Orchestration des requêtes HTTP
├── db/              # Connexion et initialisation base de données
├── errors/          # Classes d'erreurs personnalisées
├── middlewares/     # Middlewares Express (auth, validation, etc.)
├── repositories/    # Accès aux données (Data Access Layer)
├── routes/          # Définition des endpoints
├── services/        # Logique métier
└── utils/           # Utilitaires (logger, cache Redis)
```

## Flux des Données

```
Requête HTTP
    ↓
Routes (routes/*.js)
    ↓
Middleware (validation, auth)
    ↓
Controller (controllers/*.js)
    ↓
Service (services/*.js)
    ↓
Repository (repositories/*.js)
    ↓
Base de données (PostgreSQL)
```

## Couche Repository

- **Responsabilité** : Accès exclusif aux données
- **Indépendance** : Ne connaît pas HTTP/Express
- **Méthodes** : CRUD complet + requêtes complexes

## Couche Service

- **Responsabilité** : Logique métier pure
- **Dépendances** : Utilise les Repositories
- **Validation** : Règles métier spécifiques

## Couche Controller

- **Responsabilité** : Orchestration, formatage réponse
- **Dépendances** : Appelle les Services
- **Gestion erreurs** : Capture et transmet aux middlewares

## Patterns Implémentés

### Repository Pattern
- Encapsulation de l'accès données
- Facilite le changement de SGBD
- Méthodes : findAll, findById, create, update, delete

### Dependency Injection
- Import direct des modules
- Mock possible pour les tests

### Middleware Pattern
- Validation (Joi/Zod)
- Authentication (JWT)
- Authorization (RBAC)
- Rate Limiting

## Décisions Techniques

| Aspect | Choix | Justification |
|--------|-------|----------------|
| Base de données | PostgreSQL | Robuste, relationnel |
| Cache | Redis | Performance, TTL flexible |
| Auth | JWT | Stateless, scalabilité |
| Validation | Joi | Mature, expressif |
| Logging | Pino | Ultra-rapide, faible empreinte |
| Tests | Jest | Tout-en-un, bonnes integrations |

## Déploiement & Runtime

### Docker Compose
- PostgreSQL 15 + Redis 7 + API Node.js
- Health checks pour API, DB et Redis

### PM2 Clustering
- `exec_mode: cluster` pour exploiter tous les CPU
- Load balancing entre workers
- Redémarrage auto en cas d'erreur

### Cache-aside (Redis)
- Lecture: Redis en premier, fallback PostgreSQL
- Écriture: DB d'abord, puis invalidation de clés
