export interface Carousel {
  id: number;
  title?: string;
  imageUrl: string;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt?: Date;
  isDeleted: boolean;
}

export interface CarouselDto {
  id: number;
  title?: string;
  imageUrl: string;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt?: Date;
  isDeleted: boolean;
}

export interface PaginatedRequest {
  pageNumber: number;
  pageSize: number;
  search?: string;
}

export interface GetAllCarouselsRequest extends PaginatedRequest {
  isPagnationStop?: boolean;
  searchTerm?: string;
  pageNumber: number;
  pageSize: number;
}

export interface CreateCarouselRequest {
  title?: string;
  image: File;
}

export interface UpdateCarouselRequest {
  id: number;
  title?: string;
  image?: File;
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
