import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { CartService, CartByRestaurant, CartItem } from '../../../core/services/cart.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-cartcheckout',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatBadgeModule,
    RouterModule,
  ],
  templateUrl: './cartcheckout.html',
  styleUrl: './cartcheckout.css',
})
export class CartcheckoutComponent implements OnInit {
  cartByRestaurant: CartByRestaurant[] = [];
  loading = true;

  constructor(
    private cartService: CartService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loading = false; // Cart data is immediately available
    
    // Subscribe to cart changes
    this.cartService.cart$.subscribe(() => {
      this.cartByRestaurant = this.cartService.getCartByRestaurant();
      this.cdr.detectChanges();
    });

    // Initial load
    this.cartByRestaurant = this.cartService.getCartByRestaurant();
  }

  incrementQuantity(item: CartItem): void {
    this.cartService.incrementQuantity(item.dish.id, item.restaurantId);
  }

  decrementQuantity(item: CartItem): void {
    this.cartService.decrementQuantity(item.dish.id, item.restaurantId);
  }

  removeItem(item: CartItem): void {
    this.cartService.removeItem(item.dish.id, item.restaurantId);
  }

  getDishPhotoUrl(photoUrl: string | null): string | null {
    if (!photoUrl) return null;
    const baseUrl = environment.apiBaseUrl.replace('/api', '');
    return `${baseUrl}${photoUrl}`;
  }

  proceedToCheckout(): void {
    // TODO: Implement checkout logic
    console.log('Proceeding to checkout with:', this.cartByRestaurant);
  }

  getGrandTotal(): number {
    return this.cartByRestaurant.reduce((sum, c) => sum + c.totalPrice, 0);
  }

  // TrackBy functions
  trackByRestaurant(index: number, cart: CartByRestaurant): number {
    return cart.restaurantId;
  }

  trackByCartItem(index: number, item: CartItem): number {
    return item.dish.id;
  }
}
