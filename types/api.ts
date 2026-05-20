export type ApiResponse<T = unknown> = {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
  errors?: unknown;
};
