export interface Cart {
  customerId: string;
  voucherId?: number;
  voucherCode?: string;
  totalAmount: number;
  totalItems?: number; // Total number of items (quantity sum) from backend
  customerNotes?: string;
  restaurants: CartByRestaurant[];
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}


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

export interface VoucherValidaton {
  valid: boolean;
  message?: string;
  discountAmount?: number;
  finalPrice?: number;
  voucher?: Voucher
}

export interface Voucher {
  id: number;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  isActive: boolean;
  validFrom: string;
  validUntil: string;
  usageLimit?: number;
  usageCount: number;
  restaurantId?: string;
  createdAt: string;
  updatedAt: string;
}

export type DiscountType = 'percentage' | 'fixed_amount';