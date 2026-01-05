import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Log the error for debugging
      console.error('HTTP Error:', {
        status: error.status,
        message: error.message,
        url: error.url,
        error: error.error
      });

      // Handle specific status codes globally
      if (error.status === 401 && !req.url.includes('/auth/login')) {
        // Only redirect to login if it's not the login request itself
        authService.logout();
        router.navigate(['/login']);
      }

      // Return the original error so components can handle it
      return throwError(() => error);
    })
  );
};
