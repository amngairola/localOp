import { Response } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: string;
  details?: unknown;
  meta?: Record<string, unknown>;
}

export function successResponse<T>(
  res: Response,
  data: T,
  message?: string,
  meta?: Record<string, unknown>,
  statusCode: number = 200,
): Response {
  const payload: ApiResponse<T> = {
    success: true,
    data,
    ...(message ? { message } : {}),
    ...(meta ? { meta } : {}),
  };
  return res.status(statusCode).json(payload);
}

export function createdResponse<T>(res: Response, data: T, message?: string): Response {
  return successResponse(res, data, message ?? 'Created successfully', undefined, 201);
}

export function noContentResponse(res: Response): Response {
  return res.status(204).send();
}

export function errorResponse(
  res: Response,
  statusCode: number,
  message: string,
  code?: string,
  details?: unknown,
): Response {
  const payload: ApiResponse = {
    success: false,
    error: message,
    ...(code ? { code } : {}),
    ...(details !== undefined ? { details } : {}),
  };
  return res.status(statusCode).json(payload);
}

export function paginatedResponse<T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  limit: number,
  message?: string,
): Response {
  return successResponse(res, data, message, {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNext: page * limit < total,
    hasPrev: page > 1,
  });
}
