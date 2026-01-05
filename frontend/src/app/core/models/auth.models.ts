export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'customer' | 'restaurantOwner';
  restaurantId?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export interface Address {
  street: string;
  houseNumber: string;
  staircase?: string;
  door?: string;
  postalCode: string;
  city: string;
}

export interface ContactInfo {
  phone: string;
  email?: string;
}

export interface OpeningHour {
  dayOfWeek: number; // 0-6 (0=Sunday)
  openTime?: string;
  closeTime?: string;
  isClosed: boolean;
}

export interface CustomerRegistrationDto {
  firstName: string;
  lastName: string;
  birthDate: string;
  email: string;
  password: string;
  deliveryAddress: Address;
}

export interface RestaurantDto {
  name: string;
  address: Address;
  categories: string[];
  contactInfo: ContactInfo;
  openingHours: OpeningHour[];
}

export interface RestaurantOwnerRegistrationDto {
  firstName: string;
  lastName: string;
  birthDate: string;
  email: string;
  password: string;
  restaurant: RestaurantDto;
}

export interface AuthResponse {
  message: string;
  userId: string;
  role: 'customer' | 'restaurantOwner';
  restaurantId?: string;
  accessToken: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationErrorResponse {
  error: string;
  details: ValidationError[];
}
