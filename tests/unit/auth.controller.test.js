const authController = require('../../src/controllers/auth.controller');
const authService = require('../../src/services/auth.service');
const { UnauthorizedError, ValidationError } = require('../../src/errors/appErrors');

jest.mock('../../src/services/auth.service');

describe('AuthController', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      body: {},
      user: null,
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      req.body = {
        email: 'test@example.com',
        password: 'password123',
        role: 'collector',
      };
      const result = {
        user: { id: 1, email: 'test@example.com', role: 'collector' },
        accessToken: 'token',
        refreshToken: 'refresh',
      };
      authService.register.mockResolvedValue(result);

      await authController.register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'User registered successfully',
        data: result,
      });
    });

    it('should handle registration errors', async () => {
      req.body = { email: 'test@example.com', password: '123' };
      const error = new ValidationError('Validation failed');
      authService.register.mockRejectedValue(error);

      await authController.register(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('login', () => {
    it('should login successfully', async () => {
      req.body = { email: 'test@example.com', password: 'password123' };
      const result = {
        user: { id: 1, email: 'test@example.com', role: 'collector' },
        accessToken: 'token',
        refreshToken: 'refresh',
      };
      authService.login.mockResolvedValue(result);

      await authController.login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Login successful',
        data: result,
      });
    });

    it('should handle login errors', async () => {
      req.body = { email: 'test@example.com', password: 'wrong' };
      const error = new UnauthorizedError('Invalid credentials');
      authService.login.mockRejectedValue(error);

      await authController.login(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('refresh', () => {
    it('should refresh token successfully', async () => {
      req.body = { refreshToken: 'valid-refresh-token' };
      const tokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: '15m',
      };
      authService.refreshToken.mockResolvedValue(tokens);

      await authController.refresh(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Token refreshed',
        data: tokens,
      });
    });

    it('should handle refresh token errors', async () => {
      req.body = { refreshToken: 'invalid-token' };
      const error = new UnauthorizedError('Invalid refresh token');
      authService.refreshToken.mockRejectedValue(error);

      await authController.refresh(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('me', () => {
    it('should return current user', async () => {
      req.user = { id: 1, email: 'test@example.com', role: 'collector' };

      await authController.me(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: req.user,
      });
    });

    it('should handle errors in me', async () => {
      req.user = { id: 1, email: 'test@example.com', role: 'collector' };
      const error = new Error('Unexpected error');
      res.json.mockImplementationOnce(() => { throw error; });

      await authController.me(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
