const express = require('express');
const router = express.Router();
const binsController = require('../controllers/bins.controller');
const authenticate = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorize.middleware');
const { validate, schemas } = require('../middlewares/validation.middleware');

router.get('/', authenticate, binsController.getAll);
router.get('/stats', authenticate, binsController.getStats);
router.get('/critical', authenticate, binsController.getCritical);
router.get('/waste-type/:wasteType', authenticate, binsController.getByWasteType);
router.get('/:id', authenticate, binsController.getById);

router.post(
  '/',
  authenticate,
  authorize('admin', 'manager'),
  validate(schemas.binsCreate),
  binsController.create
);

router.put(
  '/:id',
  authenticate,
  authorize('admin', 'manager', 'collector'),
  validate(schemas.binsUpdate),
  binsController.update
);

router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  binsController.delete
);

module.exports = router;
