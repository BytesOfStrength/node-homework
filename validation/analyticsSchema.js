const Joi = require("joi");
const analyticsPaginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).messages({
    "number.min": "Page must be one or greater.",
  }),
  limit: Joi.number().integer().min(1).max(100).default(10).messages({
    "number.min": "Limit needs to be between 1 and 100.",
    "number.max": "Limit needs to be between 1 and 100.",
  }),
}).unknown(true); //allows filtering params lioke "?find" to pass through

const analyticsSearchSchema = Joi.object({
  q: Joi.string().trim().min(2).required().messages({
    "string.min": "Search query must be at least 2 characters long",
    "any.required": "Search query parameter 'q' is requerired",
  }),
  limit: Joi.number().integer().min(1).max(100).default(20).messages({
    "number.min": "Limit needs to be between 1 and 100.",
    "number.max": "Limit needs to be between 1 and 100.",
  }),
}).unknown(true);

module.exports = { analyticsPaginationSchema, analyticsSearchSchema };
