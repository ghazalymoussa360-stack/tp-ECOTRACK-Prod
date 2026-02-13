# ECOTRACK API - Mesures de Sécurité

## Authentification JWT

- **Access Token**: Durée de vie 15 minutes
- **Refresh Token**: Durée de vie 7 jours
- **Algorithm**: HS256
- **Secret**: Stocké dans variable d'environnement

### Structure du Token
```json
{
  "userId": 1,
  "email": "user@example.com",
  "role": "admin"
}
```

## Authorization (RBAC)

### Rôles Définis
- **admin**: Accès complet
- **manager**: Lecture, création
- **collector**: Lecture, mise à jour
- **analyst**: Lecture seule

### Protection des Routes
```javascript
// Admin uniquement
router.delete('/:id', auth, authorize('admin'), controller.delete)

// Manager et Admin
router.post('/', auth, authorize('admin', 'manager'), controller.create)
```

## Validation des Données

### Schémas Joi
- Tous les champs entrants sont validés
- Types stricts (number, string, enum)
- Plages de valeurs vérifiées
- Messages d'erreur détaillés

### Exemples de Validation
```javascript
latitude: Joi.number().min(-90).max(90).required()
waste_type: Joi.string().valid('recyclable', 'organic', 'residual', 'hazardous')
password: Joi.string().min(6).required()
```

## Rate Limiting

### Limites Configurées
- **API Générale**: 100 requêtes / 15 minutes par IP
- **Authentification**: 5 tentatives / 15 minutes par IP
- **Fenêtre**: 15 minutes (900000 ms)

## Protection HTTP

### Headers Sécurisés (Helmet)
- X-Content-Type-Options
- X-Frame-Options
- X-XSS-Protection
- Strict-Transport-Security

### CORS
- Configuré pour accepter les requêtes cross-origin

## Sécurité Base de Données

### Protection Contre Injection
- Utilisation de requêtes paramétrées
- Pas de SQL dynamique avec entrées utilisateur

### Hachage des Mots de Passe
- Algorithme: bcrypt
- Salt rounds: 10

## Gestion des Erreurs

- Messages d'erreur génériques en production
- Détails des erreurs uniquement en développement
- Logging de toutes les erreurs

## Variables d'Environnement Requises

```
JWT_SECRET=... (min 32 caractères)
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=...
JWT_REFRESH_EXPIRES_IN=7d
DB_PASSWORD=...
REDIS_PASSWORD=... (si utilisé)
```

## Bonnes Pratiques Implémentées

- [x] Tokens avec expiration courte
- [x] Rate limiting sur endpoints critiques
- [x] Validation stricte des entrées
- [x] Hachage des mots de passe
- [x] Middleware d'authentification
- [x] Contrôle d'accès par rôle
- [x] Headers de sécurité (Helmet)
- [x] Connexion Redis/PostgreSQL sécurisée
