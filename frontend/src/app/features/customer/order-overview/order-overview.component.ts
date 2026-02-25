import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { Order, OrderStatus, StatusAction } from '../../../core/models/order.model';
import { OrderService } from '../../../core/services/order.service';
import { AuthService } from '../../../core/services/auth.service';
import { Restaurant, RestaurantService } from '../../../core/services/restaurant.service';

@Component({
  selector: 'app-order-overview',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTooltipModule,
    MatListModule,
    MatDividerModule
  ],
  templateUrl: './order-overview.component.html',
  styleUrls: ['./order-overview.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrderOverviewComponent implements OnInit, OnDestroy {
  orders: Order[] = [];
  displayedOrders: Order[] = [];
  showCompleted: boolean = false; // Hide completed orders by default
  completedCount: number = 0;
  loading: boolean = false;
  expandedOrderIds: Set<string> = new Set(); // Allow multiple expanded orders
  customerId: string = '';
  allRestaurants: Restaurant[] = [];
  
  private refreshInterval: any;
  private readonly REFRESH_INTERVAL_MS = 30000; // 30 seconds

  OrderStatus = OrderStatus;

  constructor(
    private orderService: OrderService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private restaurantService : RestaurantService
  ) {}

  /**
   * TrackBy function for ngFor performance
   */
  trackByOrderId(index: number, order: Order): string {
    return order.id;
  }

  ngOnInit(): void {
    // Get ID from authenticated user
    const user = this.authService.getCurrentUser();
    if (user && user.id) {
      this.customerId = user.id;
      this.loadOrders();
      this.startAutoRefresh();
    } else {
      this.snackBar.open('ID nicht gefunden', 'OK', { duration: 5000 });
    }
  }

  ngOnDestroy(): void {
    this.stopAutoRefresh();
  }

  /**
   * Load all orders from API
   * @param silent If true, don't show loading spinner
   */
  loadOrders(silent: boolean = false): void {
    if (!silent) {
      this.loading = true;
      this.cdr.markForCheck();
    }
    this.orderService.getCustomerOrders(this.customerId).subscribe({
      next: (orders) => {
        console.log('Loaded order:', orders)
        this.orders = orders;
        console.log('Orders now:', this.orders)
        this.completedCount = orders.filter(o => 
          [OrderStatus.DELIVERED, OrderStatus.CANCELLED, OrderStatus.REJECTED].includes(o.status)
        ).length;
        this.displayedOrders = this.sortOrders(this.orders);
        console.log('Displayed order:', this.displayedOrders)
        console.log('Order items of first batch:', this.displayedOrders[0].items)

        // Auto-expand pending and preparing orders on initial load
        if (!silent) {
          this.expandedOrderIds.clear();
          orders.forEach(order => {
            if ([OrderStatus.PENDING, OrderStatus.ACCEPTED, OrderStatus.PREPARING].includes(order.status)) {
              this.expandedOrderIds.add(order.id);
            }
          });
        }
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loading = false;
        this.cdr.markForCheck();
        if (!silent) {
          this.snackBar.open('Fehler beim Laden der Bestellungen', 'Wiederholen', { 
            duration: 5000 
          }).onAction().subscribe(() => {
            this.loadOrders();
          });
        }
      }
    });
  }

  /**
   * Sort orders by time: newest first (simple descending by createdAt)
   */
  sortOrders(orders: Order[]): Order[] {
    // Filter out completed orders if showCompleted is false
    const filtered = this.showCompleted 
      ? orders 
      : orders.filter(o => ![OrderStatus.DELIVERED, OrderStatus.CANCELLED, OrderStatus.REJECTED].includes(o.status));
    
    // Simple sort by createdAt descending (newest first)
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Toggle showing completed orders
   */
  toggleCompleted(): void {
    this.showCompleted = !this.showCompleted;
    this.displayedOrders = this.sortOrders(this.orders);
    this.cdr.markForCheck();
  }

  
  /**
   * Update order status to next status in workflow
   */
  updateStatus(order: Order, newStatus: OrderStatus): void {
    this.orderService.updateOrderStatus(this.customerId, order.id, newStatus).subscribe({
      next: () => {
        order.status = newStatus;
        order.updatedAt = new Date().toISOString();
        // Remove from expanded if now completed
        if ([OrderStatus.DELIVERED, OrderStatus.CANCELLED, OrderStatus.REJECTED].includes(newStatus)) {
          this.expandedOrderIds.delete(order.id);
        }
        this.displayedOrders = [...this.sortOrders(this.orders)];
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.snackBar.open(this.orderService.getErrorMessage(err), 'OK', { duration: 5000 });
        this.loadOrders();
      }
    });
  }
  /**
   * Get status badge color
   */
  getStatusColor(status: OrderStatus): string {
    switch (status) {
      case OrderStatus.PENDING:
        return 'warn';
      case OrderStatus.ACCEPTED:
        return 'primary';
      case OrderStatus.PREPARING:
        return 'accent';
      case OrderStatus.READY:
        return 'primary';
      case OrderStatus.DELIVERING:
        return 'accent';
      case OrderStatus.DELIVERED:
        return 'primary';
      case OrderStatus.REJECTED:
        return 'warn';
      case OrderStatus.CANCELLED:
        return '';
      default:
        return '';
    }
  }

  /**
   * Get human-readable status label
   */
  getStatusLabel(status: OrderStatus): string {
    const labels: Record<OrderStatus, string> = {
      [OrderStatus.PENDING]: 'Neu',
      [OrderStatus.ACCEPTED]: 'Angenommen',
      [OrderStatus.REJECTED]: 'Abgelehnt',
      [OrderStatus.PREPARING]: 'In Bearbeitung',
      [OrderStatus.READY]: 'Fertig',
      [OrderStatus.DELIVERING]: 'Wird geliefert',
      [OrderStatus.DELIVERED]: 'Zugestellt',
      [OrderStatus.CANCELLED]: 'Storniert'
    };
    return labels[status] || status;
  }

  /**
   * Toggle expanded order details
   */
  toggleExpand(order: Order): void {
    if (this.expandedOrderIds.has(order.id)) {
      this.expandedOrderIds.delete(order.id);
    } else {
      this.expandedOrderIds.add(order.id);
    }
    this.cdr.markForCheck();
  }

  /**
   * Check if order is expanded
   */
  isExpanded(order: Order): boolean {
    return this.expandedOrderIds.has(order.id);
  }

  /**
   * Start automatic refresh interval
   */
  private startAutoRefresh(): void {
    this.refreshInterval = setInterval(() => {
      this.loadOrders(true);
    }, this.REFRESH_INTERVAL_MS);
  }

  /**
   * Stop automatic refresh interval
   */
  private stopAutoRefresh(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  /**
   * Get count of new pending orders
   */
  private getNewOrderCount(newOrders: Order[]): number {
    const currentPendingIds = this.orders
      .filter(o => o.status === OrderStatus.PENDING)
      .map(o => o.id);
    return newOrders
      .filter(o => o.status === OrderStatus.PENDING && !currentPendingIds.includes(o.id))
      .length;
  }

  /**
   * Check if order is the first pending order (should be highlighted)
   */
  isFirstPending(order: Order): boolean {
    const pendingOrders = this.displayedOrders.filter(o => o.status === OrderStatus.PENDING);
    return pendingOrders.length > 0 && pendingOrders[0].id === order.id;
  }

  /**
   * Format date to local string
   */
  formatDate(date: string): string {
    return new Date(date).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Calculate total items count
   */
  getTotalItems(order: Order): number {
    // Use totalItems from backend if available, otherwise fallback to items array
    if (order.totalItems !== undefined && order.totalItems > 0) {
      return order.totalItems;
    }
    if (order.items && order.items.length > 0) {
      return order.items.reduce((sum, item) => sum + item.quantity, 0);
    }
    return 0;
  }
}
