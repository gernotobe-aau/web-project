import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isAuth = authService.isAuthenticated();
  console.log('[AuthGuard] Checking authentication for:', state.url, 'Result:', isAuth);
  console.log('[AuthGuard] Current user:', authService.getCurrentUser());
  console.log('[AuthGuard] Token:', authService.getToken()?.substring(0, 20) + '...');

  if (isAuth) {
    console.log('[AuthGuard] Access granted');
    return true;
  }

  console.log('[AuthGuard] Access denied, redirecting to login');
  // Redirect to login with return URL
  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};
