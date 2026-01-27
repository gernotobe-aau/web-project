export interface Order {
  id: string;
  restaurantId: string;
  customerId: string;
  dailyOrderNumber: number; // Daily sequential order number (resets per day per restaurant)
  orderDate: string; // YYYY-MM-DD format
  status: OrderStatus;
  totalAmount: number;
  totalItems?: number; // Total number of items (quantity sum) from backend
  voucher?: {
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    discountAmount: number;
  };
  estimatedDeliveryTime: string; // ISO timestamp
  customerNotes?: string;
  customerName?: string; // Full name from backend
  customerEmail?: string; // Email from backend
  items: OrderItem[];
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

export interface OrderItem {
  dishId: number;
  dishName: string;
  quantity: number;
  pricePerUnit: number;
  subtotal: number;
}

export enum OrderStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  PREPARING = 'preparing',
  READY = 'ready',
  DELIVERING = 'delivering',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}

export interface StatusAction {
  label: string;
  status: OrderStatus;
  color: string;
  icon: string;
}
