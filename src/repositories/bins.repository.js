const db = require('../db/database');
const { NotFoundError, ConflictError } = require('../errors/appErrors');

class BinsRepository {
  async findAll(filters = {}) {
    let query = 'SELECT * FROM bins WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (filters.wasteType) {
      query += ` AND waste_type = $${paramIndex}`;
      params.push(filters.wasteType);
      paramIndex++;
    }

    if (filters.minFillLevel) {
      query += ` AND current_fill_level >= $${paramIndex}`;
      params.push(filters.minFillLevel);
      paramIndex++;
    }

    if (filters.maxFillLevel) {
      query += ` AND current_fill_level <= $${paramIndex}`;
      params.push(filters.maxFillLevel);
      paramIndex++;
    }

    query += ' ORDER BY created_at DESC';

    if (filters.limit) {
      query += ` LIMIT $${paramIndex}`;
      params.push(filters.limit);
      paramIndex++;
    }

    if (filters.offset) {
      query += ` OFFSET $${paramIndex}`;
      params.push(filters.offset);
    }

    const result = await db.query(query, params);
    return result.rows;
  }

  async findById(id) {
    const result = await db.query('SELECT * FROM bins WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      throw new NotFoundError(`Bin with id ${id} not found`);
    }
    return result.rows[0];
  }

  async findByCode(binCode) {
    const result = await db.query('SELECT * FROM bins WHERE bin_code = $1', [binCode]);
    return result.rows[0] || null;
  }

  async create(data) {
    const existing = await this.findByCode(data.bin_code);
    if (existing) {
      throw new ConflictError(`Bin with code ${data.bin_code} already exists`);
    }

    const result = await db.query(
      `INSERT INTO bins (bin_code, latitude, longitude, waste_type, capacity_liters, current_fill_level, location_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        data.bin_code,
        data.latitude,
        data.longitude,
        data.waste_type,
        data.capacity_liters,
        data.current_fill_level || 0,
        data.location_name,
      ]
    );
    return result.rows[0];
  }

  async update(id, data) {
    await this.findById(id);

    const fields = [];
    const params = [];
    let paramIndex = 1;

    if (data.bin_code !== undefined) {
      fields.push(`bin_code = $${paramIndex}`);
      params.push(data.bin_code);
      paramIndex++;
    }
    if (data.latitude !== undefined) {
      fields.push(`latitude = $${paramIndex}`);
      params.push(data.latitude);
      paramIndex++;
    }
    if (data.longitude !== undefined) {
      fields.push(`longitude = $${paramIndex}`);
      params.push(data.longitude);
      paramIndex++;
    }
    if (data.waste_type !== undefined) {
      fields.push(`waste_type = $${paramIndex}`);
      params.push(data.waste_type);
      paramIndex++;
    }
    if (data.capacity_liters !== undefined) {
      fields.push(`capacity_liters = $${paramIndex}`);
      params.push(data.capacity_liters);
      paramIndex++;
    }
    if (data.current_fill_level !== undefined) {
      fields.push(`current_fill_level = $${paramIndex}`);
      params.push(data.current_fill_level);
      paramIndex++;
    }
    if (data.location_name !== undefined) {
      fields.push(`location_name = $${paramIndex}`);
      params.push(data.location_name);
      paramIndex++;
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);

    params.push(id);

    const query = `UPDATE bins SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    const result = await db.query(query, params);
    return result.rows[0];
  }

  async delete(id) {
    await this.findById(id);
    await db.query('DELETE FROM bins WHERE id = $1', [id]);
    return true;
  }

  async getStats() {
    const result = await db.query(`
      SELECT 
        COUNT(*) as total_bins,
        AVG(current_fill_level) as avg_fill_level,
        MAX(current_fill_level) as max_fill_level,
        MIN(current_fill_level) as min_fill_level,
        COUNT(*) FILTER (WHERE current_fill_level > 85) as critical_bins,
        COUNT(*) FILTER (WHERE current_fill_level > 50) as half_full_bins
      FROM bins
    `);
    return result.rows[0];
  }

  async findByWasteType(wasteType) {
    const result = await db.query(
      'SELECT * FROM bins WHERE waste_type = $1 ORDER BY current_fill_level DESC',
      [wasteType]
    );
    return result.rows;
  }

  async findCriticalBins(threshold = 85) {
    const result = await db.query(
      'SELECT * FROM bins WHERE current_fill_level > $1 ORDER BY current_fill_level DESC',
      [threshold]
    );
    return result.rows;
  }
}

module.exports = new BinsRepository();
