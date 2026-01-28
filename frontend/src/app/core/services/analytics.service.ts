import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DailyAnalytics {
  date: string;
  orderCount: number;
}

export interface WeeklyAnalytics {
  weekStart: string;
  weekEnd: string;
  weekNumber: number;
  orderCount: number;
}

export interface TopDish {
  dishId: number;
  dishName: string;
  orderCount: number;
  totalQuantity: number;
}

export interface TopDishesResponse {
  period: string;
  periodStart: string;
  periodEnd: string;
  dishes: TopDish[];
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private apiUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  /**
   * Get daily order count for today
   * @returns Observable of DailyAnalytics
   */
  getDailyOrderCount(): Observable<DailyAnalytics> {
    return this.http.get<DailyAnalytics>(`${this.apiUrl}/analytics/orders/daily`);
  }

  /**
   * Get weekly order count for current week (Monday - Sunday)
   * @returns Observable of WeeklyAnalytics
   */
  getWeeklyOrderCount(): Observable<WeeklyAnalytics> {
    return this.http.get<WeeklyAnalytics>(`${this.apiUrl}/analytics/orders/weekly`);
  }

  /**
   * Get top ordered dishes for current month
   * @param limit Optional limit (default 10)
   * @returns Observable of TopDishesResponse
   */
  getTopDishes(limit: number = 10): Observable<TopDishesResponse> {
    return this.http.get<TopDishesResponse>(`${this.apiUrl}/analytics/dishes/top`, {
      params: { limit: limit.toString() }
    });
  }
}
