const Joi = require('joi');
const { ValidationError } = require('../errors/appErrors');

const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));
      return next(new ValidationError('Validation failed', errors));
    }

    req.body = value;
    next();
  };
};

const binsCreateSchema = Joi.object({
  bin_code: Joi.string().min(3).max(50).required(),
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
  waste_type: Joi.string().valid('recyclable', 'organic', 'residual', 'hazardous').required(),
  capacity_liters: Joi.number().positive().max(10000).required(),
  current_fill_level: Joi.number().min(0).max(100).default(0),
  location_name: Joi.string().max(255).optional(),
});

const binsUpdateSchema = Joi.object({
  bin_code: Joi.string().min(3).max(50),
  latitude: Joi.number().min(-90).max(90),
  longitude: Joi.number().min(-180).max(180),
  waste_type: Joi.string().valid('recyclable', 'organic', 'residual', 'hazardous'),
  capacity_liters: Joi.number().positive().max(10000),
  current_fill_level: Joi.number().min(0).max(100),
  location_name: Joi.string().max(255),
});

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('admin', 'manager', 'collector', 'analyst'),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const refreshSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

module.exports = {
  validate,
  schemas: {
    binsCreate: binsCreateSchema,
    binsUpdate: binsUpdateSchema,
    register: registerSchema,
    login: loginSchema,
    refresh: refreshSchema,
  },
};
