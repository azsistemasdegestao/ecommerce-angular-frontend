import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const ordersRoutes: Routes = [
  {
    path: 'checkout',
    canActivate: [authGuard],
    loadComponent: () => import('./checkout-page.component').then((m) => m.CheckoutPageComponent),
  },
  {
    path: 'orders',
    canActivate: [authGuard],
    loadComponent: () => import('./orders-list.component').then((m) => m.OrdersListComponent),
  },
  {
    path: 'orders/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./order-detail.component').then((m) => m.OrderDetailComponent),
  },
  {
    path: 'orders/:id/payment',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./payment-status-page.component').then((m) => m.PaymentStatusPageComponent),
  },
];
