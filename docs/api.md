# ECOTRACK API - Documentation des Endpoints

## Base URL
```
http://localhost:3005
```

## Authentication

### POST /api/auth/register
Créer un nouveau compte utilisateur.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "role": "collector"
}
```

**Réponse (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": { "id": 1, "email": "...", "role": "collector" },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "expiresIn": "15m"
  }
}
```

### POST /api/auth/login
Connexion utilisateur.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### POST /api/auth/refresh
Renouveler le token d'accès.

**Body:**
```json
{
  "refreshToken": "eyJ..."
}
```

### GET /api/auth/me
Obtenir les infos de l'utilisateur connecté.

**Headers:** `Authorization: Bearer <token>`

## Bins

### GET /api/bins
Lister toutes les poubelles.

**Query Parameters:**
- `wasteType` (optional): recyclable, organic, residual, hazardous
- `minFillLevel` (optional): number
- `maxFillLevel` (optional): number
- `limit` (optional): number
- `offset` (optional): number

**Headers:** `Authorization: Bearer <token>` (obligatoire)

### GET /api/bins/:id
Obtenir une poubelle par ID.

**Headers:** `Authorization: Bearer <token>` (obligatoire)

### POST /api/bins
Créer une poubelle. (Admin, Manager)

**Headers:** `Authorization: Bearer <token>` (obligatoire)

**Body:**
```json
{
  "bin_code": "BIN001",
  "latitude": 48.8566,
  "longitude": 2.3522,
  "waste_type": "recyclable",
  "capacity_liters": 500,
  "location_name": "Paris Centre"
}
```

### PUT /api/bins/:id
Mettre à jour une poubelle. (Admin, Manager, Collector)

**Headers:** `Authorization: Bearer <token>` (obligatoire)

### DELETE /api/bins/:id
Supprimer une poubelle. (Admin uniquement)

**Headers:** `Authorization: Bearer <token>` (obligatoire)

### GET /api/bins/stats
Obtenir les statistiques globales.

**Headers:** `Authorization: Bearer <token>` (obligatoire)

### GET /api/bins/critical
Obtenir les poubelles critiques (>85%).

**Query:** `?threshold=85`

### GET /api/bins/waste-type/:wasteType
Lister les poubelles par type de déchet.

**Headers:** `Authorization: Bearer <token>` (obligatoire)

## Health Checks

### GET /health
Santé générale de l'API.

### GET /health/db
Vérification de la connexion PostgreSQL.

### GET /health/redis
Vérification de la connexion Redis.

## Codes HTTP

| Code | Signification |
|------|----------------|
| 200 | Succès |
| 201 | Créé |
| 400 | Erreur de validation |
| 401 | Non authentifié |
| 403 | Interdit (permissions) |
| 404 | Non trouvé |
| 429 | Trop de requêtes |
| 500 | Erreur serveur |

## Rôles

| Rôle | Permissions |
|------|-------------|
| admin | CRUD complet |
| manager | CREATE, READ |
| collector | READ, UPDATE |
| analyst | READ uniquement |
