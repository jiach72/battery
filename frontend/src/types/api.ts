export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface SpringPage<T> {
  content: T[];
  totalElements: number;
  number: number;
  size: number;
}

export interface PageResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
}
