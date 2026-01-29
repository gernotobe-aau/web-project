import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Dish } from './menu.service';

export interface CartItem {
  dish: Dish;
  quantity: number;
  restaurantId: number;
  restaurantName: string;
}

export interface CartByRestaurant {
  restaurantId: number;
  restaurantName: string;
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
}

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private cartItems: CartItem[] = [];
  private cartSubject = new BehaviorSubject<CartItem[]>([]);
  public cart$ = this.cartSubject.asObservable();

  constructor() {
    // Load cart from localStorage on initialization
    this.loadFromLocalStorage();
  }

  /**
   * Add item to cart or increment quantity if already exists
   */
  addItem(dish: Dish, restaurantId: number, restaurantName: string, quantity: number = 1): void {
    const existingItem = this.cartItems.find(
      (item) => item.dish.id === dish.id && item.restaurantId === restaurantId
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      this.cartItems.push({ dish, quantity, restaurantId, restaurantName });
    }

    this.updateCart();
  }

  /**
   * Remove item from cart completely
   */
  removeItem(dishId: number, restaurantId: number): void {
    this.cartItems = this.cartItems.filter(
      (item) => !(item.dish.id === dishId && item.restaurantId === restaurantId)
    );
    this.updateCart();
  }

  /**
   * Update quantity for an item
   */
  updateQuantity(dishId: number, restaurantId: number, quantity: number): void {
    const item = this.cartItems.find(
      (item) => item.dish.id === dishId && item.restaurantId === restaurantId
    );

    if (item) {
      if (quantity <= 0) {
        this.removeItem(dishId, restaurantId);
      } else {
        item.quantity = quantity;
        this.updateCart();
      }
    }
  }

  /**
   * Increment quantity by 1
   */
  incrementQuantity(dishId: number, restaurantId: number): void {
    const item = this.cartItems.find(
      (item) => item.dish.id === dishId && item.restaurantId === restaurantId
    );
    if (item) {
      item.quantity++;
      this.updateCart();
    }
  }

  /**
   * Decrement quantity by 1
   */
  decrementQuantity(dishId: number, restaurantId: number): void {
    const item = this.cartItems.find(
      (item) => item.dish.id === dishId && item.restaurantId === restaurantId
    );
    if (item) {
      if (item.quantity > 1) {
        item.quantity--;
      } else {
        this.removeItem(dishId, restaurantId);
      }
      this.updateCart();
    }
  }

  /**
   * Get all cart items
   */
  getItems(): CartItem[] {
    return this.cartItems;
  }

  /**
   * Get cart items grouped by restaurant, filtering out restaurants/items with 0 items
   */
  getCartByRestaurant(): CartByRestaurant[] {
    const grouped = new Map<number, CartItem[]>();

    this.cartItems.forEach((item) => {
      if (!grouped.has(item.restaurantId)) {
        grouped.set(item.restaurantId, []);
      }
      grouped.get(item.restaurantId)!.push(item);
    });

    return Array.from(grouped.entries())
      .map(([restaurantId, items]) => {
        const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
        const totalPrice = items.reduce(
          (sum, item) => sum + item.dish.price * item.quantity,
          0
        );
        const restaurantName = items[0]?.restaurantName || `Restaurant #${restaurantId}`;
        return { restaurantId, restaurantName, items, totalItems, totalPrice };
      })
      .filter((cart) => cart.totalItems > 0); // Hide restaurants with no items
  }

  /**
   * Clear all items from cart
   */
  clear(): void {
    this.cartItems = [];
    this.updateCart();
  }

  /**
   * Check if cart is empty
   */
  isEmpty(): boolean {
    return this.cartItems.length === 0;
  }

  /**
   * Get total items in cart
   */
  getTotalItems(): number {
    return this.cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }

  private updateCart(): void {
    this.cartSubject.next([...this.cartItems]);
    this.saveToLocalStorage();
  }

  private saveToLocalStorage(): void {
    localStorage.setItem('cart', JSON.stringify(this.cartItems));
  }

  private loadFromLocalStorage(): void {
    const saved = localStorage.getItem('cart');
    if (saved) {
      try {
        this.cartItems = JSON.parse(saved);
      } catch {
        this.cartItems = [];
      }
    }
  }
}
