export interface User {
  userId: string;
  role: 'customer' | 'restaurantOwner';
}

export interface TokenPayload {
  sub: string;
  role: 'customer' | 'restaurantOwner';
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
