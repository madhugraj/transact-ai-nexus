
// Interface for API responses
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
