const { AppError } = require('./errorHandler');

const isUuid = (value) => (
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value))
);

const validateField = (field, value, rules, errors) => {
  if (rules.required && (value === undefined || value === null || value === '')) {
    errors.push(`${field} is required.`);
    return;
  }

  if (value === undefined || value === null || value === '') return;

  if (rules.type === 'email') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) errors.push(`${field} must be a valid email address.`);
  }

  if (rules.type === 'number') {
    const numberValue = Number(value);
    if (Number.isNaN(numberValue)) errors.push(`${field} must be a number.`);
    if (rules.min !== undefined && numberValue < rules.min) errors.push(`${field} must be at least ${rules.min}.`);
    if (rules.max !== undefined && numberValue > rules.max) errors.push(`${field} must be at most ${rules.max}.`);
  }

  if (rules.type === 'uuid' && !isUuid(value)) errors.push(`${field} must be a valid UUID.`);

  if (rules.type === 'date' && Number.isNaN(Date.parse(value))) errors.push(`${field} must be a valid date.`);

  if (rules.type === 'boolean' && typeof value !== 'boolean') {
    errors.push(`${field} must be a boolean.`);
  }

  if (rules.type === 'array') {
    if (!Array.isArray(value)) {
      errors.push(`${field} must be an array.`);
    } else {
      if (rules.minItems !== undefined && value.length < rules.minItems) {
        errors.push(`${field} must contain at least ${rules.minItems} item(s).`);
      }
      if (rules.items) {
        value.forEach((item, index) => {
          for (const [childField, childRules] of Object.entries(rules.items)) {
            validateField(`${field}[${index}].${childField}`, item?.[childField], childRules, errors);
          }
        });
      }
      if (rules.itemType) {
        value.forEach((item, index) => {
          validateField(`${field}[${index}]`, item, { type: rules.itemType }, errors);
        });
      }
    }
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
};

/**
 * Simple request validation middleware.
 * Takes a schema object with field validators.
 */
const validate = (schema) => {
  return (req, res, next) => {
    const errors = [];

    for (const [field, rules] of Object.entries(schema)) {
      validateField(field, req.body[field], rules, errors);
    }

    if (errors.length > 0) {
      throw new AppError(errors.join(' '), 400);
    }

    next();
  };
};

module.exports = { validate };
