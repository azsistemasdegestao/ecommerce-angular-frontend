import { Routes } from '@angular/router';

export const catalogRoutes: Routes = [
  { path: '', loadComponent: () => import('./catalog-home.component').then((m) => m.CatalogHomeComponent) },
  {
    path: 'products/:slug',
    loadComponent: () => import('./product-detail.component').then((m) => m.ProductDetailComponent),
  },
  {
    path: 'categories/:slug',
    loadComponent: () => import('./catalog-home.component').then((m) => m.CatalogHomeComponent),
  },
];
