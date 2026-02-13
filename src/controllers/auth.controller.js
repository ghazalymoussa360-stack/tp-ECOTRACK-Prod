const authService = require('../services/auth.service');
const logger = require('../utils/logger');

class AuthController {
  async register(req, res, next) {
    try {
      const result = await authService.register(req.body);
      
      logger.info(`User registered: ${result.user.email}`);
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      
      const result = await authService.login(email, password);
      
      logger.info(`User logged in: ${email}`);
      
      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.body;
      
      const tokens = await authService.refreshToken(refreshToken);
      
      res.status(200).json({
        success: true,
        message: 'Token refreshed',
        data: tokens,
      });
    } catch (error) {
      next(error);
    }
  }

  async me(req, res, next) {
    try {
      res.status(200).json({
        success: true,
        data: req.user,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
