const jwt = require('jsonwebtoken');
const usersRepository = require('../repositories/users.repository');
const config = require('../config');
const { ValidationError, UnauthorizedError } = require('../errors/appErrors');

class AuthService {
  async register(data) {
    const errors = [];

    if (!data.email || !data.email.includes('@')) {
      errors.push('Valid email is required');
    }

    if (!data.password || data.password.length < 6) {
      errors.push('Password must be at least 6 characters');
    }

    const validRoles = ['admin', 'manager', 'collector', 'analyst'];
    if (data.role && !validRoles.includes(data.role)) {
      errors.push(`Role must be one of: ${validRoles.join(', ')}`);
    }

    if (errors.length > 0) {
      throw new ValidationError('Validation failed', errors);
    }

    const user = await usersRepository.create(data);
    
    const tokens = this.generateTokens(user);
    
    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      ...tokens,
    };
  }

  async login(email, password) {
    if (!email || !password) {
      throw new ValidationError('Email and password are required');
    }

    const user = await usersRepository.verifyPassword(email, password);
    
    const tokens = this.generateTokens(user);
    
    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      ...tokens,
    };
  }

  async refreshToken(refreshToken) {
    if (!refreshToken) {
      throw new UnauthorizedError('Refresh token is required');
    }

    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
      
      const user = await usersRepository.findById(decoded.userId);
      
      const tokens = this.generateTokens(user);
      
      return tokens;
    } catch (error) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
  }

  generateTokens(user) {
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiresIn }
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: config.jwt.expiresIn,
    };
  }

  async validateToken(token) {
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      return decoded;
    } catch (error) {
      throw new UnauthorizedError('Invalid or expired token');
    }
  }
}

module.exports = new AuthService();
