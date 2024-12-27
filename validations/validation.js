const Joi = require('joi');

const saveDataSchema = Joi.object({
    name: Joi.string().min(3).required().messages({
        'string.empty': 'Name cannot be empty.',
        'string.min': 'Name must be at least 3 characters long.',
        'any.required': 'Name is required.',
    }),
    email: Joi.string().email().required().messages({
        'string.empty': 'Email cannot be empty.',
        'string.email': 'Email must be a valid email address.',
        'any.required': 'Email is required.',
    }),
});

module.exports = {
    saveDataSchema,
};