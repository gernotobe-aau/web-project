import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  console.log('[AuthInterceptor] Request to:', req.url);
  console.log('[AuthInterceptor] Token exists:', !!token);
  
  if (token) {
    console.log('[AuthInterceptor] Adding Authorization header with token:', token.substring(0, 20) + '...');
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(cloned);
  }

  console.log('[AuthInterceptor] No token found, proceeding without auth header');
  return next(req);
};
