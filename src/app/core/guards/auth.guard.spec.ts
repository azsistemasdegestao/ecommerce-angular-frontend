import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, UrlTree } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { authGuard } from './auth.guard';
import { provideApiConfiguration } from '../api/generated/api-configuration';
import { environment } from '../../../environments/environment';

describe('authGuard', () => {
  let router: Router;

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
  });

  it('AC-FE-FOUNDATION-U-05: blocks a route without a session and redirects to /login with returnUrl', () => {
    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as never, { url: '/account' } as never),
    );

    expect(result).not.toBe(true);
    const tree = result as UrlTree;
    expect(router.serializeUrl(tree)).toBe('/login?returnUrl=%2Faccount');
  });
});
