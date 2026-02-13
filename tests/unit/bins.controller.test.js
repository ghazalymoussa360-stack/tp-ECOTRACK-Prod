const binsController = require('../../src/controllers/bins.controller');
const binsService = require('../../src/services/bins.service');
const { ValidationError, NotFoundError } = require('../../src/errors/appErrors');

jest.mock('../../src/services/bins.service');

describe('BinsController', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should get all bins successfully', async () => {
      const bins = [{ id: 1, bin_code: 'BIN001' }];
      binsService.getAllBins.mockResolvedValue(bins);

      await binsController.getAll(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 1,
        data: bins,
      });
    });

    it('should handle getAll errors', async () => {
      const error = new Error('Database error');
      binsService.getAllBins.mockRejectedValue(error);

      await binsController.getAll(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getById', () => {
    it('should get bin by id successfully', async () => {
      req.params.id = '1';
      const bin = { id: 1, bin_code: 'BIN001' };
      binsService.getBinById.mockResolvedValue(bin);

      await binsController.getById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: bin,
      });
    });

    it('should handle getById errors', async () => {
      req.params.id = '999';
      const error = new NotFoundError('Bin not found');
      binsService.getBinById.mockRejectedValue(error);

      await binsController.getById(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('create', () => {
    it('should create bin successfully', async () => {
      req.body = { bin_code: 'BIN002', latitude: 48.8566, longitude: 2.3522, waste_type: 'recyclable' };
      const bin = { id: 2, bin_code: 'BIN002' };
      binsService.createBin.mockResolvedValue(bin);

      await binsController.create(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Bin created successfully',
        data: bin,
      });
    });

    it('should handle create errors', async () => {
      req.body = { bin_code: 'BIN' };
      const error = new ValidationError('Invalid bin code');
      binsService.createBin.mockRejectedValue(error);

      await binsController.create(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('update', () => {
    it('should update bin successfully', async () => {
      req.params.id = '1';
      req.body = { current_fill_level: 80 };
      const bin = { id: 1, bin_code: 'BIN001', current_fill_level: 80 };
      binsService.updateBin.mockResolvedValue(bin);

      await binsController.update(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Bin updated successfully',
        data: bin,
      });
    });

    it('should handle update errors', async () => {
      req.params.id = '999';
      req.body = { current_fill_level: 80 };
      const error = new NotFoundError('Bin not found');
      binsService.updateBin.mockRejectedValue(error);

      await binsController.update(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('delete', () => {
    it('should delete bin successfully', async () => {
      req.params.id = '1';
      binsService.deleteBin.mockResolvedValue();

      await binsController.delete(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Bin deleted successfully',
      });
    });

    it('should handle delete errors', async () => {
      req.params.id = '999';
      const error = new NotFoundError('Bin not found');
      binsService.deleteBin.mockRejectedValue(error);

      await binsController.delete(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getStats', () => {
    it('should get stats successfully', async () => {
      const stats = { total_bins: 10, avg_fill_level: 50 };
      binsService.getStats.mockResolvedValue(stats);

      await binsController.getStats(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: stats,
      });
    });

    it('should handle getStats errors', async () => {
      const error = new Error('Database error');
      binsService.getStats.mockRejectedValue(error);

      await binsController.getStats(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getCritical', () => {
    it('should get critical bins successfully', async () => {
      req.query.threshold = '80';
      const bins = [{ id: 1, bin_code: 'BIN001', current_fill_level: 90 }];
      binsService.getCriticalBins.mockResolvedValue(bins);

      await binsController.getCritical(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 1,
        data: bins,
      });
    });

    it('should handle getCritical errors', async () => {
      const error = new Error('Service error');
      binsService.getCriticalBins.mockRejectedValue(error);

      await binsController.getCritical(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getByWasteType', () => {
    it('should get bins by waste type successfully', async () => {
      req.params.wasteType = 'recyclable';
      const bins = [{ id: 1, bin_code: 'BIN001', waste_type: 'recyclable' }];
      binsService.getBinsByWasteType.mockResolvedValue(bins);

      await binsController.getByWasteType(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 1,
        data: bins,
      });
    });

    it('should handle getByWasteType errors', async () => {
      req.params.wasteType = 'invalid';
      const error = new ValidationError('Invalid waste type');
      binsService.getBinsByWasteType.mockRejectedValue(error);

      await binsController.getByWasteType(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
