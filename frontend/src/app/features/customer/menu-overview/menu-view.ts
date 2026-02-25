import { Component, OnInit, ChangeDetectorRef, model, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { RestaurantService } from '../../../core/services/restaurant.service';
import { CartService } from '../../../core/services/cart.service';
import { MenuService, Category, Dish } from '../../../core/services/menu.service';
import { environment } from '../../../../environments/environment';
import { ReviewService, DishReview } from '../../../core/services/review.service';

interface CategoryWithDishes extends Category {
  dishes?: Dish[];
  loading?: boolean;
}

@Component({
  selector: 'app-menu-view',
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
    DragDropModule,
  ],
  templateUrl: './menu-view.html',
  styleUrl: './menu-view.css',
})
export class MenuViewComponent implements OnInit {
  categories: CategoryWithDishes[] = [];
  loading = true;
  error: string | null = null;
  restaurantId: string | null = null;
  restaurantName: string | null = null;
  isOwnerView = false;
  readonly dialog = inject(MatDialog);

  constructor(
    private menuService: MenuService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private cartService: CartService,
    private restaurantService: RestaurantService,
    private reviewService: ReviewService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.restaurantId = params.get('restaurantId');
      this.isOwnerView = !this.restaurantId; // If no restaurantId, it's owner viewing their own menu
      
      // Load restaurant name if viewing a restaurant menu
      if (this.restaurantId) {
        this.restaurantService.getRestaurantById(this.restaurantId).subscribe({
          next: (restaurant) => {
            this.restaurantName = restaurant.name;
          },
          error: () => {
            this.restaurantName = null;
          }
        });
      }
      
      this.loadCategories();
    });
  }

  loadCategories(): void {
    this.loading = true;
    this.error = null;

    // Pass restaurantId only if it exists, otherwise undefined (for authenticated owner)
    const restaurantIdParam = this.restaurantId ? this.restaurantId : undefined;
    this.menuService.getCategories(restaurantIdParam).subscribe({
      next: (categories) => {
        this.categories = categories.map((cat) => ({ ...cat, dishes: undefined }));
        this.loading = false;
        this.cdr.detectChanges();
        localStorage.setItem(`categories_${restaurantIdParam}`, JSON.stringify(categories))
      },
      error: (err) => {
        this.error = 'Fehler beim Laden der Kategorien';
        let jsonLoad = localStorage.getItem(`categories_${restaurantIdParam}`)
        if(jsonLoad){
            this.categories = JSON.parse(jsonLoad)
          }
        this.loading = false;
        this.cdr.detectChanges();
        this.snackBar.open('Fehler beim Laden der Kategorien', 'Schließen', {
          duration: 3000,
        });
      },
    });
  }


  onCategoryExpanded(category: CategoryWithDishes): void {
    const foundCategory = this.categories.find(c => c.id === category.id);
    if (!foundCategory || foundCategory.dishes !== undefined || foundCategory.loading) return;

    foundCategory.loading = true;
    this.categories = [...this.categories];
    this.cdr.detectChanges();
    
    const restaurantIdParam = this.restaurantId ? this.restaurantId : undefined;
    this.menuService.getDishes(category.id, restaurantIdParam).subscribe({
      next: (dishes) => {
        const cat = this.categories.find(c => c.id === category.id);
        if (cat) {
          cat.dishes = dishes;
          cat.loading = false;
          this.categories = [...this.categories];
          this.cdr.detectChanges();
          localStorage.setItem(`category_${restaurantIdParam}_${cat.id}`, JSON.stringify(cat))
        }
      },
      error: (err) => {
        const cat = this.categories.find(c => c.id === category.id);
        if (cat) {
          let jsonLoad = localStorage.getItem(`category_${restaurantIdParam}_${category.id}`)
          if(jsonLoad){
            cat.dishes = JSON.parse(jsonLoad).dishes
          }
          cat.loading = false;
          this.categories = [...this.categories];
          this.cdr.detectChanges();
        }
        this.snackBar.open('Fehler beim Laden der Gerichte', 'Schließen', {
          duration: 3000,
        });
      },
    });
  }

  refreshDishes(categoryId: number){
    this.menuService.getDishes(categoryId, this.restaurantId!).subscribe({
      next: (dishes) => {
        const cat = this.categories.find(c => c.id === categoryId);
        if (cat) {
          cat.dishes = dishes;
          cat.loading = false;
          this.categories = [...this.categories];
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        const cat = this.categories.find(c => c.id === categoryId);
        if (cat) {
          cat.loading = false;
          this.categories = [...this.categories];
          this.cdr.detectChanges();
        }
        this.snackBar.open('Fehler beim Laden der Gerichte', 'Schließen', {
          duration: 3000,
        });
      },
    });
  }

  getDishPhotoUrl(dish: Dish): string | null {
    if (!dish.photo_url) return null;
    // Backend serves files at /uploads/* - construct full URL
    const baseUrl = environment.apiBaseUrl.replace('/api', '');
    return `${baseUrl}${dish.photo_url}`;
  }

  onAddToCart(dish: Dish): void {
    if (!this.restaurantId) return; // Prevent adding to cart when in owner view

    this.cartService.addItem(
      dish,
      this.restaurantId,
      this.restaurantName || `Restaurant #${this.restaurantName}`
    );
    this.snackBar.open(`${dish.name} zum Warenkorb hinzugefügt`, 'Schließen', {
      duration: 2000,
    });
  }

  // TrackBy functions for better performance and reliable rendering
  trackByCategory(index: number, category: CategoryWithDishes): number {
    return category.id;
  }

  trackByDish(index: number, dish: Dish): number {
    return dish.id;
  }

  /**
   * Get star rating as array for template iteration
   */
  getStars(rating: number): number[] {
    if (!rating) {
      return [];
    }
    return Array(Math.round(rating)).fill(0);
  }

  /**
   * Get empty stars for remaining rating
   */
  getEmptyStars(rating: number): number[] {
    if (!rating) {
      return [];
    }
    const filled = Math.round(rating);
    return Array(5 - filled).fill(0);
  }

  

  openReviewDialog(dish: Dish) {
    const dialogRef = this.dialog.open(DishReviewDialog, {
      data: {reviewStars: 0}
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log(`Dialog result: ${result}`);
      if(result){
        const dishReview = {} as DishReview
        dishReview.dishId = dish.id
        dishReview.rating = result
        this.reviewService.createDishReview(dishReview).subscribe({
          next: (c) =>{ 
            console.log('created dish review:', c)
            this.refreshDishes(dish.category_id!)
          },
          error: (e) => { console.log('Error getting dish rating:', e)}
        })
      }
    });
  }
}

@Component({
  selector: 'dish-review-dialog',
  templateUrl: 'dish-review-dialog.html',
  imports: [MatDialogModule, MatButtonModule, MatIconModule, CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DishReviewDialog {
  readonly dialogRef = inject(MatDialogRef<DishReviewDialog>);
  data = inject(MAT_DIALOG_DATA)
  readonly reviewStars = model(this.data.reviewStars)

  onCancelClick(): void{
    this.dialogRef.close();
  }


  /**
   * Get star rating as array for template iteration
   */
  getStars(rating: number): number[] {
    if (!rating) {
      return [];
    }
    return Array(Math.round(rating)).fill(0);
  }

  /**
   * Get empty stars for remaining rating
   */
  getEmptyStars(rating: number): number[] {
    if (!rating) {
      return [];
    }
    const filled = Math.round(rating);
    return Array(5 - filled).fill(0);
  }
}

export interface DialogData {
  rating: number
}

