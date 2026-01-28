import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { Restaurant, RestaurantService } from '../../../core/services/restaurant.service';
import { RestaurantCardComponent } from '../../../shared/components/restaurant-card/restaurant-card.component';

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

  constructor(private route: ActivatedRoute, private restaurantService: RestaurantService) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.restaurantId = params.get('id');
      console.log('Restaurant id:', this.restaurantId);
      if (this.restaurantId) {
        this.restaurantService.getRestaurantById(this.restaurantId).subscribe(
          data => this.restaurant = data
        );
      }
    });
  }
}

export interface RestaurantDetailData {
  restaurant: Restaurant;
}
