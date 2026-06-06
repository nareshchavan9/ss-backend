import ApiError from '../utils/ApiError.js';

/**
 * Request validation middleware using Zod
 * @param {import('zod').ZodSchema} schema Zod schema to validate against
 */
export const validate = (schema) => (req, res, next) => {
  try {
    const validatedData = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    // Replace request parts with validated and parsed data
    if (validatedData.body !== undefined) req.body = validatedData.body;
    if (validatedData.query !== undefined) req.query = validatedData.query;
    if (validatedData.params !== undefined) req.params = validatedData.params;

    next();
  } catch (error) {
    if (error.name === 'ZodError') {
      const errors = error.errors.map((err) => ({
        field: err.path.join('.').replace(/^(body|query|params)\./, ''),
        message: err.message,
      }));
      return next(new ApiError(400, 'Validation Error', errors));
    }
    next(error);
  }
};
