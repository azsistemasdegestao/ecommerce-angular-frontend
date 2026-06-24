import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { AdminOrderService } from './admin-order.service';
import { provideApiConfiguration } from '../../../core/api/generated/api-configuration';
import { environment } from '../../../../environments/environment';

const API = environment.apiBaseUrl;

describe('AdminOrderService', () => {
  let service: AdminOrderService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideApiConfiguration(environment.apiBaseUrl),
      ],
    });
    service = TestBed.inject(AdminOrderService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('AC-FE-ADMINORDERS-U-01: status filter updates the listing request', async () => {
    const promise = service.loadOrders({ status: 'Cancelled' });
    const req = httpMock.expectOne((r) => r.url === `${API}/api/v1/admin/orders`);
    expect(req.request.params.get('status')).toBe('Cancelled');
    req.flush({ items: [], page_number: 1, page_size: 20, total_count: 0 });
    await promise;
  });

  it('AC-FE-ADMINORDERS-U-02: filtering by user_id includes the parameter', async () => {
    const promise = service.loadOrders({ user_id: 'user-42' });
    const req = httpMock.expectOne((r) => r.url === `${API}/api/v1/admin/orders`);
    expect(req.request.params.get('user_id')).toBe('user-42');
    req.flush({ items: [], page_number: 1, page_size: 20, total_count: 0 });
    await promise;
  });

  it('AC-FE-ADMINORDERS-U-04: an invalid status transition leaves the order unchanged', async () => {
    const loadPromise = service.loadOrderById('order-1');
    httpMock.expectOne(`${API}/api/v1/admin/orders/order-1`).flush({
      id: 'order-1',
      status: 'Shipped',
      total: 49.9,
      items: [],
      shipping_address: '123 Main St',
      user_id: 'user-1',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    });
    await loadPromise;

    let errored = false;
    const forcePromise = service.forceStatus('order-1', 'Pending').catch(() => {
      errored = true;
    });
    httpMock
      .expectOne(`${API}/api/v1/admin/orders/order-1/status`)
      .flush({ title: 'Invalid transition' }, { status: 422, statusText: 'Unprocessable Entity' });
    await forcePromise;

    expect(errored).toBe(true);
    expect(service.currentOrder()?.status).toBe('Shipped');
  });
});
