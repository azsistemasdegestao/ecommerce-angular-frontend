export interface UserDto {
  id: string;
  email: string;
  role: 'Admin' | 'Customer' | null;
}
