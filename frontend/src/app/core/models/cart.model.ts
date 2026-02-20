export interface Cart {
  //id: string;
  customerId: string;
  totalAmount: number;
  totalItems?: number; // Total number of items (quantity sum) from backend
  customerNotes?: string;
  restaurants: CartByRestaurant[];
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

//export interface CartItem {
//  restaurantId: string;
//  dishId: number;
//  dishName: string;
//  quantity: number;
//  pricePerUnit: number;
//  subtotal: number;
//}
export interface CartItem {
  dishId: number;
  dishName: string;
  quantity: number;
  restaurantId: string;
  restaurantName: string;
  pricePerUnit: number;
}

export interface CartByRestaurant {
  restaurantId: string;
  restaurantName: string;
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
}