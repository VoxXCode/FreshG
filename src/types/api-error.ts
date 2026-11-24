export type ApiErrorType =
  | 'OFFLINE'
  | 'TIMEOUT'
  | 'CLIENT_ERROR'
  | 'SERVER_ERROR'
  | 'NETWORK_ERROR';

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

    Object.setPrototypeOf(this, ApiError.prototype);
  }

  static isApiError(error: unknown): error is ApiError {
    return error instanceof ApiError;
  }
}

