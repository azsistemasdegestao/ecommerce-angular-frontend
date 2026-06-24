import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CheckoutPageComponent } from './checkout-page.component';
import { CartService } from '../cart/cart.service';
import { provideApiConfiguration } from '../../core/api/generated/api-configuration';
import { environment } from '../../../environments/environment';

const API = environment.apiBaseUrl;

describe('CheckoutPageComponent', () => {
  let fixture: ComponentFixture<CheckoutPageComponent>;
  let httpMock: HttpTestingController;
  let cartService: CartService;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CheckoutPageComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideApiConfiguration(environment.apiBaseUrl),
        provideRouter([]),
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    cartService = TestBed.inject(CartService);
    router = TestBed.inject(Router);
  });

  it('AC-FE-ORDERS-U-01: checkout with an empty cart redirects to /cart', () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(CheckoutPageComponent);
    fixture.detectChanges();

    expect(navigateSpy).toHaveBeenCalledWith(['/cart'], expect.objectContaining({ queryParams: { emptyCheckout: '1' } }));
  });

  it('AC-FE-ORDERS-U-03: a 422 error on checkout keeps the user on the screen', async () => {
    // Seed a non-empty cart so the empty-cart redirect doesn't fire.
    const addPromise = cartService.addItem(
      { id: 'p1', name: 'Sneaker', slug: 'sneaker', imageUrl: 'https://x/img.png', price: 49.9 },
      1,
    );
    httpMock.expectOne(`${API}/api/v1/cart/items`).flush({
      cart_id: 'cart-1',
      item_id: 'item-1',
      product_id: 'p1',
      quantity: 1,
      unit_price: 49.9,
      subtotal: 49.9,
    });
    await addPromise;

    fixture = TestBed.createComponent(CheckoutPageComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance as unknown as {
      form: { controls: { shipping_address: { setValue: (v: string) => void } } };
      submit: () => Promise<void>;
    };
    component.form.controls.shipping_address.setValue('123 Main St');
    const submitPromise = component.submit();

    httpMock
      .expectOne(`${API}/api/v1/orders`)
      .flush({ title: 'Insufficient stock' }, { status: 422, statusText: 'Unprocessable Entity' });
    await submitPromise;

    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('no longer available');
  });
});
