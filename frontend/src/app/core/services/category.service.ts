import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  constructor(private http: HttpClient) {}

  /**
   * Get all available cuisine categories
   */
  getCategories(): Observable<string[]> {
    return this.http.get<string[]>(`${environment.apiBaseUrl}/categories`);
  }
}
