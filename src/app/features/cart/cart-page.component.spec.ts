import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { CartPageComponent } from './cart-page.component';
import { CartService } from './cart.service';
import { provideApiConfiguration } from '../../core/api/generated/api-configuration';
import { environment } from '../../../environments/environment';

const API = environment.apiBaseUrl;

describe('CartPageComponent', () => {
  let fixture: ComponentFixture<CartPageComponent>;
  let httpMock: HttpTestingController;
  let cartService: CartService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CartPageComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideApiConfiguration(environment.apiBaseUrl),
        provideRouter([]),
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    cartService = TestBed.inject(CartService);

    fixture = TestBed.createComponent(CartPageComponent);
    fixture.detectChanges();

    httpMock.expectOne(`${API}/api/v1/cart`).flush({
      id: 'cart-1',
      items: [
        {
          id: 'item-1',
          product_id: 'p1',
          product_name: 'Sneaker',
          product_slug: 'sneaker',
          image_url: 'https://x/img.png',
          quantity: 1,
          unit_price: 49.9,
          subtotal: 49.9,
        },
      ],
      item_count: 1,
      total: 49.9,
      updated_at: '2024-01-01T00:00:00Z',
    });
    // CartService.loadCart() awaits firstValueFrom, which resolves on a
    // microtask after flush() returns synchronously.
    await Promise.resolve();
    await Promise.resolve();
    fixture.detectChanges();
  });

  it('AC-FE-CART-U-05: empty cart disables the checkout button', async () => {
    void cartService.clear();
    httpMock.expectOne(`${API}/api/v1/cart`).flush('');
    await Promise.resolve();
    await Promise.resolve();
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    const checkoutButton = Array.from(el.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Go to checkout'),
    );
    expect(checkoutButton?.disabled).toBe(true);
  });

  it('AC-FE-CART-U-06: clearing the cart requires confirmation before calling DELETE /cart', () => {
    const el: HTMLElement = fixture.nativeElement;
    const clearButton = Array.from(el.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Clear cart',
    );
    expect(clearButton).toBeTruthy();
    clearButton?.click();
    fixture.detectChanges();

    expect(el.textContent).toContain('Remove all items from your cart');
    httpMock.expectNone(`${API}/api/v1/cart`);
  });
});
