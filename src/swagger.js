const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ECOTRACK API',
      version: '1.0.0',
      description: 'API REST professionnelle pour la gestion des poubelles connectées',
      contact: {
        name: 'Support ECOTRACK',
        email: 'support@ecotrack.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Serveur de développement',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Bin: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            bin_code: { type: 'string', example: 'BIN001' },
            latitude: { type: 'number', example: 48.8566 },
            longitude: { type: 'number', example: 2.3522 },
            waste_type: { type: 'string', enum: ['recyclable', 'organic', 'residual', 'hazardous'] },
            capacity_liters: { type: 'number', example: 500 },
            current_fill_level: { type: 'number', example: 45 },
            location_name: { type: 'string', example: 'Paris Centre' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            email: { type: 'string', format: 'email' },
            role: { type: 'string', enum: ['admin', 'manager', 'collector', 'analyst'] },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                user: { $ref: '#/components/schemas/User' },
                accessToken: { type: 'string' },
                refreshToken: { type: 'string' },
                expiresIn: { type: 'string' },
              },
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            status: { type: 'string' },
            code: { type: 'string' },
            message: { type: 'string' },
            errors: { type: 'array' },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js'],
};

const specs = swaggerJsdoc(options);

module.exports = { swaggerUi, specs };
