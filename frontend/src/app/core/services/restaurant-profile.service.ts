import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface RestaurantProfile {
  id: string;
  name: string;
  address: {
    street: string;
    houseNumber: string;
    staircase?: string;
    door?: string;
    postalCode: string;
    city: string;
  };
  contactEmail: string;
  contactPhone: string;
  categories: string[];
  openingHours: OpeningHoursData[];
}

export interface OpeningHoursData {
  dayOfWeek: string;
  isClosed: boolean;
  timeSlots: TimeSlot[];
}

export interface TimeSlot {
  start: string;
  end: string;
}

export interface UpdateRestaurantProfileData {
  name?: string;
  contactEmail?: string;
  contactPhone?: string;
  categories?: string[];
  openingHours?: OpeningHoursData[];
}

@Injectable({
  providedIn: 'root'
})
export class RestaurantProfileService {
  private apiUrl = `${environment.apiBaseUrl}/restaurants`;

  constructor(private http: HttpClient) {}

  getProfile(): Observable<RestaurantProfile> {
    return this.http.get<RestaurantProfile>(`${this.apiUrl}/profile`);
  }

  updateProfile(data: UpdateRestaurantProfileData): Observable<RestaurantProfile> {
    return this.http.patch<RestaurantProfile>(`${this.apiUrl}/profile`, data);
  }
}
