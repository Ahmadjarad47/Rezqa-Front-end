export interface AdFilter {
    searchTerm?: string;
    categoryId?: number;
    subCategoryId?: number;
    pageNumber?: number;
    pageSize?: number;
    minPrice?: number;
    maxPrice?: number;
    location?: string;
    sortBy?: string;
    sortDirection?: string;
    isActive?: boolean;
    createdAfter?: Date;
    createdBefore?: Date;
    dynamicFieldFilters?: { [key: number]: string };
} 