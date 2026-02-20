import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Order, OrderStatus } from '../models/order.model';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  /**
   * Get all orders for a specific restaurant
   * @param restaurantId The restaurant ID
   * @returns Observable of Order array
   */
  getRestaurantOrders(restaurantId: string): Observable<Order[]> {
    return this.http.get<any>(`${this.apiUrl}/restaurants/${restaurantId}/orders`)
      .pipe(
        map(response => {
          // Backend kann entweder {value: [], Count: n} oder direkt Array zurückgeben
          const orderArray = Array.isArray(response) ? response : (response.value || []);
          return orderArray.map((order: any) => this.mapBackendOrderToFrontend(order));
        })
      );
  }

  /**
   * Get all orders for a specific customer
   * @param customerId The customer ID
   * @returns Observable of Order array
   */
  getCustomerOrders(customerId: string): Observable<Order[]> {
    return this.http.get<any>(`${this.apiUrl}/orders/my`)
    .pipe(
        map(response => {
          // Backend kann entweder {value: [], Count: n} oder direkt Array zurückgeben
          const orderArray = Array.isArray(response) ? response : (response.value || []);
          return orderArray.map((order: any) => this.mapBackendOrderToFrontend(order));
        })
      );
  }

  /**
   * Accept a pending order
   * @param restaurantId The restaurant ID
   * @param orderId The order ID
   * @returns Observable of void
   */
  acceptOrder(restaurantId: string, orderId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/restaurants/${restaurantId}/orders/${orderId}/accept`, {});
  }

  /**
   * Reject a pending order
   * @param restaurantId The restaurant ID
   * @param orderId The order ID
   * @param reason Optional rejection reason
   * @returns Observable of void
   */
  rejectOrder(restaurantId: string, orderId: string, reason?: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/restaurants/${restaurantId}/orders/${orderId}/reject`, { reason });
  }

  /**
   * Update order status
   * @param restaurantId The restaurant ID
   * @param orderId The order ID
   * @param status The new status
   * @returns Observable of void
   */
  updateOrderStatus(restaurantId: string, orderId: string, status: OrderStatus): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/restaurants/${restaurantId}/orders/${orderId}/status`, { status });
  }

  /**
   * Map backend order format to frontend format
   */
  private mapBackendOrderToFrontend(backendOrder: any): Order {
    // Map items from backend format to frontend format
    const items = (backendOrder.items || []).map((item: any) => ({
      dishId: item.dishId,
      dishName: item.dishName,
      quantity: item.quantity,
      pricePerUnit: item.dishPrice,
      subtotal: item.subtotal
    }));

    return {
      id: backendOrder.id,
      restaurantId: backendOrder.restaurantId,
      customerId: backendOrder.customerId,
      dailyOrderNumber: backendOrder.dailyOrderNumber || 0,
      orderDate: backendOrder.orderDate || backendOrder.createdAt?.split('T')[0] || '',
      status: backendOrder.orderStatus as OrderStatus,
      totalAmount: backendOrder.finalPrice,
      estimatedDeliveryTime: new Date(new Date(backendOrder.createdAt).getTime() + backendOrder.estimatedDeliveryMinutes * 60000).toISOString(),
      customerNotes: backendOrder.customerNotes,
      items: items,
      createdAt: backendOrder.createdAt,
      updatedAt: backendOrder.updatedAt,
      customerName: `${backendOrder.customerFirstName} ${backendOrder.customerLastName}`,
      customerEmail: backendOrder.customerEmail,
      totalItems: backendOrder.totalItems || items.length
    };
  }

  /**
   * Get error message from HTTP error response
   * @param error The HTTP error response
   * @returns User-friendly error message
   */
  getErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 422 && error.error?.message) {
      return error.error.message;
    }
    if (error.status === 404) {
      return 'Bestellung nicht gefunden';
    }
    if (error.status === 403) {
      return 'Keine Berechtigung für diese Aktion';
    }
    if (error.status === 409) {
      return 'Bestellung wurde bereits bearbeitet';
    }
    if (error.status === 0) {
      return 'Server nicht erreichbar';
    }
    return 'Ein Fehler ist aufgetreten';
  }
}
