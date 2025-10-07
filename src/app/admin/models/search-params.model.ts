export interface SearchParams {
  searchTerm?: string;
  categoryId?: number;
  subCategoryId?: number;
  pageNumber: number;
  pageSize: number;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
}
