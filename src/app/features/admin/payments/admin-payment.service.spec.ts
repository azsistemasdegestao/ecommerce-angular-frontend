import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { AdminPaymentService } from './admin-payment.service';
import { provideApiConfiguration } from '../../../core/api/generated/api-configuration';
import { environment } from '../../../../environments/environment';

const API = environment.apiBaseUrl;

describe('AdminPaymentService', () => {
  let service: AdminPaymentService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideApiConfiguration(environment.apiBaseUrl),
      ],
    });
    service = TestBed.inject(AdminPaymentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('AC-FE-ADMINPAYMENTS-U-03: a successful refund updates the row without refetching the list', async () => {
    const loadPromise = service.loadPayments();
    httpMock.expectOne((r) => r.url === `${API}/api/v1/admin/payments`).flush({
      items: [
        { id: 'pay-1', order_id: 'order-1', user_id: 'u1', user_email: 'a@test.com', amount: 49.9, status: 'Processed', created_at: '2024-01-01T00:00:00Z' },
        { id: 'pay-2', order_id: 'order-2', user_id: 'u2', user_email: 'b@test.com', amount: 19.9, status: 'Failed', created_at: '2024-01-01T00:00:00Z' },
      ],
      page_number: 1,
      page_size: 20,
      total_count: 2,
    });
    await loadPromise;

    const refundPromise = service.refund('pay-1');
    httpMock.expectOne(`${API}/api/v1/admin/payments/pay-1/refund`).flush({
      id: 'pay-1',
      status: 'Refunded',
      updated_at: '2024-01-02T00:00:00Z',
    });
    await refundPromise;

    httpMock.expectNone((r) => r.url === `${API}/api/v1/admin/payments`);
    expect(service.payments().find((p) => p.id === 'pay-1')?.status).toBe('Refunded');
    expect(service.payments().find((p) => p.id === 'pay-2')?.status).toBe('Failed');
  });

  it('AC-FE-ADMINPAYMENTS-U-04: a refund error keeps the previous status', async () => {
    const loadPromise = service.loadPayments();
    httpMock.expectOne((r) => r.url === `${API}/api/v1/admin/payments`).flush({
      items: [
        { id: 'pay-1', order_id: 'order-1', user_id: 'u1', user_email: 'a@test.com', amount: 49.9, status: 'Processed', created_at: '2024-01-01T00:00:00Z' },
      ],
      page_number: 1,
      page_size: 20,
      total_count: 1,
    });
    await loadPromise;

    let errored = false;
    const refundPromise = service.refund('pay-1').catch(() => (errored = true));
    httpMock
      .expectOne(`${API}/api/v1/admin/payments/pay-1/refund`)
      .flush({ title: 'Already refunded' }, { status: 409, statusText: 'Conflict' });
    await refundPromise;

    expect(errored).toBe(true);
    expect(service.payments()[0].status).toBe('Processed');
  });
});
