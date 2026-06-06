const { AppError } = require('./errorHandler');

/**
 * Simple request validation middleware.
 * Takes a schema object with field validators.
 */
const validate = (schema) => {
  return (req, res, next) => {
    const errors = [];

    for (const [field, rules] of Object.entries(schema)) {
      const value = req.body[field];

      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push(`${field} is required.`);
        continue;
      }

      if (value !== undefined && value !== null && value !== '') {
        if (rules.type === 'email') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            errors.push(`${field} must be a valid email address.`);
          }
        }

        if (rules.type === 'number' && isNaN(Number(value))) {
          errors.push(`${field} must be a number.`);
        }

        if (rules.minLength && String(value).length < rules.minLength) {
          errors.push(`${field} must be at least ${rules.minLength} characters.`);
        }

        if (rules.maxLength && String(value).length > rules.maxLength) {
          errors.push(`${field} must be at most ${rules.maxLength} characters.`);
        }

        if (rules.enum && !rules.enum.includes(value)) {
          errors.push(`${field} must be one of: ${rules.enum.join(', ')}.`);
        }
      }
    }

    if (errors.length > 0) {
      throw new AppError(errors.join(' '), 400);
    }

    next();
  };
};

module.exports = { validate };
