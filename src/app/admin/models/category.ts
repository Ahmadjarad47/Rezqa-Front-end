export interface Category {
  id: number;
  title: string;
  image?: string;
  description: string;
  isActive: boolean;
}

export interface PaginatedRequest {
  pageNumber: number;
  pageSize: number;
  search?: string;
}

export interface GetAllCategoriesRequest extends PaginatedRequest {
  searchTerm?: string;
  isActive?: boolean;
}

export interface PaginatedResult<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
