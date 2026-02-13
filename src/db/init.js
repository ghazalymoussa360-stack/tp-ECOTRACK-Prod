const db = require('./database');

const initSchema = async () => {
  const client = await db.getClient();
  
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'collector',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS bins (
        id SERIAL PRIMARY KEY,
        bin_code VARCHAR(50) UNIQUE NOT NULL,
        latitude DECIMAL(10, 8) NOT NULL,
        longitude DECIMAL(11, 8) NOT NULL,
        waste_type VARCHAR(50) NOT NULL,
        capacity_liters DECIMAL(10, 2) NOT NULL,
        current_fill_level DECIMAL(5, 2) DEFAULT 0,
        location_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS measurements (
        id SERIAL PRIMARY KEY,
        bin_id INTEGER REFERENCES bins(id) ON DELETE CASCADE,
        fill_level DECIMAL(5, 2) NOT NULL,
        weight_kg DECIMAL(10, 2),
        temperature_celsius DECIMAL(5, 2),
        measured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_bins_bin_code ON bins(bin_code)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_bins_waste_type ON bins(waste_type)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_measurements_bin_id ON measurements(bin_id)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_measurements_measured_at ON measurements(measured_at)
    `);

    await client.query('COMMIT');
    console.log('Database schema initialized successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error initializing database schema:', error);
    throw error;
  } finally {
    client.release();
  }
};

const seedData = async () => {
  const bcrypt = require('bcrypt');
  
  const client = await db.getClient();
  
  try {
    await client.query('BEGIN');

    const existingUsers = await client.query('SELECT COUNT(*) FROM users');
    if (parseInt(existingUsers.rows[0].count) > 0) {
      console.log('Database already has data, skipping seed');
      await client.query('COMMIT');
      return;
    }

    const passwordHash = await bcrypt.hash('admin123', 10);
    await client.query(
      `INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3)`,
      ['admin@ecotrack.com', passwordHash, 'admin']
    );

    await client.query(
      `INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3)`,
      ['manager@ecotrack.com', passwordHash, 'manager']
    );

    await client.query(
      `INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3)`,
      ['collector@ecotrack.com', passwordHash, 'collector']
    );

    await client.query(
      `INSERT INTO bins (bin_code, latitude, longitude, waste_type, capacity_liters, current_fill_level, location_name) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      ['BIN001', 48.8566, 2.3522, 'recyclable', 500, 45, 'Paris Centre']
    );

    await client.query(
      `INSERT INTO bins (bin_code, latitude, longitude, waste_type, capacity_liters, current_fill_level, location_name) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      ['BIN002', 48.8606, 2.3376, 'organic', 300, 87, 'Paris Louvre']
    );

    await client.query(
      `INSERT INTO bins (bin_code, latitude, longitude, waste_type, capacity_liters, current_fill_level, location_name) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      ['BIN003', 48.8584, 2.2945, 'residual', 400, 23, 'Paris Tour Eiffel']
    );

    await client.query('COMMIT');
    console.log('Database seeded successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  initSchema,
  seedData,
};
