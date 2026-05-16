const Joi = require("joi");

const taskSchema = Joi.object({
  title: Joi.string().trim().min(3).max(30).required(),
  isCompleted: Joi.boolean().default(false).not(null),
  priority: Joi.string().valid("low", "medium", "high").default("medium"),
});

const patchTaskSchema = Joi.object({
  title: Joi.string().trim().min(3).max(30).not(null),
  isCompleted: Joi.boolean().not(null),
  priority: Joi.string()
    .valid("low", "medium", "high")
    .default("medium")
    .not(null),
})
  .min(1)
  .message("No attributes to change were specified.");

const taskPaginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).messages({
    "number.min": "Page must be one or greater.",
  }),
  limit: Joi.number().integer().min(1).max(100).default(10).messages({
    "number.min": "Limit needs to be between 1 and 100.",
    "number.max": "Limit needds to be between 1 and 100.",
  }),
}).unknown(true); //allows filtering params lioke "?find" to pass through

module.exports = { taskSchema, patchTaskSchema, taskPaginationSchema };
