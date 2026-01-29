import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Category {
  id: number;
  restaurant_id: number;
  name: string;
  display_order: number;
  dishCount: number;
  created_at: string;
  updated_at: string;
}

export interface Dish {
  id: number;
  restaurant_id: number;
  category_id: number | null;
  name: string;
  description: string | null;
  price: number;
  display_order: number;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCategoryRequest {
  name: string;
}

export interface UpdateCategoryRequest {
  name: string;
}

export interface ReorderCategoriesRequest {
  categoryIds: number[];
}

export interface CreateDishRequest {
  name: string;
  description?: string;
  price: number;
  categoryId?: number;
  display_order?: number;
  photo?: File;
}

export interface UpdateDishRequest {
  name?: string;
  description?: string;
  price?: number;
  categoryId?: number;
  display_order?: number;
  photo?: File;
}

export interface ReorderDishesRequest {
  dishIds: number[];
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ErrorResponse {
  errors: ValidationError[];
}

export interface CategoryWithDishes extends Category {
  dishes: Dish[];
}

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  private apiUrl = `${environment.apiBaseUrl}/menu`;

  constructor(private http: HttpClient) {}

  // ===== CATEGORY METHODS =====

  /**
   * Get all categories for the restaurant
   * @param restaurantId Optional. If provided, gets categories for that restaurant. If not provided, gets for authenticated user's restaurant.
   */
  getCategories(restaurantId?: string): Observable<Category[]> {
    let params = new HttpParams();
    if (restaurantId !== undefined) {
      params = params.set('restaurantId', restaurantId);
    }
    return this.http.get<Category[]>(`${this.apiUrl}/categories`, { params });
  }

  /**
   * Create a new category
   */
  createCategory(data: CreateCategoryRequest): Observable<Category> {
    return this.http.post<Category>(`${this.apiUrl}/categories`, data);
  }

  /**
   * Update a category
   */
  updateCategory(categoryId: number, data: UpdateCategoryRequest): Observable<Category> {
    return this.http.put<Category>(`${this.apiUrl}/categories/${categoryId}`, data);
  }

  /**
   * Delete a category
   */
  deleteCategory(categoryId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/categories/${categoryId}`);
  }

  /**
   * Reorder categories
   */
  reorderCategories(categoryIds: number[]): Observable<{ success: boolean }> {
    return this.http.put<{ success: boolean }>(`${this.apiUrl}/categories/reorder`, {
      categoryIds,
    });
  }

  // ===== DISH METHODS =====

  /**
   * Get all dishes (optionally filtered by category and/or restaurant)
   * @param categoryId Optional category filter
   * @param restaurantId Optional restaurant filter. If provided, gets dishes for that restaurant.
   */
  getDishes(categoryId?: number, restaurantId?: string): Observable<Dish[]> {
    let params = new HttpParams();
    if (categoryId !== undefined) {
      params = params.set('categoryId', categoryId.toString());
    }
    if (restaurantId !== undefined) {
      params = params.set('restaurantId', restaurantId);
    }
    return this.http.get<Dish[]>(`${this.apiUrl}/dishes`, { params });
  }

  /**
   * Get a single dish
   */
  getDish(dishId: number): Observable<Dish> {
    return this.http.get<Dish>(`${this.apiUrl}/dishes/${dishId}`);
  }

  /**
   * Create a new dish
   */
  createDish(data: CreateDishRequest): Observable<Dish> {
    const formData = new FormData();
    formData.append('name', data.name);
    if (data.description) formData.append('description', data.description);
    formData.append('price', data.price.toString());
    if (data.categoryId) formData.append('categoryId', data.categoryId.toString());
    if (data.display_order !== undefined) formData.append('display_order', data.display_order.toString());
    if (data.photo) formData.append('photo', data.photo);

    return this.http.post<Dish>(`${this.apiUrl}/dishes`, formData);
  }

  /**
   * Update a dish
   */
  updateDish(dishId: number, data: UpdateDishRequest): Observable<Dish> {
    const formData = new FormData();
    if (data.name !== undefined) formData.append('name', data.name);
    if (data.description !== undefined) formData.append('description', data.description || '');
    if (data.price !== undefined) formData.append('price', data.price.toString());
    if (data.categoryId !== undefined)
      formData.append('categoryId', data.categoryId?.toString() || '');
    if (data.display_order !== undefined) formData.append('display_order', data.display_order.toString());
    if (data.photo) formData.append('photo', data.photo);

    return this.http.put<Dish>(`${this.apiUrl}/dishes/${dishId}`, formData);
  }

  /**
   * Move dish to another category
   */
  moveDish(dishId: number, categoryId: number | null): Observable<Dish> {
    return this.http.patch<Dish>(`${this.apiUrl}/dishes/${dishId}`, { categoryId });
  }

  /**
   * Delete a dish
   */
  deleteDish(dishId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/dishes/${dishId}`);
  }

  /**
   * Delete dish photo
   */
  deleteDishPhoto(dishId: number): Observable<Dish> {
    return this.http.delete<Dish>(`${this.apiUrl}/dishes/${dishId}/photo`);
  }

  /**
   * Reorder dishes
   */
  reorderDishes(dishIds: number[]): Observable<{ success: boolean }> {
    return this.http.put<{ success: boolean }>(`${this.apiUrl}/dishes/reorder`, {
      dishIds,
    });
  }

  // ===== FULL MENU =====

  /**
   * Get full menu with all categories and dishes
   */
  getFullMenu(): Observable<CategoryWithDishes[]> {
    return this.http.get<CategoryWithDishes[]>(`${this.apiUrl}/full`);
  }
}

