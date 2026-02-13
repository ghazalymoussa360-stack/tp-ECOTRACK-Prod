const usersRepository = require('../../src/repositories/users.repository');
const db = require('../../src/db/database');
const bcrypt = require('bcrypt');
const { NotFoundError, ConflictError, UnauthorizedError } = require('../../src/errors/appErrors');

jest.mock('../../src/db/database');
jest.mock('bcrypt');

describe('UsersRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should find user by id', async () => {
      const user = { id: 1, email: 'test@example.com', role: 'collector' };
      db.query.mockResolvedValue({ rows: [user] });

      const result = await usersRepository.findById(1);

      expect(result).toEqual(user);
      expect(db.query).toHaveBeenCalledWith('SELECT * FROM users WHERE id = $1', [1]);
    });

    it('should throw NotFoundError when user not found', async () => {
      db.query.mockResolvedValue({ rows: [] });

      await expect(usersRepository.findById(999)).rejects.toThrow(NotFoundError);
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const user = { id: 1, email: 'test@example.com', role: 'collector' };
      db.query.mockResolvedValue({ rows: [user] });

      const result = await usersRepository.findByEmail('test@example.com');

      expect(result).toEqual(user);
    });

    it('should return null when user not found', async () => {
      db.query.mockResolvedValue({ rows: [] });

      const result = await usersRepository.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const userData = {
        email: 'new@example.com',
        password: 'password123',
        role: 'collector',
      };
      const createdUser = { id: 1, email: userData.email, role: userData.role };
      
      db.query.mockResolvedValueOnce({ rows: [] }); // findByEmail returns null
      bcrypt.hash.mockResolvedValue('hashedpassword');
      db.query.mockResolvedValueOnce({ rows: [createdUser] });

      const result = await usersRepository.create(userData);

      expect(result).toEqual(createdUser);
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
    });

    it('should throw ConflictError when email already exists', async () => {
      const existingUser = { id: 1, email: 'existing@example.com', role: 'collector' };
      db.query.mockResolvedValue({ rows: [existingUser] });

      await expect(usersRepository.create({
        email: 'existing@example.com',
        password: 'password123',
      })).rejects.toThrow(ConflictError);
    });

    it('should use default role when not provided', async () => {
      const userData = {
        email: 'new@example.com',
        password: 'password123',
      };
      const createdUser = { id: 1, email: userData.email, role: 'collector' };
      
      db.query.mockResolvedValueOnce({ rows: [] });
      bcrypt.hash.mockResolvedValue('hashedpassword');
      db.query.mockResolvedValueOnce({ rows: [createdUser] });

      await usersRepository.create(userData);

      expect(db.query).toHaveBeenLastCalledWith(
        expect.stringContaining('INSERT INTO users'),
        expect.arrayContaining([userData.email, 'hashedpassword', 'collector'])
      );
    });
  });

  describe('verifyPassword', () => {
    it('should verify valid password', async () => {
      const user = {
        id: 1,
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        role: 'collector',
      };
      db.query.mockResolvedValue({ rows: [user] });
      bcrypt.compare.mockResolvedValue(true);

      const result = await usersRepository.verifyPassword('test@example.com', 'password123');

      expect(result).toEqual({
        id: user.id,
        email: user.email,
        role: user.role,
      });
    });

    it('should throw UnauthorizedError for non-existent user', async () => {
      db.query.mockResolvedValue({ rows: [] });

      await expect(usersRepository.verifyPassword('nonexistent@example.com', 'password'))
        .rejects.toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError for invalid password', async () => {
      const user = {
        id: 1,
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        role: 'collector',
      };
      db.query.mockResolvedValue({ rows: [user] });
      bcrypt.compare.mockResolvedValue(false);

      await expect(usersRepository.verifyPassword('test@example.com', 'wrongpassword'))
        .rejects.toThrow(UnauthorizedError);
    });
  });

  describe('getAll', () => {
    it('should get all users', async () => {
      const users = [
        { id: 1, email: 'user1@example.com', role: 'collector' },
        { id: 2, email: 'user2@example.com', role: 'admin' },
      ];
      db.query.mockResolvedValue({ rows: users });

      const result = await usersRepository.getAll();

      expect(result).toEqual(users);
      expect(db.query).toHaveBeenCalledWith(
        'SELECT id, email, role, created_at FROM users ORDER BY created_at DESC'
      );
    });

    it('should return empty array when no users', async () => {
      db.query.mockResolvedValue({ rows: [] });

      const result = await usersRepository.getAll();

      expect(result).toEqual([]);
    });
  });

  describe('updateRole', () => {
    it('should update user role', async () => {
      const user = { id: 1, email: 'test@example.com', role: 'admin' };
      db.query.mockResolvedValueOnce({ rows: [user] }); // findById
      db.query.mockResolvedValueOnce({ rows: [{ id: 1, email: 'test@example.com', role: 'manager' }] });

      const result = await usersRepository.updateRole(1, 'manager');

      expect(result.role).toBe('manager');
    });

    it('should throw NotFoundError when user not found', async () => {
      db.query.mockResolvedValue({ rows: [] });

      await expect(usersRepository.updateRole(999, 'admin')).rejects.toThrow(NotFoundError);
    });
  });
});
