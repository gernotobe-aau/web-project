import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';

import { 
  AnalyticsService, 
  DailyAnalytics, 
  WeeklyAnalytics, 
  TopDishesResponse 
} from '../../../core/services/analytics.service';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatSnackBarModule
  ],
  templateUrl: './analytics.html',
  styleUrl: './analytics.css',
})
export class AnalyticsComponent implements OnInit {
  dailyAnalytics: DailyAnalytics | null = null;
  weeklyAnalytics: WeeklyAnalytics | null = null;
  topDishes: TopDishesResponse | null = null;
  
  loading = true;
  error: string | null = null;

  displayedColumns: string[] = ['rank', 'dishName', 'orderCount', 'totalQuantity'];

  constructor(
    private analyticsService: AnalyticsService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
      this.loadAnalytics();
    });
  }

  loadAnalytics(): void {
    this.loading = true;
    this.error = null;
    this.cdr.detectChanges();

    // Load all analytics data in parallel using forkJoin
    forkJoin({
      daily: this.analyticsService.getDailyOrderCount(),
      weekly: this.analyticsService.getWeeklyOrderCount(),
      topDishes: this.analyticsService.getTopDishes(10)
    }).subscribe({
      next: (result) => {
        this.dailyAnalytics = result.daily;
        this.weeklyAnalytics = result.weekly;
        this.topDishes = result.topDishes;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading analytics:', error);
        this.error = 'Fehler beim Laden der Statistiken';
        this.loading = false;
        this.cdr.detectChanges();
        this.snackBar.open('Fehler beim Laden der Statistiken', 'Schließen', {
          duration: 5000,
          panelClass: 'error-snackbar'
        });
      }
    });
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  formatWeekRange(): string {
    if (!this.weeklyAnalytics) {
      return '';
    }
    return `KW ${this.weeklyAnalytics.weekNumber}: ${this.formatDate(this.weeklyAnalytics.weekStart)} - ${this.formatDate(this.weeklyAnalytics.weekEnd)}`;
  }
}
