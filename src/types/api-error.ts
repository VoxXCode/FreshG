/**
 * Definisi tipe dan kelas ApiError standar untuk aplikasi FreshG.
 * Menyediakan pemisahan antara pesan teknis (untuk debugging) dan pesan pengguna (ramah UI).
 */

export type ApiErrorCode =
  | 'OFFLINE_ERROR'
  | 'NETWORK_ERROR'
  | 'TIMEOUT_ERROR'
  | 'SERVER_ERROR'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'UNKNOWN_ERROR';

export interface ApiErrorOptions {
  code: ApiErrorCode;
  statusCode?: number;
  userMessage?: string;
  technicalMessage?: string;
  retryable?: boolean;
  cause?: unknown;
}

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly statusCode?: number;
  readonly userMessage: string;
  readonly technicalMessage: string;
  readonly retryable: boolean;
  readonly timestamp: Date;
  override readonly cause?: unknown;

  constructor(message: string, options: ApiErrorOptions) {
    super(message);
    this.name = 'ApiError';
    this.code = options.code;
    this.statusCode = options.statusCode;
    this.technicalMessage = options.technicalMessage ?? message;
    this.retryable = options.retryable ?? true;
    this.timestamp = new Date();
    this.cause = options.cause;

    // Pesan ramah pengguna dalam Bahasa Indonesia sesuai konteks FreshG
    this.userMessage =
      options.userMessage ?? ApiError.getDefaultUserMessage(options.code, options.statusCode);

    // Mempertahankan prototype chain
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  static getDefaultUserMessage(code: ApiErrorCode, statusCode?: number): string {
    switch (code) {
      case 'OFFLINE_ERROR':
        return 'Perangkat Anda sedang offline. Mohon periksa koneksi Wi-Fi atau data seluler Anda.';
      case 'TIMEOUT_ERROR':
        return 'Koneksi melebihi batas waktu (timeout). Server membutuhkan waktu terlalu lama merespons.';
      case 'NETWORK_ERROR':
        return 'Gagal terhubung ke server. Periksa stabilitas koneksi internet Anda.';
      case 'SERVER_ERROR':
        return `Server sedang mengalami gangguan${statusCode ? ` (${statusCode})` : ''}. Tim teknis sedang menanganinya.`;
      case 'NOT_FOUND':
        return 'Data yang diminta tidak ditemukan di server.';
      case 'VALIDATION_ERROR':
        return 'Format permintaan tidak sesuai dengan spesifikasi server.';
      case 'UNKNOWN_ERROR':
      default:
        return 'Terjadi kendala yang tidak terduga saat memproses data. Silakan coba kembali.';
    }
  }

  static offline(details?: string): ApiError {
    return new ApiError('Perangkat sedang offline', {
      code: 'OFFLINE_ERROR',
      statusCode: 0,
      userMessage: 'Perangkat Anda sedang offline. Mohon periksa koneksi Wi-Fi atau data seluler Anda.',
      technicalMessage: details ?? 'No active network connection detected',
      retryable: true,
    });
  }

  static network(details?: string, cause?: unknown): ApiError {
    return new ApiError('Kegagalan jaringan komunikasi', {
      code: 'NETWORK_ERROR',
      statusCode: 0,
      technicalMessage: details ?? 'Network connection failed or unreachable',
      retryable: true,
      cause,
    });
  }

  static timeout(ms = 8000): ApiError {
    return new ApiError(`Request timeout setelah ${ms}ms`, {
      code: 'TIMEOUT_ERROR',
      statusCode: 408,
      technicalMessage: `Request exceeded threshold of ${ms}ms`,
      retryable: true,
    });
  }

  static server(statusCode = 500, details?: string): ApiError {
    return new ApiError(`Internal Server Error (${statusCode})`, {
      code: 'SERVER_ERROR',
      statusCode,
      technicalMessage: details ?? `Server returned HTTP status ${statusCode}`,
      retryable: true,
    });
  }

  /**
   * Mengonversi error apapun (Error, string, objek, unknown) menjadi ApiError standar.
   */
  static from(err: unknown): ApiError {
    if (err instanceof ApiError) {
      return err;
    }

    if (err instanceof Error) {
      const lower = err.message.toLowerCase();
      if (lower.includes('offline') || lower.includes('network request failed')) {
        return new ApiError(err.message, {
          code: 'OFFLINE_ERROR',
          technicalMessage: err.stack ?? err.message,
          cause: err,
        });
      }
      if (lower.includes('timeout') || lower.includes('aborted')) {
        return new ApiError(err.message, {
          code: 'TIMEOUT_ERROR',
          technicalMessage: err.stack ?? err.message,
          cause: err,
        });
      }
      return new ApiError(err.message, {
        code: 'UNKNOWN_ERROR',
        technicalMessage: err.stack ?? err.message,
        cause: err,
      });
    }

    const str = String(err);
    return new ApiError(str, {
      code: 'UNKNOWN_ERROR',
      technicalMessage: str,
      cause: err,
    });
  }
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError;
}

export function isOfflineError(err: unknown): boolean {
  return err instanceof ApiError && err.code === 'OFFLINE_ERROR';
}
