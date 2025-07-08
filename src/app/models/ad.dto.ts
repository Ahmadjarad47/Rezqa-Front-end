export interface AdFieldDto {
  title: string;
  dynamicFieldId: number;
  value: string;
}

export interface AdDto {
  id: number;
  title: string;
  description: string;
  price: number;
  phonNumber: string;
  categoryTitle: string;
  location: string;
  imageUrl?: string[];
  userId: string;
  isActive: boolean;
  userName: string;
  createdAt: Date;
  updatedAt?: Date;
  adFieldDtos: AdFieldDto[];
}
