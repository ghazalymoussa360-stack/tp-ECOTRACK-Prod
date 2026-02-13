const db = require('../db/database');
const bcrypt = require('bcrypt');
const { NotFoundError, ConflictError, UnauthorizedError } = require('../errors/appErrors');

class UsersRepository {
  async findById(id) {
    const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      throw new NotFoundError('User not found');
    }
    return result.rows[0];
  }

  async findByEmail(email) {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] || null;
  }

  async create(data) {
    const existing = await this.findByEmail(data.email);
    if (existing) {
      throw new ConflictError('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const result = await db.query(
      `INSERT INTO users (email, password_hash, role)
       VALUES ($1, $2, $3)
       RETURNING id, email, role, created_at`,
      [data.email, passwordHash, data.role || 'collector']
    );
    return result.rows[0];
  }

  async verifyPassword(email, password) {
    const user = await this.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }

  async getAll() {
    const result = await db.query(
      'SELECT id, email, role, created_at FROM users ORDER BY created_at DESC'
    );
    return result.rows;
  }

  async updateRole(id, role) {
    await this.findById(id);
    
    const result = await db.query(
      `UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2
       RETURNING id, email, role`,
      [role, id]
    );
    return result.rows[0];
  }
}

module.exports = new UsersRepository();
