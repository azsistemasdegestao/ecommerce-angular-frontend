import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { AdminPaymentsPageComponent } from './admin-payments-page.component';
import { provideApiConfiguration } from '../../../core/api/generated/api-configuration';
import { environment } from '../../../../environments/environment';

const API = environment.apiBaseUrl;

describe('AdminPaymentsPageComponent', () => {
  let fixture: ComponentFixture<AdminPaymentsPageComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminPaymentsPageComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideApiConfiguration(environment.apiBaseUrl),
        provideRouter([]),
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(AdminPaymentsPageComponent);
    fixture.detectChanges();

    httpMock.expectOne((r) => r.url === `${API}/api/v1/admin/payments`).flush({
      items: [
        { id: 'pay-1', order_id: 'order-1', user_id: 'u1', user_email: 'a@test.com', amount: 49.9, status: 'Processed', created_at: '2024-01-01T00:00:00Z' },
      ],
      page_number: 1,
      page_size: 20,
      total_count: 1,
    });
    await Promise.resolve();
    await Promise.resolve();
    fixture.detectChanges();
  });

  it('AC-FE-ADMINPAYMENTS-U-02: refund requires confirmation before calling the API', () => {
    const el: HTMLElement = fixture.nativeElement;
    const refundButton = Array.from(el.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Refund'),
    );
    refundButton?.click();
    fixture.detectChanges();

    expect(el.textContent).toContain('Refund payment');
    expect(el.textContent).toContain('49.90');
    httpMock.expectNone(`${API}/api/v1/admin/payments/pay-1/refund`);
  });
});
