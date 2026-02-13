const binsService = require('../../src/services/bins.service');
const binsRepository = require('../../src/repositories/bins.repository');
const cache = require('../../src/utils/redis');
const { ValidationError, NotFoundError } = require('../../src/errors/appErrors');

jest.mock('../../src/repositories/bins.repository');
jest.mock('../../src/utils/redis');

describe('BinsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllBins', () => {
    it('should return bins from cache if available', async () => {
      const cachedBins = [{ id: 1, bin_code: 'BIN001' }];
      cache.cacheGet.mockResolvedValue(cachedBins);

      const result = await binsService.getAllBins();

      expect(result).toEqual(cachedBins);
      expect(cache.cacheGet).toHaveBeenCalled();
      expect(binsRepository.findAll).not.toHaveBeenCalled();
    });

    it('should fetch from repository if cache is empty', async () => {
      cache.cacheGet.mockResolvedValue(null);
      const bins = [{ id: 1, bin_code: 'BIN001' }];
      binsRepository.findAll.mockResolvedValue(bins);

      const result = await binsService.getAllBins();

      expect(result).toEqual(bins);
      expect(binsRepository.findAll).toHaveBeenCalled();
      expect(cache.cacheSet).toHaveBeenCalled();
    });
  });

  describe('getBinById', () => {
    it('should return bin from cache if available', async () => {
      const cachedBin = { id: 1, bin_code: 'BIN001' };
      cache.cacheGet.mockResolvedValue(cachedBin);

      const result = await binsService.getBinById(1);

      expect(result).toEqual(cachedBin);
      expect(binsRepository.findById).not.toHaveBeenCalled();
    });

    it('should fetch from repository if not in cache', async () => {
      cache.cacheGet.mockResolvedValue(null);
      const bin = { id: 1, bin_code: 'BIN001' };
      binsRepository.findById.mockResolvedValue(bin);

      const result = await binsService.getBinById(1);

      expect(result).toEqual(bin);
      expect(binsRepository.findById).toHaveBeenCalledWith(1);
    });
  });

  describe('createBin', () => {
    it('should create a bin with valid data', async () => {
      const binData = {
        bin_code: 'BIN001',
        latitude: 48.8566,
        longitude: 2.3522,
        waste_type: 'recyclable',
        capacity_liters: 500,
      };
      const createdBin = { id: 1, ...binData };
      
      binsRepository.create.mockResolvedValue(createdBin);
      cache.cacheDeletePattern.mockResolvedValue(true);

      const result = await binsService.createBin(binData);

      expect(result).toEqual(createdBin);
      expect(binsRepository.create).toHaveBeenCalledWith(binData);
    });

    it('should throw ValidationError with invalid data', async () => {
      const invalidData = {
        bin_code: 'B1',
        latitude: 200,
        longitude: 2.3522,
        waste_type: 'invalid_type',
        capacity_liters: -100,
      };

      await expect(binsService.createBin(invalidData)).rejects.toThrow(ValidationError);
    });
  });

  describe('updateBin', () => {
    it('should update a bin with valid data', async () => {
      const updateData = { current_fill_level: 50 };
      const updatedBin = { id: 1, current_fill_level: 50 };
      
      binsRepository.update.mockResolvedValue(updatedBin);
      cache.cacheDelete.mockResolvedValue(true);
      cache.cacheDeletePattern.mockResolvedValue(true);

      const result = await binsService.updateBin(1, updateData);

      expect(result).toEqual(updatedBin);
      expect(binsRepository.update).toHaveBeenCalledWith(1, updateData);
    });

    it('should throw ValidationError for empty update', async () => {
      await expect(binsService.updateBin(1, {})).rejects.toThrow(ValidationError);
    });
  });

  describe('deleteBin', () => {
    it('should delete a bin successfully', async () => {
      binsRepository.delete.mockResolvedValue(true);
      cache.cacheDelete.mockResolvedValue(true);
      cache.cacheDeletePattern.mockResolvedValue(true);

      const result = await binsService.deleteBin(1);

      expect(result).toBe(true);
      expect(binsRepository.delete).toHaveBeenCalledWith(1);
    });
  });

  describe('validateBinData', () => {
    it('should not throw for valid data', () => {
      const validData = {
        bin_code: 'BIN001',
        latitude: 48.8566,
        longitude: 2.3522,
        waste_type: 'recyclable',
        capacity_liters: 500,
      };

      expect(() => binsService.validateBinData(validData)).not.toThrow();
    });

    it('should throw for invalid latitude', () => {
      const invalidData = {
        bin_code: 'BIN001',
        latitude: 100,
        longitude: 2.3522,
        waste_type: 'recyclable',
        capacity_liters: 500,
      };

      expect(() => binsService.validateBinData(invalidData)).toThrow(ValidationError);
    });

    it('should throw for invalid waste type', () => {
      const invalidData = {
        bin_code: 'BIN001',
        latitude: 48.8566,
        longitude: 2.3522,
        waste_type: 'invalid',
        capacity_liters: 500,
      };

      expect(() => binsService.validateBinData(invalidData)).toThrow(ValidationError);
    });
  });

  describe('getCriticalBins', () => {
    it('should return critical bins', async () => {
      const criticalBins = [{ id: 1, current_fill_level: 90 }];
      cache.cacheGet.mockResolvedValue(null);
      binsRepository.findCriticalBins.mockResolvedValue(criticalBins);

      const result = await binsService.getCriticalBins(85);

      expect(result).toEqual(criticalBins);
      expect(binsRepository.findCriticalBins).toHaveBeenCalledWith(85);
    });
  });
});
