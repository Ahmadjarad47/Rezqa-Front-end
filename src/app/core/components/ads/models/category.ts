export interface AdCategory {
  id: number;
  title: string;
  image: string;
  description: string;
}
export interface AdPosts {
  id: number;
  title: string;
  categoryTitle: string;
  imageUrl: string[];
  description: string;
  price: number;
  location: string;
  phonNumber: string;
  userName: string;
  createdAt: string;
  adFieldDtos: AdFieldDto[];
}
export interface AdFieldDto {
  dynamicFieldId: number;
  value: string;
  title: string;
}
export interface SubCategory {
  id: number;
  title: string;
  categoryId: number;
}

export interface Pagnation {
  items: AdPosts[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
