import { Routes } from '@angular/router';
import { adminGuard } from '../../core/guards/admin.guard';

export const adminRoutes: Routes = [
  {
    path: '',
    canActivate: [adminGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'products' },
      {
        path: 'products',
        loadComponent: () =>
          import('./products/admin-products-page.component').then((m) => m.AdminProductsPageComponent),
      },
      {
        path: 'products/new',
        loadComponent: () =>
          import('./products/admin-product-create-page.component').then(
            (m) => m.AdminProductCreatePageComponent,
          ),
      },
      {
        path: 'products/:id/edit',
        loadComponent: () =>
          import('./products/admin-product-edit-page.component').then(
            (m) => m.AdminProductEditPageComponent,
          ),
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./orders/admin-orders-page.component').then((m) => m.AdminOrdersPageComponent),
      },
      {
        path: 'orders/:id',
        loadComponent: () =>
          import('./orders/admin-order-detail-page.component').then(
            (m) => m.AdminOrderDetailPageComponent,
          ),
      },
      {
        path: 'payments',
        loadComponent: () =>
          import('./payments/admin-payments-page.component').then((m) => m.AdminPaymentsPageComponent),
      },
    ],
  },
];
