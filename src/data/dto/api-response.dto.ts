/**
 * Bentuk umum (envelope) response dari server.
 */
export interface ApiResponse<T> {
  status: 'success' | 'error';
  server_time: string; // ISO-8601
  data: T;
}
