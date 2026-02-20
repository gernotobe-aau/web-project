import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CustomerProfile {
  id: string;
  firstName: string;
  lastName: string;
  address: {
    street: string;
    houseNumber: string;
    staircase?: string;
    door?: string;
    postalCode: string;
    city: string;
  };
  email: string;
}


export interface UpdateCustomerProfileData {
  firstName?: string;
  lastName?: string;
  email?: string;
  address: {
    street: string;
    houseNumber: string;
    staircase?: string;
    door?: string;
    postalCode: string;
    city: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class CustomerProfileService {
  private apiUrl = `${environment.apiBaseUrl}/customers`;

  constructor(private http: HttpClient) {}

  getProfile(): Observable<CustomerProfile> {
    return this.http.get<CustomerProfile>(`${this.apiUrl}/profile`);
  }

  updateProfile(data: UpdateCustomerProfileData): Observable<CustomerProfile> {
    return this.http.patch<CustomerProfile>(`${this.apiUrl}/profile`, data);
  }
}
