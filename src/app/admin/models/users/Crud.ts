export interface GetAllUsers {
  userName: string;
  id: string;
  imageUrl:string
  email: string;
  phoneNumber: string;
  lockoutEnd: Date | null;
  isBlocked: boolean;
  isConfirmeEmail:boolean;
  roles:string
  online?: boolean;
}
export class BlockUserDto {
  userId: string='';
  blockUntil: Date=new Date();
}
