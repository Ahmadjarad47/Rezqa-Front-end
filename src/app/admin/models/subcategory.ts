export interface SubCategory {
  id: number;
  title: string;
  categoryId: number;
  category: Category;
}

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

export interface GetAllSubCategoriesRequest extends PaginatedRequest {
  searchTerm?: string;
  categoryId?: number;
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

export interface CreateSubCategoryRequest {
  title: string;
  categoryId: number;
}

export interface UpdateSubCategoryRequest {
  id: number;
  title: string;
  categoryId: number;
}

export interface DeleteSubCategoryRequest {
  id: number;
}

export interface SubCategoryDto {
  id: number;
  title: string;
  categoryId: number;
  categoryTitle: string;
  category: Category;
}
