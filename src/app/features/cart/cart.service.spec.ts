import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { CartService } from './cart.service';
import { AuthService } from '../../core/auth/auth.service';
import { provideApiConfiguration } from '../../core/api/generated/api-configuration';
import { environment } from '../../../environments/environment';

const API = environment.apiBaseUrl;

const PRODUCT = { id: 'p1', name: 'Sneaker', slug: 'sneaker', imageUrl: 'https://x/img.png', price: 49.9 };

class FakeAuthService {
  private readonly authenticated = signal(true);
  readonly isAuthenticated = this.authenticated.asReadonly();

  setAuthenticated(value: boolean): void {
    this.authenticated.set(value);
  }
}

describe('CartService', () => {
  let service: CartService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideApiConfiguration(environment.apiBaseUrl),
        { provide: AuthService, useClass: FakeAuthService },
      ],
    });
    service = TestBed.inject(CartService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('AC-FE-CART-U-01: adding an item updates the UI before the API responds', async () => {
    const addPromise = service.addItem(PRODUCT, 1);

    // Optimistic update is synchronous, before the request resolves.
    expect(service.cart().items.length).toBe(1);
    expect(service.cart().items[0].product_name).toBe('Sneaker');

    httpMock.expectOne(`${API}/api/v1/cart/items`).flush({
      cart_id: 'cart-1',
      item_id: 'item-1',
      product_id: 'p1',
      quantity: 1,
      unit_price: 49.9,
      subtotal: 49.9,
    });
    await addPromise;

    expect(service.cart().items[0].id).toBe('item-1');
  });

  it('AC-FE-CART-U-02: a 422 error when adding rolls back the optimistic update', async () => {
    const addPromise = service.addItem(PRODUCT, 1);
    expect(service.cart().items.length).toBe(1);

    httpMock
      .expectOne(`${API}/api/v1/cart/items`)
      .flush({ title: 'Insufficient stock' }, { status: 422, statusText: 'Unprocessable Entity' });
    await addPromise;

    expect(service.cart().items.length).toBe(0);
  });

  it('AC-FE-CART-U-03: updating quantity with insufficient stock reverts the value', async () => {
    const addPromise = service.addItem(PRODUCT, 1);
    httpMock.expectOne(`${API}/api/v1/cart/items`).flush({
      cart_id: 'cart-1',
      item_id: 'item-1',
      product_id: 'p1',
      quantity: 1,
      unit_price: 49.9,
      subtotal: 49.9,
    });
    await addPromise;

    const updatePromise = service.updateQuantity('item-1', 5);
    expect(service.cart().items[0].quantity).toBe(5);

    httpMock
      .expectOne(`${API}/api/v1/cart/items/item-1`)
      .flush({ title: 'Insufficient stock' }, { status: 422, statusText: 'Unprocessable Entity' });
    await updatePromise;

    expect(service.cart().items[0].quantity).toBe(1);
    expect(service.itemErrors()['item-1']).toBeTruthy();
  });

  it('AC-FE-CART-U-04: removing an item with a network error re-inserts the item', async () => {
    const addPromise = service.addItem(PRODUCT, 1);
    httpMock.expectOne(`${API}/api/v1/cart/items`).flush({
      cart_id: 'cart-1',
      item_id: 'item-1',
      product_id: 'p1',
      quantity: 1,
      unit_price: 49.9,
      subtotal: 49.9,
    });
    await addPromise;

    const removePromise = service.removeItem('item-1');
    expect(service.cart().items.length).toBe(0);

    httpMock.expectOne(`${API}/api/v1/cart/items/item-1`).error(new ProgressEvent('timeout'));
    await removePromise;

    expect(service.cart().items.length).toBe(1);
  });

  it('AC-FE-CART-U-05: empty cart disables the checkout (isEmpty true)', () => {
    expect(service.isEmpty()).toBe(true);
  });

  it('AC-FE-CART-U-06: a guest cannot add an item and no request is made', async () => {
    const authService = TestBed.inject(AuthService) as unknown as FakeAuthService;
    authService.setAuthenticated(false);

    const added = await service.addItem(PRODUCT, 1);

    expect(added).toBe(false);
    expect(service.cart().items.length).toBe(0);
    httpMock.expectNone(`${API}/api/v1/cart/items`);
  });

  it('AC-FE-CART-U-07: logging out (auth state goes false) clears the cart', async () => {
    const authService = TestBed.inject(AuthService) as unknown as FakeAuthService;
    const addPromise = service.addItem(PRODUCT, 1);
    httpMock.expectOne(`${API}/api/v1/cart/items`).flush({
      cart_id: 'cart-1',
      item_id: 'item-1',
      product_id: 'p1',
      quantity: 1,
      unit_price: 49.9,
      subtotal: 49.9,
    });
    await addPromise;
    expect(service.cart().items.length).toBe(1);

    authService.setAuthenticated(false);
    TestBed.flushEffects();

    expect(service.cart().items.length).toBe(0);
  });

  it('AC-FE-CART-E-02: adding the same product twice increments quantity instead of duplicating', async () => {
    const firstAdd = service.addItem(PRODUCT, 1);
    httpMock.expectOne(`${API}/api/v1/cart/items`).flush({
      cart_id: 'cart-1',
      item_id: 'item-1',
      product_id: 'p1',
      quantity: 1,
      unit_price: 49.9,
      subtotal: 49.9,
    });
    await firstAdd;

    const secondAdd = service.addItem(PRODUCT, 1);
    // Optimistic update merges into the existing item rather than appending.
    expect(service.cart().items.length).toBe(1);
    expect(service.cart().items[0].quantity).toBe(2);

    httpMock.expectOne(`${API}/api/v1/cart/items`).flush({
      cart_id: 'cart-1',
      item_id: 'item-1',
      product_id: 'p1',
      quantity: 2,
      unit_price: 49.9,
      subtotal: 99.8,
    });
    await secondAdd;

    expect(service.cart().items.length).toBe(1);
    expect(service.cart().items[0].quantity).toBe(2);
  });

  it('AC-FE-CART-U-08: adding an already-present product sends only the added delta, not the running total (backend sums it server-side)', async () => {
    const firstAdd = service.addItem(PRODUCT, 1);
    httpMock.expectOne(`${API}/api/v1/cart/items`).flush({
      cart_id: 'cart-1',
      item_id: 'item-1',
      product_id: 'p1',
      quantity: 1,
      unit_price: 49.9,
      subtotal: 49.9,
    });
    await firstAdd;

    const secondAdd = service.addItem(PRODUCT, 3);
    const req = httpMock.expectOne(`${API}/api/v1/cart/items`);
    expect(req.request.body).toEqual({ product_id: 'p1', quantity: 3 });

    req.flush({
      cart_id: 'cart-1',
      item_id: 'item-1',
      product_id: 'p1',
      quantity: 4,
      unit_price: 49.9,
      subtotal: 199.6,
    });
    await secondAdd;

    expect(service.cart().items[0].quantity).toBe(4);
  });
});
