import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/auth.models';

interface Restaurant {
  id: string;
  name: string;
  categories: string[];
  rating: number;
  deliveryTime: string;
  imageUrl: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent implements OnInit {
  currentUser: User | null = null;
  restaurants: Restaurant[] = [];
  isLoading = true;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadRestaurants();
  }

  loadRestaurants(): void {
    // Mock data for now - will be replaced with actual API call in future sprint
    setTimeout(() => {
      this.restaurants = [
        {
          id: '1',
          name: 'Pizza Paradiso',
          categories: ['italienisch', 'pizza'],
          rating: 4.5,
          deliveryTime: '30-45 min',
          imageUrl: 'https://via.placeholder.com/300x200?text=Pizza+Paradiso'
        },
        {
          id: '2',
          name: 'Sushi Master',
          categories: ['asiatisch', 'sushi'],
          rating: 4.8,
          deliveryTime: '45-60 min',
          imageUrl: 'https://via.placeholder.com/300x200?text=Sushi+Master'
        },
        {
          id: '3',
          name: 'Burger House',
          categories: ['amerikanisch', 'burger'],
          rating: 4.2,
          deliveryTime: '25-35 min',
          imageUrl: 'https://via.placeholder.com/300x200?text=Burger+House'
        }
      ];
      this.isLoading = false;
    }, 1000);
  }

  onLogout(): void {
    if (confirm('Möchten Sie sich wirklich abmelden?')) {
      this.authService.logout();
    }
  }
}
