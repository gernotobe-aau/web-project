import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { Restaurant } from '../../../core/services/restaurant.service';

@Component({
  selector: 'app-restaurant-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    RouterModule
  ],
  templateUrl: './restaurant-card.component.html',
  styleUrl: './restaurant-card.component.css'
})
export class RestaurantCardComponent {
  @Input() restaurant!: Restaurant;

  /**
   * Get star rating as array for template iteration
   */
  getStars(): number[] {
    if (!this.restaurant.averageRating) {
      return [];
    }
    return Array(Math.round(this.restaurant.averageRating)).fill(0);
  }

  /**
   * Get empty stars for remaining rating
   */
  getEmptyStars(): number[] {
    if (!this.restaurant.averageRating) {
      return [];
    }
    const filled = Math.round(this.restaurant.averageRating);
    return Array(5 - filled).fill(0);
  }

  /**
   * Format address for display
   */
  getAddressString(): string {
    const addr = this.restaurant.address;
    return `${addr.street} ${addr.houseNumber}, ${addr.postalCode} ${addr.city}`;
  }
}
