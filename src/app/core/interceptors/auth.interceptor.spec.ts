import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../auth/auth.service';
import { provideApiConfiguration } from '../api/generated/api-configuration';
import { environment } from '../../../environments/environment';

const API = environment.apiBaseUrl;

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authService: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideApiConfiguration(environment.apiBaseUrl),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);
  });

  async function login(accessToken: string, refreshToken = 'refresh-1'): Promise<void> {
    const promise = authService.login('user@test.com', 'Password@123');
    httpMock.expectOne(`${API}/api/v1/auth/login`).flush({
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 3600,
      token_type: 'Bearer',
    });
    await promise;
  }

  it('AC-FE-FOUNDATION-U-01: attaches Bearer token when an access token is in memory', async () => {
    await login('token-abc');

    http.get(`${API}/api/v1/cart`).subscribe();
    const req = httpMock.expectOne(`${API}/api/v1/cart`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer token-abc');
    req.flush({});
  });

  it('AC-FE-FOUNDATION-U-02: does not attach a token on public routes', () => {
    http.get(`${API}/api/v1/catalog/products`).subscribe();
    const req = httpMock.expectOne(`${API}/api/v1/catalog/products`);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('AC-FE-FOUNDATION-U-03: performs an automatic refresh on 401 and retries the request', async () => {
    await login('token-old');

    let result: unknown;
    let errored = false;
    http.get(`${API}/api/v1/cart`).subscribe({
      next: (value) => (result = value),
      error: () => (errored = true),
    });

    const firstAttempt = httpMock.expectOne(`${API}/api/v1/cart`);
    firstAttempt.flush({ title: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    await Promise.resolve();
    await Promise.resolve();

    httpMock.expectOne(`${API}/api/v1/auth/refresh`).flush({
      access_token: 'token-new',
      refresh_token: 'refresh-2',
      expires_in: 3600,
      token_type: 'Bearer',
    });

    await Promise.resolve();
    await Promise.resolve();

    const retried = httpMock.expectOne(`${API}/api/v1/cart`);
    expect(retried.request.headers.get('Authorization')).toBe('Bearer token-new');
    retried.flush({ items: [] });

    await Promise.resolve();

    expect(errored).toBe(false);
    expect(result).toEqual({ items: [] });
  });

  it('AC-FE-FOUNDATION-U-04: forces a local logout if the refresh also fails', async () => {
    await login('token-old');

    let errored = false;
    http.get(`${API}/api/v1/cart`).subscribe({ error: () => (errored = true) });

    httpMock
      .expectOne(`${API}/api/v1/cart`)
      .flush({ title: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    await Promise.resolve();
    await Promise.resolve();

    httpMock
      .expectOne(`${API}/api/v1/auth/refresh`)
      .flush({ title: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    await Promise.resolve();
    await Promise.resolve();

    expect(errored).toBe(true);
    expect(authService.currentUser()).toBeNull();
    expect(localStorage.getItem('ecommerce_refresh_token')).toBeNull();
  });
});
