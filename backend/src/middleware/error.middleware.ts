import { Request, Response, NextFunction } from 'express';

export interface ApiError extends Error {
  statusCode?: number;
  errors?: any[];
}

/**
 * Custom error for validation failures (422 Unprocessable Entity)
 */
export class ValidationError extends Error {
  statusCode = 422;
  errors: string[];

  constructor(errors: string | string[]) {
    super('Validation failed');
    this.name = 'ValidationError';
    this.errors = Array.isArray(errors) ? errors : [errors];
  }
}

/**
 * Custom error for authorization failures (403 Forbidden)
 */
export class AuthorizationError extends Error {
  statusCode = 403;

  constructor(message: string = 'Forbidden') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

/**
 * Custom error for conflicts (409 Conflict)
 */
export class ConflictError extends Error {
  statusCode = 409;

  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

/**
 * Custom error for not found resources (404 Not Found)
 */
export class NotFoundError extends Error {
  statusCode = 404;

  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export function errorHandler(
  err: ApiError | ValidationError | AuthorizationError | ConflictError | NotFoundError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('Error:', err);

  // Handle ValidationError
  if (err instanceof ValidationError) {
    return res.status(422).json({
      error: err.message,
      errors: err.errors
    });
  }

  // Handle other custom errors
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    error: message,
    ...(err.errors && { errors: err.errors })
  });
}
