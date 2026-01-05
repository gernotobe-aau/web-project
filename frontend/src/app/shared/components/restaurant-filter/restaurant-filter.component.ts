import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { FormsModule } from '@angular/forms';

export interface RestaurantFilters {
  categories: string[];
  minRating: number | null;
  maxDeliveryTime: number | null;
}

@Component({
  selector: 'app-restaurant-filter',
  standalone: true,
  imports: [
    CommonModule,
    MatChipsModule,
    MatButtonModule,
    MatIconModule,
    MatRadioModule,
    FormsModule
  ],
  templateUrl: './restaurant-filter.component.html',
  styleUrl: './restaurant-filter.component.css'
})
export class RestaurantFilterComponent {
  @Input() availableCategories: string[] = [];
  @Output() filtersChanged = new EventEmitter<RestaurantFilters>();

  selectedCategories: Set<string> = new Set();
  selectedMinRating: number | null = null;
  selectedMaxDeliveryTime: number | null = null;

  ratingOptions = [
    { value: null, label: 'Alle anzeigen' },
    { value: 4, label: 'Mindestens 4 Sterne' },
    { value: 3, label: 'Mindestens 3 Sterne' },
    { value: 2, label: 'Mindestens 2 Sterne' }
  ];

  deliveryTimeOptions = [
    { value: null, label: 'Alle anzeigen' },
    { value: 30, label: 'Bis 30 Minuten' },
    { value: 45, label: 'Bis 45 Minuten' },
    { value: 60, label: 'Bis 60 Minuten' }
  ];

  /**
   * Toggle category selection
   */
  toggleCategory(category: string): void {
    if (this.selectedCategories.has(category)) {
      this.selectedCategories.delete(category);
    } else {
      this.selectedCategories.add(category);
    }
    this.emitFilters();
  }

  /**
   * Check if category is selected
   */
  isCategorySelected(category: string): boolean {
    return this.selectedCategories.has(category);
  }

  /**
   * Update rating filter
   */
  onRatingChange(): void {
    this.emitFilters();
  }

  /**
   * Update delivery time filter
   */
  onDeliveryTimeChange(): void {
    this.emitFilters();
  }

  /**
   * Reset all filters
   */
  resetFilters(): void {
    this.selectedCategories.clear();
    this.selectedMinRating = null;
    this.selectedMaxDeliveryTime = null;
    this.emitFilters();
  }

  /**
   * Check if any filter is active
   */
  hasActiveFilters(): boolean {
    return this.selectedCategories.size > 0 || 
           this.selectedMinRating !== null || 
           this.selectedMaxDeliveryTime !== null;
  }

  /**
   * Emit current filter state
   */
  private emitFilters(): void {
    this.filtersChanged.emit({
      categories: Array.from(this.selectedCategories),
      minRating: this.selectedMinRating,
      maxDeliveryTime: this.selectedMaxDeliveryTime
    });
  }
}
