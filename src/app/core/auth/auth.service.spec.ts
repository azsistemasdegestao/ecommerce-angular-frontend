import { HttpClient, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { AuthService, REFRESH_TOKEN_STORAGE_KEY } from './auth.service';
import { ROLE_CLAIM } from './jwt.util';
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

describe('AuthService bootstrap', () => {
  let authService: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideApiConfiguration(environment.apiBaseUrl),
      ],
    });
    authService = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    TestBed.inject(HttpClient);
  });

  it('AC-FE-FOUNDATION-U-07: silent bootstrap uses the stored refresh token', async () => {
    localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, 'stored-refresh-token');
    expect(authService.isAuthenticated()).toBe(false);

    const refreshPromise = authService.refresh();
    httpMock.expectOne(`${API}/api/v1/auth/refresh`).flush({
      access_token: fakeJwt('Customer'),
      refresh_token: 'rotated-refresh-token',
      expires_in: 3600,
      token_type: 'Bearer',
    });
    await refreshPromise;

    expect(authService.isAuthenticated()).toBe(true);
    expect(localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY)).toBe('rotated-refresh-token');
  });
});
