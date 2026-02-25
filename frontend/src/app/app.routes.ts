import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

import { LandingComponent } from './features/public/landing/landing';
import { LoginComponent } from './features/public/login/login';
import { RegisterComponent } from './features/public/register/register';
import { ForbiddenComponent } from './features/public/forbidden/forbidden';
import { RestaurantDetailComponent } from './features/public/restaurant-detail/restaurant-detail.component';
import { MenuManagementComponent } from './features/restaurant/menu-management/menu-management';
import { ProfileComponent } from './features/restaurant/profile/profile';
import { ProfileComponent as CustomerProfileComponent } from './features/customer/profile/profile';
import { OrderOverviewComponent } from './features/restaurant/order-overview/order-overview.component';
import { OrderOverviewComponent as CustomerOrderOverviewComponent } from './features/customer/order-overview/order-overview.component';
import { AnalyticsComponent } from './features/restaurant/analytics/analytics';
import { MenuViewComponent } from './features/customer/menu-overview/menu-view';
import { CartcheckoutComponent } from './features/customer/cartcheckout/cartcheckout';
import { CommunityBoardComponent } from './features/public/community-board/community-board';
import { DiscussionComponent } from './features/public/discussion/discussion';

export const routes: Routes = [
  // Public routes
  { path: '', component: LandingComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'forbidden', component: ForbiddenComponent },
  { path: 'restaurants/:id', component: RestaurantDetailComponent },
  { path: 'restaurants-forum/:id', component: CommunityBoardComponent},
  { path: 'forum-discussion/:id', component: DiscussionComponent},

  // Restaurant routes (protected)
  {
    path: 'restaurant',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['restaurantOwner'] },
    children: [
      { path: '', redirectTo: 'menu-management', pathMatch: 'full' },
      { path: 'menu-management', component: MenuManagementComponent },
      { path: 'profile', component: ProfileComponent },
      { path: 'orders', component: OrderOverviewComponent },
      { path: 'analytics', component: AnalyticsComponent }
    ]
  },

  // Customer routes (protected)
  {
    path: 'customer',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['customer'] },
    children: [
      { path: '', redirectTo: 'landing', pathMatch: 'full' },
      { path: 'profile', component: CustomerProfileComponent },
      { path: 'menu', component: MenuViewComponent },
      { path: 'menu/:restaurantId', component: MenuViewComponent },
      { path: 'cartcheckout', component: CartcheckoutComponent },
      { path: 'orders', component: CustomerOrderOverviewComponent}
    ]
  },

  // Fallback
  { path: '**', redirectTo: '' }
];
