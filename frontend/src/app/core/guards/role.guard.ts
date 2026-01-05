import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const allowedRoles = route.data['roles'] as string[];
  const userRole = authService.getUserRole();

  console.log('[RoleGuard] Checking role for:', state.url);
  console.log('[RoleGuard] Allowed roles:', allowedRoles);
  console.log('[RoleGuard] User role:', userRole);
  console.log('[RoleGuard] Current user:', authService.getCurrentUser());

  if (userRole && allowedRoles.includes(userRole)) {
    console.log('[RoleGuard] Access granted');
    return true;
  }

  // User doesn't have the required role
  console.warn(`[RoleGuard] Access denied. Required roles: ${allowedRoles}, User role: ${userRole}`);
  router.navigate(['/forbidden']);
  return false;
};
