/**
 * Error handling utilities for the querier package
 *
 * This file is used to handle errors in the querier package.
 * It is used to create, handle, and validate errors.
 */
export class QuerierError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any,
  ) {
    super(message);
    this.name = 'QuerierError';
  }
}

export const createQuerierError = (
  message: string,
  code: string,
  statusCode: number = 500,
  details?: any,
): QuerierError => {
  return new QuerierError(message, code, statusCode, details);
};

export const handleQuerierError = (error: unknown): QuerierError => {
  if (error instanceof QuerierError) {
    return error;
  }

  if (error instanceof Error) {
    return new QuerierError(error.message, 'UNKNOWN_ERROR', 500);
  }

  return new QuerierError('An unknown error occurred', 'UNKNOWN_ERROR', 500);
};

export const isQuerierError = (error: unknown): error is QuerierError => {
  return error instanceof QuerierError;
};
