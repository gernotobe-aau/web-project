import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';

import { MenuService, Category, Dish } from '../../../core/services/menu.service';
import { CategoryDialogComponent } from './category-dialog/category-dialog';
import { DishDialogComponent } from './dish-dialog/dish-dialog';
import { environment } from '../../../../environments/environment';

interface CategoryWithDishes extends Category {
  dishes?: Dish[];
  loading?: boolean;
}

@Component({
  selector: 'app-menu-management',
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
  templateUrl: './menu-management.html',
  styleUrl: './menu-management.css',
})
export class MenuManagementComponent implements OnInit {
  categories: CategoryWithDishes[] = [];
  loading = true;
  error: string | null = null;

  constructor(
    private menuService: MenuService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.loading = true;
    this.error = null;

    this.menuService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories.map((cat) => ({ ...cat, dishes: undefined }));
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = 'Fehler beim Laden der Kategorien';
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
    
    this.menuService.getDishes(category.id).subscribe({
      next: (dishes) => {
        const cat = this.categories.find(c => c.id === category.id);
        if (cat) {
          cat.dishes = dishes;
          cat.loading = false;
          this.categories = [...this.categories];
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        const cat = this.categories.find(c => c.id === category.id);
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


  openCreateCategoryDialog(): void {
    const dialogRef = this.dialog.open(CategoryDialogComponent, {
      width: '500px',
      data: { mode: 'create' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadCategories();
        this.cdr.detectChanges();
      }
    });
  }

  openEditCategoryDialog(category: Category): void {
    const dialogRef = this.dialog.open(CategoryDialogComponent, {
      width: '500px',
      data: { mode: 'edit', category },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadCategories();
        this.cdr.detectChanges();
      }
    });
  }

  deleteCategory(category: Category): void {
    const message =
      category.dishCount > 0
        ? `Diese Kategorie enthält ${category.dishCount} Gerichte. Gerichte werden ebenfalls gelöscht. Wirklich löschen?`
        : `Kategorie "${category.name}" wirklich löschen?`;

    if (confirm(message)) {
      this.menuService.deleteCategory(category.id).subscribe({
        next: () => {
          this.snackBar.open('Kategorie gelöscht', 'OK', { duration: 2000 });
          this.loadCategories();
        },
        error: (err) => {
          this.snackBar.open('Fehler beim Löschen der Kategorie', 'Schließen', {
            duration: 3000,
          });
        },
      });
    }
  }

  dropCategory(event: CdkDragDrop<CategoryWithDishes[]>): void {
    const previousOrder = [...this.categories];
    moveItemInArray(this.categories, event.previousIndex, event.currentIndex);

    const categoryIds = this.categories.map((cat) => cat.id);

    this.menuService.reorderCategories(categoryIds).subscribe({
      next: () => {
        this.snackBar.open('Reihenfolge gespeichert', 'OK', { duration: 2000 });
      },
      error: (err) => {
        // Rollback on error
        this.categories = previousOrder;
        this.snackBar.open('Fehler beim Speichern der Reihenfolge', 'Schließen', {
          duration: 3000,
        });
      },
    });
  }

  openCreateDishDialog(categoryId?: number): void {
    const dialogRef = this.dialog.open(DishDialogComponent, {
      width: '600px',
      data: { mode: 'create', categoryId, categories: this.categories },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && categoryId) {
        // Reload dishes for that category
        const category = this.categories.find((c) => c.id === categoryId);
        if (category) {
          category.dishes = undefined;
          this.onCategoryExpanded(category);
        }
      }
    });
  }

  openEditDishDialog(dish: Dish, categoryId: number): void {
    const dialogRef = this.dialog.open(DishDialogComponent, {
      width: '600px',
      data: { mode: 'edit', dish, categories: this.categories },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // Reload dishes for that category
        const category = this.categories.find((c) => c.id === categoryId);
        if (category) {
          category.dishes = undefined;
          this.onCategoryExpanded(category);
        }
      }
    });
  }

  deleteDish(dish: Dish, categoryId: number): void {
    if (confirm(`Gericht "${dish.name}" wirklich löschen?`)) {
      this.menuService.deleteDish(dish.id).subscribe({
        next: () => {
          this.snackBar.open('Gericht gelöscht', 'OK', { duration: 2000 });
          // Reload dishes for that category
          const category = this.categories.find((c) => c.id === categoryId);
          if (category) {
            category.dishes = undefined;
            this.onCategoryExpanded(category);
          }
          this.loadCategories(); // Refresh dish count
        },
        error: (err) => {
          this.snackBar.open('Fehler beim Löschen des Gerichts', 'Schließen', {
            duration: 3000,
          });
        },
      });
    }
  }

  dropDish(event: CdkDragDrop<Dish[]>, category: CategoryWithDishes): void {
    if (!category.dishes) return;

    const previousOrder = [...category.dishes];
    moveItemInArray(category.dishes, event.previousIndex, event.currentIndex);

    const dishIds = category.dishes.map((dish) => dish.id);

    this.menuService.reorderDishes(dishIds).subscribe({
      next: () => {
        this.snackBar.open('Reihenfolge gespeichert', 'OK', { duration: 2000 });
      },
      error: (err) => {
        // Rollback on error
        if (category.dishes) {
          category.dishes = previousOrder;
        }
        this.snackBar.open('Fehler beim Speichern der Reihenfolge', 'Schließen', {
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

  // TrackBy functions for better performance and reliable rendering
  trackByCategory(index: number, category: CategoryWithDishes): number {
    return category.id;
  }

  trackByDish(index: number, dish: Dish): number {
    return dish.id;
  }
}
