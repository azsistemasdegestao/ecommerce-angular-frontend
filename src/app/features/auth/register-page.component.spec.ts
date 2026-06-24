import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { RegisterPageComponent } from './register-page.component';
import { provideApiConfiguration } from '../../core/api/generated/api-configuration';
import { environment } from '../../../environments/environment';

const API = environment.apiBaseUrl;

describe('RegisterPageComponent', () => {
  let fixture: ComponentFixture<RegisterPageComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterPageComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideApiConfiguration(environment.apiBaseUrl),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterPageComponent);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  function fillForm(overrides: Partial<Record<string, string>> = {}): void {
    const component = fixture.componentInstance as unknown as {
      form: { setValue: (v: Record<string, string>) => void };
    };
    component.form.setValue({
      first_name: 'Test',
      last_name: 'User',
      email: 'user@test.com',
      password: 'Password@123',
      confirmPassword: 'Password@123',
      ...overrides,
    });
  }

  it('AC-FE-AUTH-U-03: registration with duplicate email shows a field error', async () => {
    fillForm();
    const component = fixture.componentInstance as unknown as { submit: () => Promise<void> };
    void component.submit();

    const req = httpMock.expectOne(`${API}/api/v1/auth/register`);
    req.flush({ title: 'Conflict' }, { status: 409, statusText: 'Conflict' });

    await Promise.resolve();
    await Promise.resolve();
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('This email is already registered.');
  });
});
