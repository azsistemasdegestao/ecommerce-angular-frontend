import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { ToastService } from '../../shared/toast/toast.service';
import { toApiError } from '../api/api-error';

const PUBLIC_ROUTE_PATTERNS: RegExp[] = [
  /\/auth\/login$/,
  /\/auth\/register$/,
  /\/auth\/forgot-password$/,
  /\/auth\/reset-password$/,
  /\/auth\/refresh$/,
];

// GET /catalog/** is public; POST/PUT/DELETE (admin mutations) still require auth.
function isPublicRoute(url: string, method: string): boolean {
  if (method === 'GET' && /\/catalog\//.test(url)) {
    return true;
  }
  return PUBLIC_ROUTE_PATTERNS.some((pattern) => pattern.test(url));
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const toastService = inject(ToastService);

  const accessToken = authService.getAccessToken();
  const shouldAttachToken = !isPublicRoute(req.url, req.method) && accessToken;
  const authorizedReq = shouldAttachToken
    ? req.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } })
    : req;

  return next(authorizedReq).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) {
        return throwError(() => error);
      }

      if (error.status === 401 && !isPublicRoute(req.url, req.method)) {
        return from(authService.refresh()).pipe(
          switchMap((refreshed) => {
            if (!refreshed) {
              authService.clearSession();
              return throwError(() => toApiError(error.status, error.error, error.headers.get('Retry-After')));
            }
            const retriedReq = req.clone({
              setHeaders: { Authorization: `Bearer ${authService.getAccessToken()}` },
            });
            return next(retriedReq);
          }),
        );
      }

      const retryAfter = error.headers.get('Retry-After');
      const apiError = toApiError(error.status, error.error, retryAfter);

      if (error.status === 429) {
        const seconds = apiError.retryAfterSeconds ?? 0;
        toastService.show('warning', `Too many requests. Try again in ${seconds}s.`);
      }

      return throwError(() => apiError);
    }),
  );
};
