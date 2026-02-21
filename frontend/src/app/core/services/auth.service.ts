import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { 
  LoginRequest, 
  LoginResponse, 
  User, 
  CustomerRegistrationDto, 
  RestaurantOwnerRegistrationDto,
  AuthResponse 
} from '../models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';
  private currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());

  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  /**
   * Register a new customer
   */
  registerCustomer(data: CustomerRegistrationDto): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiBaseUrl}/auth/register/customer`, data)
      .pipe(
        tap(response => {
          this.setToken(response.accessToken);
          const user: User = {
            id: response.userId,
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            role: 'customer'
          };
          this.setUser(user);
          this.currentUserSubject.next(user);
        })
      );
  }

  /**
   * Register a new restaurant owner
   */
  registerRestaurantOwner(data: RestaurantOwnerRegistrationDto): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiBaseUrl}/auth/register/restaurant-owner`, data)
      .pipe(
        tap(response => {
          this.setToken(response.accessToken);
          const user: User = {
            id: response.userId,
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            role: 'restaurantOwner',
            restaurantId: response.restaurantId
          };
          this.setUser(user);
          this.currentUserSubject.next(user);
        })
      );
  }

  /**
   * Login for both customers and restaurant owners
   */
  login(email: string, password: string): Observable<LoginResponse> {
    const request: LoginRequest = { email, password };
    console.log('[AuthService] Starting login for:', email);
    return this.http.post<LoginResponse>(`${environment.apiBaseUrl}/auth/login`, request)
      .pipe(
        tap(response => {
          console.log('[AuthService] Login response received:', response);
          this.setToken(response.accessToken);
          console.log('[AuthService] Token saved');
          this.setUser(response.user);
          console.log('[AuthService] User saved:', response.user);
          this.currentUserSubject.next(response.user);
          console.log('[AuthService] Login complete');
        })
      );
  }

  /**
   * Logout and navigate to home
   */
  logout(): void {
    //localStorage.removeItem(this.TOKEN_KEY);
    //localStorage.removeItem(this.USER_KEY);
    localStorage.clear() //nuke all for security and stability
    this.currentUserSubject.next(null);
    this.router.navigate(['/']);
  }

  /**
   * Get current JWT token
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Get current user from observable
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Get user role
   */
  getUserRole(): 'customer' | 'restaurantOwner' | null {
    const user = this.getCurrentUser();
    return user?.role || null;
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: 'customer' | 'restaurantOwner'): boolean {
    return this.getUserRole() === role;
  }

  /**
   * Check if user is authenticated (has valid token)
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    console.log('[AuthService] isAuthenticated - token exists:', !!token);
    if (!token) {
      return false;
    }

    // Check if token is expired
    try {
      const payload = this.parseJwt(token);
      console.log('[AuthService] isAuthenticated - parsed payload:', payload);
      const now = Math.floor(Date.now() / 1000);
      console.log('[AuthService] isAuthenticated - now:', now, 'exp:', payload.exp);
      const isValid = payload.exp > now;
      console.log('[AuthService] isAuthenticated - result:', isValid);
      return isValid;
    } catch (error) {
      console.error('[AuthService] isAuthenticated - parse error:', error);
      return false;
    }
  }

  private setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  private setUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  private getUserFromStorage(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (!userStr) {
      return null;
    }
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  private parseJwt(token: string): any {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  }
}
