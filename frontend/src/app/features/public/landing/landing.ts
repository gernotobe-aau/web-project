import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { forkJoin } from 'rxjs';
import { Restaurant, RestaurantService } from '../../../core/services/restaurant.service';
import { CategoryService } from '../../../core/services/category.service';
import { RestaurantListComponent } from '../../../shared/components/restaurant-list/restaurant-list.component';
import { RestaurantFilterComponent, RestaurantFilters } from '../../../shared/components/restaurant-filter/restaurant-filter.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    CommonModule,
    MatSnackBarModule,
    MatButtonModule,
    RestaurantListComponent,
    RestaurantFilterComponent
  ],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class LandingComponent implements OnInit {
  allRestaurants: Restaurant[] = [];
  filteredRestaurants: Restaurant[] = [];
  availableCategories: string[] = [];
  loading: boolean = false;
  error: string | null = null;

  constructor(
    private restaurantService: RestaurantService,
    private categoryService: CategoryService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('LandingComponent ngOnInit called');
    this.loadData();
  }

  /**
   * Load restaurants and categories
   */
  loadData(): void {
    console.log('loadData() called');
    this.loading = true;
    this.error = null;
    this.cdr.detectChanges();

    // Load restaurants and categories in parallel using forkJoin
    forkJoin({
      restaurants: this.restaurantService.getRestaurants(),
      categories: this.categoryService.getCategories()
    }).subscribe({
      next: ({ restaurants, categories }) => {
        console.log('Data received:', { restaurants, categories });
        this.allRestaurants = restaurants || [];
        this.filteredRestaurants = this.allRestaurants;
        this.availableCategories = categories || [];
        this.loading = false;
        console.log('Loaded restaurants:', this.allRestaurants.length);
        console.log('Loaded categories:', this.availableCategories);
        console.log('Loading flag:', this.loading);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading data:', error);
        this.error = 'Restaurants konnten nicht geladen werden. Bitte versuchen Sie es später erneut.';
        this.loading = false;
        this.cdr.detectChanges();
        this.showErrorSnackbar();
      }
    });
  }

  /**
   * Handle filter changes
   */
  onFiltersChanged(filters: RestaurantFilters): void {
    this.filteredRestaurants = this.allRestaurants.filter(restaurant => {
      // Filter by categories (OR logic)
      if (filters.categories.length > 0) {
        const hasMatchingCategory = restaurant.categories.some(cat => 
          filters.categories.includes(cat)
        );
        if (!hasMatchingCategory) {
          return false;
        }
      }

      // Filter by rating
      if (filters.minRating !== null) {
        if (!restaurant.averageRating || restaurant.averageRating < filters.minRating) {
          return false;
        }
      }

      // Filter by delivery time
      if (filters.maxDeliveryTime !== null) {
        if (restaurant.estimatedDeliveryTime > filters.maxDeliveryTime) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Retry loading data
   */
  retryLoading(): void {
    this.loadData();
  }

  /**
   * Show error snackbar
   */
  private showErrorSnackbar(): void {
    this.snackBar.open(
      'Fehler beim Laden der Restaurants. Bitte prüfen Sie Ihre Internetverbindung.',
      'Erneut versuchen',
      {
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom'
      }
    ).onAction().subscribe(() => {
      this.retryLoading();
    });
  }
}
