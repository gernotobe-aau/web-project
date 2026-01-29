import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface RestaurantAddress {
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
}

export interface OpeningHour {
  dayOfWeek: number; // 0-6 (0=Sunday)
  day: string;
  openTime?: string | null;
  closeTime?: string | null;
  isClosed: boolean;
}

export interface Restaurant {
  id: string;
  name: string;
  categories: string[];
  address: RestaurantAddress;
  contactPhone?: string;
  contactEmail?: string;
  openingHours?: OpeningHour[];
  averageRating: number | null;
  estimatedDeliveryTime: number;
  isOpen: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class RestaurantService {
  constructor(private http: HttpClient) {}

  /**
   * Get all available restaurants
   */
  getRestaurants(): Observable<Restaurant[]> {
    return this.http.get<Restaurant[]>(`${environment.apiBaseUrl}/restaurants`);
  }

  /**
   * Get restaurant by ID
   * Note: This will be implemented in a later feature
   */
  getRestaurantById(id: string): Observable<Restaurant> {
    return this.http.get<Restaurant>(`${environment.apiBaseUrl}/restaurants/${id}`);
  }
}
