export interface ApiResponse<T = any> {
  success?: boolean;
  message?: string;
  error?: string;
  data?: T; // Sometimes data is direct, sometimes wrapped
}

export interface ApiError {
  success: false;
  error: string;
}