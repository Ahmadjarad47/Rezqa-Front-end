export interface Ad {
  id: number;
  title: string;
  description: string;
  price: number;
  imageUrl: string[];
  userName: string;
  userId: number;
  categoryId: number;
  subCategoryId: number;
  createdAt: string;
  isActive: boolean;
}
