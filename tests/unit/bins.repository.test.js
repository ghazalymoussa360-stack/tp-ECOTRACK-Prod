const binsRepository = require('../../src/repositories/bins.repository');
const db = require('../../src/db/database');
const { NotFoundError, ConflictError } = require('../../src/errors/appErrors');

jest.mock('../../src/db/database');

describe('BinsRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should find all bins without filters', async () => {
      const bins = [{ id: 1, bin_code: 'BIN001' }, { id: 2, bin_code: 'BIN002' }];
      db.query.mockResolvedValue({ rows: bins });

      const result = await binsRepository.findAll();

      expect(result).toEqual(bins);
    });

    it('should find bins with waste type filter', async () => {
      const bins = [{ id: 1, bin_code: 'BIN001', waste_type: 'recyclable' }];
      db.query.mockResolvedValue({ rows: bins });

      const result = await binsRepository.findAll({ wasteType: 'recyclable' });

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('waste_type = $1'),
        expect.arrayContaining(['recyclable'])
      );
      expect(result).toEqual(bins);
    });

    it('should find bins with min fill level filter', async () => {
      const bins = [{ id: 1, bin_code: 'BIN001', current_fill_level: 80 }];
      db.query.mockResolvedValue({ rows: bins });

      const result = await binsRepository.findAll({ minFillLevel: 50 });

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('current_fill_level >= $1'),
        expect.arrayContaining([50])
      );
    });

    it('should find bins with max fill level filter', async () => {
      const bins = [{ id: 1, bin_code: 'BIN001', current_fill_level: 40 }];
      db.query.mockResolvedValue({ rows: bins });

      const result = await binsRepository.findAll({ maxFillLevel: 50 });

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('current_fill_level <= $1'),
        expect.arrayContaining([50])
      );
    });

    it('should find bins with limit and offset', async () => {
      const bins = [{ id: 1, bin_code: 'BIN001' }];
      db.query.mockResolvedValue({ rows: bins });

      const result = await binsRepository.findAll({ limit: 10, offset: 5 });

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT $1'),
        expect.arrayContaining([10, 5])
      );
    });

    it('should find bins with all filters', async () => {
      const bins = [{ id: 1, bin_code: 'BIN001' }];
      db.query.mockResolvedValue({ rows: bins });

      await binsRepository.findAll({
        wasteType: 'recyclable',
        minFillLevel: 30,
        maxFillLevel: 80,
        limit: 10,
        offset: 0,
      });

      expect(db.query).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should find bin by id', async () => {
      const bin = { id: 1, bin_code: 'BIN001' };
      db.query.mockResolvedValue({ rows: [bin] });

      const result = await binsRepository.findById(1);

      expect(result).toEqual(bin);
    });

    it('should throw NotFoundError when bin not found', async () => {
      db.query.mockResolvedValue({ rows: [] });

      await expect(binsRepository.findById(999)).rejects.toThrow(NotFoundError);
    });
  });

  describe('findByCode', () => {
    it('should find bin by code', async () => {
      const bin = { id: 1, bin_code: 'BIN001' };
      db.query.mockResolvedValue({ rows: [bin] });

      const result = await binsRepository.findByCode('BIN001');

      expect(result).toEqual(bin);
    });

    it('should return null when bin not found', async () => {
      db.query.mockResolvedValue({ rows: [] });

      const result = await binsRepository.findByCode('NONEXISTENT');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new bin', async () => {
      const binData = {
        bin_code: 'BIN003',
        latitude: 48.8566,
        longitude: 2.3522,
        waste_type: 'recyclable',
        capacity_liters: 500,
      };
      const createdBin = { id: 3, ...binData, current_fill_level: 0 };
      
      db.query.mockResolvedValueOnce({ rows: [] }); // findByCode returns null
      db.query.mockResolvedValueOnce({ rows: [createdBin] });

      const result = await binsRepository.create(binData);

      expect(result).toEqual(createdBin);
    });

    it('should throw ConflictError when bin code already exists', async () => {
      const existingBin = { id: 1, bin_code: 'BIN001' };
      db.query.mockResolvedValue({ rows: [existingBin] });

      await expect(binsRepository.create({ bin_code: 'BIN001' }))
        .rejects.toThrow(ConflictError);
    });

    it('should use default fill level when not provided', async () => {
      const binData = {
        bin_code: 'BIN004',
        latitude: 48.8566,
        longitude: 2.3522,
        waste_type: 'organic',
        capacity_liters: 300,
      };
      const createdBin = { id: 4, ...binData, current_fill_level: 0 };
      
      db.query.mockResolvedValueOnce({ rows: [] });
      db.query.mockResolvedValueOnce({ rows: [createdBin] });

      await binsRepository.create(binData);

      expect(db.query).toHaveBeenLastCalledWith(
        expect.stringContaining('INSERT INTO bins'),
        expect.arrayContaining([0])
      );
    });
  });

  describe('update', () => {
    it('should update bin with all fields', async () => {
      const existingBin = { id: 1, bin_code: 'BIN001' };
      const updatedBin = { id: 1, bin_code: 'BIN001-UPDATED', latitude: 49.0, longitude: 3.0, waste_type: 'organic', capacity_liters: 600, current_fill_level: 50, location_name: 'New Location' };
      
      db.query.mockResolvedValueOnce({ rows: [existingBin] }); // findById
      db.query.mockResolvedValueOnce({ rows: [updatedBin] });

      const result = await binsRepository.update(1, {
        bin_code: 'BIN001-UPDATED',
        latitude: 49.0,
        longitude: 3.0,
        waste_type: 'organic',
        capacity_liters: 600,
        current_fill_level: 50,
        location_name: 'New Location',
      });

      expect(result).toEqual(updatedBin);
    });

    it('should update bin with partial fields', async () => {
      const existingBin = { id: 1, bin_code: 'BIN001' };
      const updatedBin = { id: 1, bin_code: 'BIN001', current_fill_level: 75 };
      
      db.query.mockResolvedValueOnce({ rows: [existingBin] });
      db.query.mockResolvedValueOnce({ rows: [updatedBin] });

      const result = await binsRepository.update(1, { current_fill_level: 75 });

      expect(result.current_fill_level).toBe(75);
    });

    it('should throw NotFoundError when bin not found', async () => {
      db.query.mockResolvedValue({ rows: [] });

      await expect(binsRepository.update(999, { current_fill_level: 50 }))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('delete', () => {
    it('should delete bin successfully', async () => {
      const bin = { id: 1, bin_code: 'BIN001' };
      db.query.mockResolvedValueOnce({ rows: [bin] }); // findById
      db.query.mockResolvedValueOnce({ rows: [] }); // DELETE

      const result = await binsRepository.delete(1);

      expect(result).toBe(true);
    });

    it('should throw NotFoundError when bin not found', async () => {
      db.query.mockResolvedValue({ rows: [] });

      await expect(binsRepository.delete(999)).rejects.toThrow(NotFoundError);
    });
  });

  describe('getStats', () => {
    it('should get bin statistics', async () => {
      const stats = {
        total_bins: '10',
        avg_fill_level: '55.5',
        max_fill_level: '95',
        min_fill_level: '10',
        critical_bins: '2',
        half_full_bins: '5',
      };
      db.query.mockResolvedValue({ rows: [stats] });

      const result = await binsRepository.getStats();

      expect(result).toEqual(stats);
    });
  });

  describe('findByWasteType', () => {
    it('should find bins by waste type', async () => {
      const bins = [
        { id: 1, bin_code: 'BIN001', waste_type: 'recyclable', current_fill_level: 80 },
        { id: 2, bin_code: 'BIN002', waste_type: 'recyclable', current_fill_level: 60 },
      ];
      db.query.mockResolvedValue({ rows: bins });

      const result = await binsRepository.findByWasteType('recyclable');

      expect(result).toEqual(bins);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('waste_type = $1'),
        ['recyclable']
      );
    });

    it('should return empty array when no bins found', async () => {
      db.query.mockResolvedValue({ rows: [] });

      const result = await binsRepository.findByWasteType('nonexistent');

      expect(result).toEqual([]);
    });
  });

  describe('findCriticalBins', () => {
    it('should find critical bins with default threshold', async () => {
      const bins = [
        { id: 1, bin_code: 'BIN001', current_fill_level: 90 },
        { id: 2, bin_code: 'BIN002', current_fill_level: 95 },
      ];
      db.query.mockResolvedValue({ rows: bins });

      const result = await binsRepository.findCriticalBins();

      expect(result).toEqual(bins);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('current_fill_level > $1'),
        [85]
      );
    });

    it('should find critical bins with custom threshold', async () => {
      const bins = [{ id: 1, bin_code: 'BIN001', current_fill_level: 75 }];
      db.query.mockResolvedValue({ rows: bins });

      const result = await binsRepository.findCriticalBins(70);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('current_fill_level > $1'),
        [70]
      );
    });
  });
});
