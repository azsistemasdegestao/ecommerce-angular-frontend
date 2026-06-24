import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { authGuard } from './auth.guard';

export const adminGuard: CanActivateFn = (route, state) => {
  const authResult = authGuard(route, state);
  if (authResult !== true) {
    return authResult;
  }

  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.currentUser()?.role === 'Admin') {
    return true;
  }

  return router.createUrlTree(['/']);
};
