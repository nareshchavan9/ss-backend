import winston from 'winston';
import ApiError from '../utils/ApiError.js';

const errorHandler = (err, req, res, next) => {
  let error = err;

  // If the error is not an instance of ApiError, classify it
  if (!(error instanceof ApiError)) {
    let statusCode = error.statusCode || 500;
    let message = error.message || 'Internal Server Error';
    let errors = [];

    // Mongoose Validation Error
    if (error.name === 'ValidationError') {
      statusCode = 400;
      message = 'Validation Error';
      errors = Object.values(error.errors).map((el) => ({
        field: el.path,
        message: el.message,
      }));
    }
    // Mongoose Cast Error (e.g. invalid ObjectId)
    else if (error.name === 'CastError') {
      statusCode = 400;
      message = `Invalid ${error.path}: ${error.value}`;
    }
    // Mongoose Duplicate Key Error
    else if (error.code === 11000) {
      statusCode = 400;
      const fieldName = Object.keys(error.keyValue)[0];
      message = `Duplicate field value entered: ${fieldName}`;
      errors = [{
        field: fieldName,
        message: `${fieldName} already exists`,
      }];
    }
    // JWT Error
    else if (error.name === 'JsonWebTokenError') {
      statusCode = 401;
      message = 'Invalid token. Please log in again.';
    }
    // JWT Expired Error
    else if (error.name === 'TokenExpiredError') {
      statusCode = 401;
      message = 'Your session has expired. Please log in again.';
    }

    error = new ApiError(statusCode, message, errors, err.stack);
  }

  // Log error
  if (process.env.NODE_ENV === 'production') {
    winston.error(`${error.statusCode} - ${error.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  } else {
    console.error(error);
  }

  const response = {
    success: false,
    message: error.message,
    errors: error.errors,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  };

  res.status(error.statusCode).json(response);
};

export default errorHandler;
