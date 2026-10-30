/**
 * API Error Types – FreshG (Sprint 05: Error Handling & Reliability)
 */

export type ApiErrorType =
  | 'OFFLINE'        // Perangkat tidak memiliki koneksi internet
  | 'TIMEOUT'        // Request melebihi batas waktu maksimal
  | 'CLIENT_ERROR'   // HTTP 4xx (400, 401, 403, 404)
  | 'SERVER_ERROR'   // HTTP 5xx (500, 502, 503)
  | 'NETWORK_ERROR'; // Kegagalan koneksi umum / DNS / socket

export class ApiError extends Error {
  public readonly type: ApiErrorType;
  public readonly statusCode?: number;
  public readonly userFriendlyMessage: string;

  constructor(
    type: ApiErrorType,
    message: string,
    statusCode?: number,
    userFriendlyMessage?: string
  ) {
    super(message);
    this.name = 'ApiError';
    this.type = type;
    this.statusCode = statusCode;
    this.userFriendlyMessage = userFriendlyMessage || message;

    // Menjaga prototype chain yang benar untuk instance TypeScript
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  static isApiError(error: unknown): error is ApiError {
    return error instanceof ApiError;
  }
}

