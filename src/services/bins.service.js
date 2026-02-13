const binsRepository = require('../repositories/bins.repository');
const cache = require('../utils/redis');
const { ValidationError } = require('../errors/appErrors');

class BinsService {
  async getAllBins(filters = {}) {
    const cacheKey = `bins:list:${JSON.stringify(filters)}`;
    
    const cached = await cache.cacheGet(cacheKey);
    if (cached) {
      return cached;
    }

    const bins = await binsRepository.findAll(filters);
    
    await cache.cacheSet(cacheKey, bins);
    
    return bins;
  }

  async getBinById(id) {
    const cacheKey = `bins:${id}`;
    
    const cached = await cache.cacheGet(cacheKey);
    if (cached) {
      return cached;
    }

    const bin = await binsRepository.findById(id);
    
    await cache.cacheSet(cacheKey, bin);
    
    return bin;
  }

  async createBin(data) {
    this.validateBinData(data);
    
    const bin = await binsRepository.create(data);
    
    await cache.cacheDeletePattern('bins:list:*');
    
    return bin;
  }

  async updateBin(id, data) {
    if (Object.keys(data).length === 0) {
      throw new ValidationError('No data to update');
    }

    this.validateBinData(data, true);
    
    const bin = await binsRepository.update(id, data);
    
    await cache.cacheDelete(`bins:${id}`);
    await cache.cacheDeletePattern('bins:list:*');
    await cache.cacheDeletePattern('bins:stats*');
    
    return bin;
  }

  async deleteBin(id) {
    await binsRepository.delete(id);
    
    await cache.cacheDelete(`bins:${id}`);
    await cache.cacheDeletePattern('bins:list:*');
    await cache.cacheDeletePattern('bins:stats*');

    return true;
  }

  async getStats() {
    const cacheKey = 'bins:stats:global';
    
    const cached = await cache.cacheGet(cacheKey);
    if (cached) {
      return cached;
    }

    const stats = await binsRepository.getStats();
    
    await cache.cacheSet(cacheKey, stats, 3600);
    
    return stats;
  }

  async getCriticalBins(threshold = 85) {
    const cacheKey = `bins:critical:${threshold}`;
    
    const cached = await cache.cacheGet(cacheKey);
    if (cached) {
      return cached;
    }

    const bins = await binsRepository.findCriticalBins(threshold);
    
    await cache.cacheSet(cacheKey, bins, 1800);
    
    return bins;
  }

  async getBinsByWasteType(wasteType) {
    const validTypes = ['recyclable', 'organic', 'residual', 'hazardous'];
    if (!validTypes.includes(wasteType)) {
      throw new ValidationError(`Invalid waste type: ${wasteType}`);
    }

    const cacheKey = `bins:waste:${wasteType}`;
    
    const cached = await cache.cacheGet(cacheKey);
    if (cached) {
      return cached;
    }

    const bins = await binsRepository.findByWasteType(wasteType);
    
    await cache.cacheSet(cacheKey, bins);
    
    return bins;
  }

  validateBinData(data, isUpdate = false) {
    const errors = [];

    if (!isUpdate || data.bin_code !== undefined) {
      if (!data.bin_code || typeof data.bin_code !== 'string') {
        errors.push('bin_code is required and must be a string');
      } else if (data.bin_code.length < 3 || data.bin_code.length > 50) {
        errors.push('bin_code must be between 3 and 50 characters');
      }
    }

    if (!isUpdate || data.latitude !== undefined) {
      if (data.latitude === undefined) {
        errors.push('latitude is required');
      } else if (data.latitude < -90 || data.latitude > 90) {
        errors.push('latitude must be between -90 and 90');
      }
    }

    if (!isUpdate || data.longitude !== undefined) {
      if (data.longitude === undefined) {
        errors.push('longitude is required');
      } else if (data.longitude < -180 || data.longitude > 180) {
        errors.push('longitude must be between -180 and 180');
      }
    }

    if (!isUpdate || data.waste_type !== undefined) {
      const validTypes = ['recyclable', 'organic', 'residual', 'hazardous'];
      if (!data.waste_type || !validTypes.includes(data.waste_type)) {
        errors.push(`waste_type must be one of: ${validTypes.join(', ')}`);
      }
    }

    if (!isUpdate || data.capacity_liters !== undefined) {
      if (data.capacity_liters === undefined) {
        errors.push('capacity_liters is required');
      } else if (data.capacity_liters <= 0 || data.capacity_liters > 10000) {
        errors.push('capacity_liters must be between 0 and 10000');
      }
    }

    if (data.current_fill_level !== undefined) {
      if (data.current_fill_level < 0 || data.current_fill_level > 100) {
        errors.push('current_fill_level must be between 0 and 100');
      }
    }

    if (errors.length > 0) {
      throw new ValidationError('Validation failed', errors);
    }
  }

  calculateFillPercentage(currentLevel, capacity) {
    if (!capacity || capacity <= 0) return 0;
    return Math.min(100, (currentLevel / capacity) * 100);
  }
}

module.exports = new BinsService();
