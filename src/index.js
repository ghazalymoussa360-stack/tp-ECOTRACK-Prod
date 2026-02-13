require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const config = require('./config');
const logger = require('./utils/logger');
const { errorHandler, notFoundHandler } = require('./middlewares/error.middleware');
const { generalLimiter } = require('./middlewares/rateLimit.middleware');

const { swaggerUi, specs } = require('./swagger');
const binsRoutes = require('./routes/bins.routes');
const authRoutes = require('./routes/auth.routes');
const healthRoutes = require('./routes/health.routes');

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Documentation Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

app.use('/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/bins', generalLimiter, binsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const startServer = async () => {
  try {
    const { initSchema, seedData } = require('./db/init');
    await initSchema();
    await seedData();

    app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port} in ${config.env} mode`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = app;
