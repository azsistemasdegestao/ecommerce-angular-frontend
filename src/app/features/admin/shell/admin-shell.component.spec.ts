import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminShellComponent } from './admin-shell.component';
import { AuthService } from '../../../core/auth/auth.service';

@Component({ template: 'dummy' })
class DummyPageComponent {}

describe('AdminShellComponent', () => {
  let harness: RouterTestingHarness;
  let router: Router;
  let authService: { currentUser: () => null; logout: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    authService = { currentUser: () => null, logout: vi.fn().mockResolvedValue(undefined) };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {
            path: 'admin',
            component: AdminShellComponent,
            children: [
              { path: 'products', component: DummyPageComponent, data: { title: 'Products' } },
              { path: 'orders', component: DummyPageComponent, data: { title: 'Orders' } },
            ],
          },
          { path: 'login', component: DummyPageComponent },
        ]),
        { provide: AuthService, useValue: authService },
      ],
    });

    harness = await RouterTestingHarness.create();
    router = TestBed.inject(Router);
  });

  it('AC-FE-ADMINSHELL-U-01: shows the current section title in the hero and updates on navigation', async () => {
    await harness.navigateByUrl('/admin/products');
    const el = harness.routeNativeElement as HTMLElement;
    expect(el.textContent).toContain('Products');

    await harness.navigateByUrl('/admin/orders');
    expect(el.textContent).toContain('Orders');
  });

  it('AC-FE-ADMINSHELL-U-02: toggling the header menu button opens and closes the mobile sidebar', async () => {
    await harness.navigateByUrl('/admin/products');
    const el = harness.routeNativeElement as HTMLElement;
    const menuButton = el.querySelector('button[aria-label="Menu"]') as HTMLButtonElement;
    const aside = el.querySelector('aside') as HTMLElement;

    expect(aside.classList.contains('-translate-x-full')).toBe(true);

    menuButton.click();
    harness.detectChanges();
    expect(aside.classList.contains('translate-x-0')).toBe(true);

    menuButton.click();
    harness.detectChanges();
    expect(aside.classList.contains('-translate-x-full')).toBe(true);
  });

  it('AC-FE-ADMINSHELL-U-03: logging out calls AuthService.logout and navigates to /login', async () => {
    await harness.navigateByUrl('/admin/products');
    const el = harness.routeNativeElement as HTMLElement;
    const logoutButton = Array.from(el.querySelectorAll('button')).find((b) => b.textContent?.trim() === 'Logout');

    logoutButton?.click();
    await vi.waitFor(() => expect(router.url).toBe('/login'));

    expect(authService.logout).toHaveBeenCalled();
    expect(router.url).toBe('/login');
  });
});
