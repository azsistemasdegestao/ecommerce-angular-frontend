import { Routes } from '@angular/router';
import { adminGuard } from '../../core/guards/admin.guard';

export const adminRoutes: Routes = [
  {
    path: '',
    canActivate: [adminGuard],
    loadComponent: () => import('./shell/admin-shell.component').then((m) => m.AdminShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'products' },
      {
        path: 'products',
        data: { title: 'Products' },
        loadComponent: () =>
          import('./products/admin-products-page.component').then((m) => m.AdminProductsPageComponent),
      },
      {
        path: 'products/new',
        data: { title: 'New Product' },
        loadComponent: () =>
          import('./products/admin-product-create-page.component').then(
            (m) => m.AdminProductCreatePageComponent,
          ),
      },
      {
        path: 'products/:id/edit',
        data: { title: 'Edit Product' },
        loadComponent: () =>
          import('./products/admin-product-edit-page.component').then(
            (m) => m.AdminProductEditPageComponent,
          ),
      },
      {
        path: 'orders',
        data: { title: 'Orders' },
        loadComponent: () =>
          import('./orders/admin-orders-page.component').then((m) => m.AdminOrdersPageComponent),
      },
      {
        path: 'orders/:id',
        data: { title: 'Order Detail' },
        loadComponent: () =>
          import('./orders/admin-order-detail-page.component').then(
            (m) => m.AdminOrderDetailPageComponent,
          ),
      },
      {
        path: 'payments',
        data: { title: 'Payments' },
        loadComponent: () =>
          import('./payments/admin-payments-page.component').then((m) => m.AdminPaymentsPageComponent),
      },
    ],
  },
];
