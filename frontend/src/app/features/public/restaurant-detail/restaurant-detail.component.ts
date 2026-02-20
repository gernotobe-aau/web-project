import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormField } from '@angular/material/form-field';
import { MatLabel } from '@angular/material/form-field';
import { MatDivider } from '@angular/material/divider';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { Restaurant, RestaurantService, OpeningHour } from '../../../core/services/restaurant.service';
import { User } from '../../../core/models/auth.models';
import { AuthService } from '../../../core/services/auth.service';
import { ReviewService, RestaurantReview } from '../../../core/services/review.service';

@Component({
  selector: 'app-restaurant-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    FormsModule,
    MatFormField,
    MatLabel,
    MatInputModule,
    MatDivider
  ],
  templateUrl: './restaurant-detail.component.html',
  styleUrl: './restaurant-detail.component.css'
})
export class RestaurantDetailComponent implements OnInit {
  restaurantId: string | null = null;
  restaurant: Restaurant | null = null;
  loading = true;
  error: string | null = null;
  currentUser: User | null = null;
  reviewText: string = '';
  restaurantReviews: RestaurantReview[] = [];
  reviewStars: number = 0;

  dayNames: string[] = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

  constructor(private route: ActivatedRoute, private restaurantService: RestaurantService, private cdr: ChangeDetectorRef,private authService: AuthService, private reviewService: ReviewService) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
    this.route.paramMap.subscribe(params => {
      this.restaurantId = params.get('id');
      console.log('Restaurant id:', this.restaurantId);

      if (this.restaurantId) {
        this.restaurantService.getRestaurants().subscribe({
          next: (restaurants) => {
            console.log('Fetched restaurant data:', restaurants);
            const found = restaurants.find(r => r.id === this.restaurantId);
            console.log('Found restaurant:', found);
            if(found){
              this.restaurant = found;
              this.error = null;
            } else {
              this.error = 'Restaurant not found.';
              this.restaurant = null;
            }
            this.loading = false;
            this.cdr.markForCheck();
          },
          error : (err) => {
            console.error('Error fetching restaurant data:', err);
            this.error = 'Failed to load restaurant data.';
            this.loading = false;
            this.restaurant = null;
            this.cdr.markForCheck();
          }
        });
      }else{
        this.error = 'No Restaurant-ID.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
    this.loadReviews();
  }

  formatOpeningHours(hours: OpeningHour): string {
    if(hours.isClosed) {
      return 'Geschlossen';
    } else {
      return `${hours.openTime || '-'} - ${hours.closeTime || '-'}`;
    }
  }

  saveReview(review: string, rating: number): void {
    let restaurantReview = {} as RestaurantReview
    restaurantReview.restaurantId = this.restaurantId!
    restaurantReview.comment = review
    restaurantReview.rating = rating
    this.reviewService.createRestaurantReview(restaurantReview).subscribe({
      next: (c) =>{
        console.log('successfully seend review to backend:', c)
      },
      error: (e) =>{
        console.log('error creating review:', e)
      }
    })
    this.reviewText = "";
    this.reviewStars = 0;
    this.loadReviews;
  }

  setRating(stars: number){
    if(this.reviewStars === stars){
      this.reviewStars = 0
    }else{
      this.reviewStars = stars;
    }
  }

  loadReviews(): void{
    this.reviewService.getRestaurantReviews(this.restaurantId!).subscribe({
      next: (r) =>{
        this.restaurantReviews = r
      },
      error: (e) =>{
        console.log('error loading reviews:', e)
      }
    })
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
