export interface User {
  userId: string;
  role: 'customer' | 'restaurantOwner';
  restaurantId?: string | number;
}

export interface TokenPayload {
  sub: string;
  role: 'customer' | 'restaurantOwner';
  restaurantId?: string | number;
  iat: number;
  exp: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}
