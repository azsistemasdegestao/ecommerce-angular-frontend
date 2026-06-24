import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { OrderService } from './order.service';
import { CartService } from '../cart/cart.service';
import { provideApiConfiguration } from '../../core/api/generated/api-configuration';
import { environment } from '../../../environments/environment';

const API = environment.apiBaseUrl;

describe('OrderService', () => {
  let service: OrderService;
  let cartService: CartService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideApiConfiguration(environment.apiBaseUrl),
      ],
    });
    service = TestBed.inject(OrderService);
    cartService = TestBed.inject(CartService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('AC-FE-ORDERS-U-02: successful checkout clears the local cart without a new GET /cart', async () => {
    const promise = service.checkout('123 Main St');
    httpMock.expectOne(`${API}/api/v1/orders`).flush({
      id: 'order-1',
      status: 'Pending',
      total: 49.9,
      item_count: 1,
      shipping_address: '123 Main St',
      created_at: '2024-01-01T00:00:00Z',
    });
    await promise;

    httpMock.expectNone(`${API}/api/v1/cart`);
    expect(cartService.cart().items).toEqual([]);
  });

  it('AC-FE-ORDERS-U-06: detail of a non-existent order shows a not-found state', async () => {
    const promise = service.loadOrderById('missing-id');
    httpMock
      .expectOne(`${API}/api/v1/orders/missing-id`)
      .flush({ title: 'Not Found' }, { status: 404, statusText: 'Not Found' });
    await promise;

    expect(service.orderNotFound()).toBe(true);
    expect(service.currentOrder()).toBeNull();
  });

  it('AC-FE-ORDERS-U-05: successful cancellation updates the status without a manual reload', async () => {
    const loadPromise = service.loadOrderById('order-1');
    httpMock.expectOne(`${API}/api/v1/orders/order-1`).flush({
      id: 'order-1',
      status: 'Pending',
      total: 49.9,
      items: [],
      shipping_address: '123 Main St',
      user_id: 'user-1',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    });
    await loadPromise;

    const cancelPromise = service.cancel('order-1');
    httpMock.expectOne(`${API}/api/v1/orders/order-1/cancel`).flush({
      id: 'order-1',
      status: 'Cancelled',
      updated_at: '2024-01-02T00:00:00Z',
    });
    await cancelPromise;

    expect(service.currentOrder()?.status).toBe('Cancelled');
  });
});
