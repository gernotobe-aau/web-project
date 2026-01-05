import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

import { LandingComponent } from './features/public/landing/landing';
import { LoginComponent } from './features/public/login/login';
import { RegisterComponent } from './features/public/register/register';
import { ForbiddenComponent } from './features/public/forbidden/forbidden';
import { DashboardComponent as CustomerDashboardComponent } from './features/customer/dashboard/dashboard';
import { MenuManagementComponent } from './features/restaurant/menu-management/menu-management';

export const routes: Routes = [
  // Public routes
  { path: '', component: LandingComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'forbidden', component: ForbiddenComponent },

  // Customer routes (protected)
  {
    path: 'customer',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['customer'] },
    children: [
      { path: '', component: CustomerDashboardComponent },
      { path: 'dashboard', component: CustomerDashboardComponent }
    ]
  },

  // Restaurant routes (protected)
  {
    path: 'restaurant',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['restaurantOwner'] },
    children: [
      { path: '', redirectTo: 'menu-management', pathMatch: 'full' },
      { path: 'menu-management', component: MenuManagementComponent }
    ]
  },

  // Fallback
  { path: '**', redirectTo: '' }
];
