import { CategoryDto } from "./category.model";

export interface PaginatedResponse<T> {
  items: CategoryDto[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface PaginationParams {
  pageNumber: number;
  pageSize: number;
  search?: string;
} 