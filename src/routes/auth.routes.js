const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authenticate = require('../middlewares/auth.middleware');
const { validate, schemas } = require('../middlewares/validation.middleware');
const { authLimiter } = require('../middlewares/rateLimit.middleware');

router.post('/register', authLimiter, validate(schemas.register), authController.register);
router.post('/login', authLimiter, validate(schemas.login), authController.login);
router.post('/refresh', validate(schemas.refresh), authController.refresh);
router.get('/me', authenticate, authController.me);

module.exports = router;
