import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HttpParams } from '@angular/common/http';


export interface RestaurantReview {
  reviewId: number;
  restaurantId: string;
  customerId: string;
  customerName: string;
  orderId: string;
  rating: number;
  comment: string;
  date: string;
}



@Injectable({
    providedIn:'root'
})
export class ReviewService{
    private apiUrl = `${environment.apiBaseUrl}`;
    constructor(private http: HttpClient) {}



    /**
     * create restaurant review (customer only)
     */
    createRestaurantReview(restaurantReview: RestaurantReview): Observable<RestaurantReview>{
        console.log('Received review to send:', restaurantReview)
        return this.http.post<RestaurantReview>(`${this.apiUrl}/restaurant-review`, restaurantReview)
    }

    /**
     * get restaurant reviews
     */
    getRestaurantReviews(restaurantId: string): Observable<RestaurantReview[]>{
        console.log('Received restaurant review requests:', restaurantId)
        let params = new HttpParams();
        if (restaurantId !== undefined) {
        params = params.set('restaurantId', restaurantId);
        }
        return this.http.get<RestaurantReview[]>(`${this.apiUrl}/restaurant-review`, {params})
    }
}