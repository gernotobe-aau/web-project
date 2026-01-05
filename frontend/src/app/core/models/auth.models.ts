export interface User {
  userId: string;
  role: 'customer' | 'restaurantOwner';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}
