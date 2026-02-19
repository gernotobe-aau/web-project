import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';


export interface RestaurantReview {
  reviewId: number;
  restaurantId: string;
  customerId: string;
  orderId: string;
  rating: number;
  comment: string;
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
}