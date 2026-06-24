import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { ResetPasswordPageComponent } from './reset-password-page.component';
import { provideApiConfiguration } from '../../core/api/generated/api-configuration';
import { environment } from '../../../environments/environment';

const API = environment.apiBaseUrl;

function activatedRouteWith(params: Record<string, string>) {
  const map = new Map(Object.entries(params));
  return { snapshot: { queryParamMap: map } };
}

describe('ResetPasswordPageComponent', () => {
  let httpMock: HttpTestingController;

  async function createFixture(
    queryParams: Record<string, string>,
  ): Promise<ComponentFixture<ResetPasswordPageComponent>> {
    await TestBed.configureTestingModule({
      imports: [ResetPasswordPageComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideApiConfiguration(environment.apiBaseUrl),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: activatedRouteWith(queryParams) },
      ],
    }).compileComponents();
    httpMock = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(ResetPasswordPageComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('AC-FE-AUTH-U-05: reset password with an invalid token shows an error', async () => {
    const fixture = await createFixture({ email: 'user@test.com', token: 'bad-token' });
    const component = fixture.componentInstance as unknown as {
      form: { setValue: (v: Record<string, string>) => void };
      submit: () => Promise<void>;
    };
    component.form.setValue({ newPassword: 'NewPassword@1', confirmPassword: 'NewPassword@1' });
    void component.submit();

    const req = httpMock.expectOne(`${API}/api/v1/auth/reset-password`);
    req.flush({ title: 'Invalid token' }, { status: 422, statusText: 'Unprocessable Entity' });

    await Promise.resolve();
    await Promise.resolve();
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('This reset link is invalid or has expired.');
    expect(el.textContent).toContain('Request a new link');
  });
});
