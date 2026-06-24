import { HttpClient, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, UrlTree } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { adminGuard } from './admin.guard';
import { AuthService } from '../auth/auth.service';
import { ROLE_CLAIM } from '../auth/jwt.util';
import { provideApiConfiguration } from '../api/generated/api-configuration';
import { environment } from '../../../environments/environment';

const API = environment.apiBaseUrl;

function fakeJwt(role: string): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(
    JSON.stringify({ sub: 'user-1', email: 'customer@test.com', [ROLE_CLAIM]: role, exp: 9999999999 }),
  );
  return `${header}.${payload}.signature`;
}

describe('adminGuard', () => {
  let router: Router;
  let authService: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideApiConfiguration(environment.apiBaseUrl),
        Router,
      ],
    });
    router = TestBed.inject(Router);
    authService = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    TestBed.inject(HttpClient);
  });

  it('AC-FE-FOUNDATION-U-06: blocks an authenticated Customer from /admin/products', async () => {
    const promise = authService.login('customer@test.com', 'Password@123');
    httpMock.expectOne(`${API}/api/v1/auth/login`).flush({
      access_token: fakeJwt('Customer'),
      refresh_token: 'refresh-1',
      expires_in: 3600,
      token_type: 'Bearer',
    });
    await promise;

    const result = TestBed.runInInjectionContext(() =>
      adminGuard({} as never, { url: '/admin/products' } as never),
    );

    expect(authService.currentUser()?.role).toBe('Customer');
    expect(result).not.toBe(true);
    expect(router.serializeUrl(result as UrlTree)).toBe('/');
  });
});
