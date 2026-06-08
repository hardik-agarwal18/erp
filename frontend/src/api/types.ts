export type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
};

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

export type ApiErrorPayload = {
  success?: false;
  message?: string;
  errors?: Record<string, string[]>;
};

export type QueryParams = Record<string, string | number | boolean | undefined | null>;
