import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { Restaurant, RestaurantService, OpeningHour } from '../../../core/services/restaurant.service';
import { User } from '../../../core/models/auth.models';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-restaurant-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule
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

  dayNames: string[] = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

  constructor(private route: ActivatedRoute, private restaurantService: RestaurantService, private cdr: ChangeDetectorRef,private authService: AuthService) {}

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
  }

  formatOpeningHours(hours: OpeningHour): string {
    if(hours.isClosed) {
      return 'Geschlossen';
    } else {
      return `${hours.openTime || '-'} - ${hours.closeTime || '-'}`;
    }
  }
}
