const { AppError, ValidationError, NotFoundError } = require('../../src/errors/appErrors');

describe('Error Classes', () => {
  describe('AppError', () => {
    it('should create an error with default values', () => {
      const error = new AppError('Test error');
      
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('INTERNAL_ERROR');
      expect(error.isOperational).toBe(true);
    });

    it('should create an error with custom values', () => {
      const error = new AppError('Custom error', 400, 'CUSTOM_ERROR');
      
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('CUSTOM_ERROR');
    });
  });

  describe('ValidationError', () => {
    it('should create a validation error with errors array', () => {
      const errors = [{ field: 'email', message: 'Invalid email' }];
      const error = new ValidationError('Validation failed', errors);
      
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.errors).toEqual(errors);
    });
  });

  describe('NotFoundError', () => {
    it('should create a not found error', () => {
      const error = new NotFoundError('User not found');
      
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
      expect(error.message).toBe('User not found');
    });

    it('should have default message', () => {
      const error = new NotFoundError();
      
      expect(error.message).toBe('Resource not found');
    });
  });
});
