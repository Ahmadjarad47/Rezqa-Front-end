export interface VipAdsDto {
  id: number;
  title: string;
  description: string;
  price: number;
  image: string[];
  phonNumber: string;
  adsInfo: { [key: string]: string };
  createdAt: Date;
  updatedAt?: Date;
}

export interface CreateVipAdsDto {
  images: FileList;
  title: string;
  description: string;
  price: number;
  image: string[];
  phonNumber: string;
  adsInfo: { [key: string]: string };
}

export interface UpdateVipAdsDto {
  id: number;
  title: string;
  description: string;
  price: number;
  image: string[];
  imageWantDelete: string[];
  images?: FileList;
  phonNumber: string;
  adsInfo: { [key: string]: string };
}

export interface VipAdsResponseDto {
  isSuccess: boolean;
  message: string;
  data?: VipAdsDto;
}

export interface GetAllVipAdsQuery {
  pageNumber: number;
  pageSize: number;
  searchTerm?: string;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
}
