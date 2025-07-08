export interface SubCategoryDto {
  id:number
  title: string;
  categoryId: number;
  categoryTitle: string;
}
export interface ISubCategoryPage {
    items: SubCategoryDto[];
    pageNumber: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  }