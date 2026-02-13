const express = require('express');
const router = express.Router();
const healthController = require('../controllers/health.controller');

router.get('/', healthController.general);
router.get('/db', healthController.db);
router.get('/redis', healthController.redis);

module.exports = router;
