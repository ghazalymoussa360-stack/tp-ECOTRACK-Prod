const binsService = require('../services/bins.service');
const logger = require('../utils/logger');

class BinsController {
  async getAll(req, res, next) {
    try {
      const filters = {
        wasteType: req.query.wasteType,
        minFillLevel: req.query.minFillLevel ? parseFloat(req.query.minFillLevel) : undefined,
        maxFillLevel: req.query.maxFillLevel ? parseFloat(req.query.maxFillLevel) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset) : undefined,
      };

      const bins = await binsService.getAllBins(filters);
      
      res.status(200).json({
        success: true,
        count: bins.length,
        data: bins,
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const bin = await binsService.getBinById(req.params.id);
      
      res.status(200).json({
        success: true,
        data: bin,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const bin = await binsService.createBin(req.body);
      
      logger.info(`Bin created: ${bin.bin_code}`);
      
      res.status(201).json({
        success: true,
        message: 'Bin created successfully',
        data: bin,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const bin = await binsService.updateBin(req.params.id, req.body);
      
      logger.info(`Bin updated: ${bin.bin_code}`);
      
      res.status(200).json({
        success: true,
        message: 'Bin updated successfully',
        data: bin,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await binsService.deleteBin(req.params.id);
      
      logger.info(`Bin deleted: ${req.params.id}`);
      
      res.status(200).json({
        success: true,
        message: 'Bin deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getStats(req, res, next) {
    try {
      const stats = await binsService.getStats();
      
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCritical(req, res, next) {
    try {
      const threshold = req.query.threshold ? parseFloat(req.query.threshold) : 85;
      const bins = await binsService.getCriticalBins(threshold);
      
      res.status(200).json({
        success: true,
        count: bins.length,
        data: bins,
      });
    } catch (error) {
      next(error);
    }
  }

  async getByWasteType(req, res, next) {
    try {
      const bins = await binsService.getBinsByWasteType(req.params.wasteType);
      
      res.status(200).json({
        success: true,
        count: bins.length,
        data: bins,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new BinsController();
