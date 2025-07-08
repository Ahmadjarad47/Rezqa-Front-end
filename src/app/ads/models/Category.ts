export interface IPage {
  items: ICategory[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
export interface ICategory {
  id: number;
  title: string;
  image: string;
  description: string;

}

export interface PaginatedRequest {
  pageNumber: number;
  pageSize: number;
  search?: string;
}