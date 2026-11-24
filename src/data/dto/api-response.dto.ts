export interface ApiResponse<T> {
  status: 'success' | 'error';
  server_time: string;
  data: T;
}
