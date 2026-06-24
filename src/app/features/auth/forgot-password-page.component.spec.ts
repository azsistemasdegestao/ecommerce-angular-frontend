import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { ForgotPasswordPageComponent } from './forgot-password-page.component';
import { provideApiConfiguration } from '../../core/api/generated/api-configuration';
import { environment } from '../../../environments/environment';

const API = environment.apiBaseUrl;

describe('ForgotPasswordPageComponent', () => {
  let fixture: ComponentFixture<ForgotPasswordPageComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForgotPasswordPageComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideApiConfiguration(environment.apiBaseUrl),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPasswordPageComponent);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  function submitWith(email: string): void {
    const component = fixture.componentInstance as unknown as {
      form: { controls: { email: { setValue: (v: string) => void } } };
      submit: () => Promise<void>;
    };
    component.form.controls.email.setValue(email);
    void component.submit();
  }

  it('AC-FE-AUTH-U-04: shows the same success message whether the email exists or not (200)', async () => {
    submitWith('exists@test.com');
    httpMock.expectOne(`${API}/api/v1/auth/forgot-password`).flush(null);

    await Promise.resolve();
    await Promise.resolve();
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain("If that email exists, you'll receive instructions");
  });

  it('AC-FE-AUTH-U-04: shows the same success message even when the request errors (non-429)', async () => {
    submitWith('unknown@test.com');
    httpMock
      .expectOne(`${API}/api/v1/auth/forgot-password`)
      .flush({ title: 'Bad Request' }, { status: 400, statusText: 'Bad Request' });

    await Promise.resolve();
    await Promise.resolve();
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain("If that email exists, you'll receive instructions");
  });
});
