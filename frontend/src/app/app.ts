import { Component, signal, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './layout/header/header.component';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('frontend');
  private authService = inject(AuthService);

  ngOnInit(): void {
    // Check if token is expired on app startup
    // This handles the case when the user returns after the token expired
    if (this.authService.getToken() && !this.authService.isAuthenticated()) {
      console.log('[App] Token expired, logging out');
      this.authService.logout();
    }
  }
}
