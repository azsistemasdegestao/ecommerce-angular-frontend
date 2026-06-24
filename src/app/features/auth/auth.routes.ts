import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const authRoutes: Routes = [
  { path: 'login', loadComponent: () => import('./login-page.component').then((m) => m.LoginPageComponent) },
  {
    path: 'register',
    loadComponent: () => import('./register-page.component').then((m) => m.RegisterPageComponent),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./forgot-password-page.component').then((m) => m.ForgotPasswordPageComponent),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./reset-password-page.component').then((m) => m.ResetPasswordPageComponent),
  },
  {
    path: 'account',
    canActivate: [authGuard],
    loadComponent: () => import('./account-page.component').then((m) => m.AccountPageComponent),
  },
];
