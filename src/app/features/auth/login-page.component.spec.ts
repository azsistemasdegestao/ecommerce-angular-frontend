import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginPageComponent } from './login-page.component';
import { AuthService } from '../../core/auth/auth.service';
import { ROLE_CLAIM } from '../../core/auth/jwt.util';
import { provideApiConfiguration } from '../../core/api/generated/api-configuration';
import { environment } from '../../../environments/environment';

const API = environment.apiBaseUrl;

function fakeJwt(role: string): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(
    JSON.stringify({ sub: 'user-1', email: 'user@test.com', [ROLE_CLAIM]: role, exp: 9999999999 }),
  );
  return `${header}.${payload}.signature`;
}

describe('LoginPageComponent', () => {
  let fixture: ComponentFixture<LoginPageComponent>;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginPageComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideApiConfiguration(environment.apiBaseUrl),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: new Map() } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPageComponent);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  function fillAndSubmit(email: string, password: string): void {
    const component = fixture.componentInstance as unknown as {
      form: { controls: { email: { setValue: (v: string) => void }; password: { setValue: (v: string) => void } } };
      submit: () => Promise<void>;
    };
    component.form.controls.email.setValue(email);
    component.form.controls.password.setValue(password);
    void component.submit();
  }

  it('AC-FE-AUTH-U-01: login with invalid credentials shows a generic message', async () => {
    fillAndSubmit('user@test.com', 'wrong');
    const req = httpMock.expectOne(`${API}/api/v1/auth/login`);
    req.flush({ title: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    await Promise.resolve();
    await Promise.resolve();
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Invalid email or password.');
  });

  it('AC-FE-AUTH-U-02: successful login updates session state', async () => {
    const authService = TestBed.inject(AuthService);
    const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    fillAndSubmit('user@test.com', 'Password@123');
    const req = httpMock.expectOne(`${API}/api/v1/auth/login`);
    req.flush({
      access_token: fakeJwt('Customer'),
      refresh_token: 'refresh-abc',
      expires_in: 3600,
      token_type: 'Bearer',
    });

    await Promise.resolve();
    await Promise.resolve();

    expect(authService.isAuthenticated()).toBe(true);
    expect(navigateSpy).toHaveBeenCalledWith('/');
  });

  it('redirects an Admin user to /admin when there is no returnUrl', async () => {
    const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    fillAndSubmit('admin@test.com', 'Password@123');
    const req = httpMock.expectOne(`${API}/api/v1/auth/login`);
    req.flush({
      access_token: fakeJwt('Admin'),
      refresh_token: 'refresh-abc',
      expires_in: 3600,
      token_type: 'Bearer',
    });

    await Promise.resolve();
    await Promise.resolve();

    expect(navigateSpy).toHaveBeenCalledWith('/admin');
  });

  it('honors an explicit returnUrl over the role-based default, even for an Admin', async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [LoginPageComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideApiConfiguration(environment.apiBaseUrl),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: new Map([['returnUrl', '/orders']]) } } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(LoginPageComponent);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    fixture.detectChanges();

    const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    fillAndSubmit('admin@test.com', 'Password@123');
    const req = httpMock.expectOne(`${API}/api/v1/auth/login`);
    req.flush({
      access_token: fakeJwt('Admin'),
      refresh_token: 'refresh-abc',
      expires_in: 3600,
      token_type: 'Bearer',
    });

    await Promise.resolve();
    await Promise.resolve();

    expect(navigateSpy).toHaveBeenCalledWith('/orders');
  });

  it('AC-FE-AUTH-U-07: client-side validation blocks submit with an empty password', async () => {
    fillAndSubmit('user@test.com', '');
    httpMock.expectNone(`${API}/api/v1/auth/login`);

    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Password is required.');
  });
});
