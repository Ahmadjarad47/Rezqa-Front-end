export interface DynamicField {
  id: number;
  title: string;
  name: string;
  type: string;
  categoryId: number;
  categoryTitle: string;
  subCategoryId?: number;
  subCategoryTitle?: string;
  shouldFilterByParent?: boolean;
  options: FieldOption[];
}

export interface FieldOption {
  id: number;
  label: string;
  value: string;
  parentValue?: string;
  dynamicFieldId: number;
}

export interface Category {
  id: number;
  title: string;
  image?: string;
  description: string;
  isActive: boolean;
}

export interface SubCategory {
  id: number;
  title: string;
  categoryId: number;
  category: Category;
}

export interface PaginatedRequest {
  pageNumber: number;
  pageSize: number;
  search?: string;
}

export interface GetAllDynamicFieldsRequest extends PaginatedRequest {
  searchTerm?: string;
  type?: string;
  categoryId?: number;
  subCategoryId?: number;
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

export interface FieldOptionRequest {
  label: string;
  value: string;
  parentValue?: string;
}

export interface CreateDynamicFieldRequest {
  title: string;
  name: string;
  type: string;
  categoryId: number;
  subCategoryId?: number;
  shouldFilterByParent?: boolean;
  options: FieldOptionRequest[];
}

export interface CreateDynamicFieldsRequest {
  dynamicFields: CreateDynamicFieldRequest[];
}

export interface UpdateDynamicFieldRequest {
  id: number;
  title: string;
  name: string;
  type: string;
  categoryId: number;
  subCategoryId?: number;
  shouldFilterByParent?: boolean;
  options: FieldOptionRequest[];
}

export interface DeleteDynamicFieldRequest {
  id: number;
}

export interface DynamicFieldDto {
  id: number;
  title: string;
  name: string;
  type: string;
  categoryId: number;
  categoryTitle: string;
  subCategoryId?: number;
  subCategoryTitle?: string;
  shouldFilterByParent?: boolean;
  options: FieldOptionDto[];
}

export interface FieldOptionDto {
  id: number;
  label: string;
  value: string;
  parentValue?: string;
  dynamicFieldId: number;
} 