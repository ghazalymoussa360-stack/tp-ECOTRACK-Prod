const authService = require('../../src/services/auth.service');
const usersRepository = require('../../src/repositories/users.repository');
const { ValidationError, UnauthorizedError } = require('../../src/errors/appErrors');

jest.mock('../../src/repositories/users.repository');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  describe('register', () => {
    it('should register a new user with valid data', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        role: 'collector',
      };
      const createdUser = { id: 1, email: userData.email, role: userData.role };

      usersRepository.create.mockResolvedValue(createdUser);

      const result = await authService.register(userData);

      expect(result.user).toBeDefined();
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(usersRepository.create).toHaveBeenCalledWith(userData);
    });

    it('should throw ValidationError for invalid email', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123',
      };

      await expect(authService.register(invalidData)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for short password', async () => {
      const invalidData = {
        email: 'test@example.com',
        password: '123',
      };

      await expect(authService.register(invalidData)).rejects.toThrow(ValidationError);
    });
  });

  describe('login', () => {
    it('should login with valid credentials', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };
      const user = { id: 1, email: credentials.email, role: 'collector' };

      usersRepository.verifyPassword.mockResolvedValue(user);

      const result = await authService.login(credentials.email, credentials.password);

      expect(result.user).toBeDefined();
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should throw ValidationError without email or password', async () => {
      await expect(authService.login('', '')).rejects.toThrow(ValidationError);
    });
  });

  describe('validateToken', () => {
    it('should validate a valid token', async () => {
      process.env.JWT_SECRET = 'test-secret-key-for-testing-purposes';
      process.env.JWT_EXPIRES_IN = '15m';
      
      const user = { id: 1, email: 'test@example.com', role: 'collector' };
      const tokens = authService.generateTokens(user);
      
      const decoded = await authService.validateToken(tokens.accessToken);
      
      expect(decoded.userId).toBe(user.id);
      expect(decoded.email).toBe(user.email);
    });

    it('should throw UnauthorizedError for invalid token', async () => {
      await expect(authService.validateToken('invalid-token')).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('refreshToken', () => {
    it('should refresh token with valid refresh token', async () => {
      process.env.JWT_SECRET = 'test-secret-key-for-testing-purposes';
      process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing';
      process.env.JWT_EXPIRES_IN = '15m';
      process.env.JWT_REFRESH_EXPIRES_IN = '7d';
      
      const user = { id: 1, email: 'test@example.com', role: 'collector' };
      const tokens = authService.generateTokens(user);
      
      usersRepository.findById.mockResolvedValue(user);
      
      const result = await authService.refreshToken(tokens.refreshToken);
      
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(usersRepository.findById).toHaveBeenCalledWith(user.id);
    });

    it('should throw UnauthorizedError without refresh token', async () => {
      await expect(authService.refreshToken('')).rejects.toThrow(UnauthorizedError);
      await expect(authService.refreshToken(null)).rejects.toThrow(UnauthorizedError);
      await expect(authService.refreshToken(undefined)).rejects.toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError for invalid refresh token', async () => {
      await expect(authService.refreshToken('invalid-refresh-token')).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('register with role validation', () => {
    it('should accept valid roles', async () => {
      const validRoles = ['admin', 'manager', 'collector', 'analyst'];
      
      for (const role of validRoles) {
        jest.clearAllMocks();
        const userData = {
          email: `test-${role}@example.com`,
          password: 'password123',
          role: role,
        };
        const createdUser = { id: 1, email: userData.email, role: userData.role };
        usersRepository.create.mockResolvedValue(createdUser);
        
        const result = await authService.register(userData);
        expect(result.user.role).toBe(role);
      }
    });

    it('should throw ValidationError for invalid role', async () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'password123',
        role: 'invalid-role',
      };

      await expect(authService.register(invalidData)).rejects.toThrow(ValidationError);
    });
  });
});
