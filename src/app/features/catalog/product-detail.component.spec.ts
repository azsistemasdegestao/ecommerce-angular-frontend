import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { ProductDetailComponent } from './product-detail.component';
import { AuthService } from '../../core/auth/auth.service';
import { provideApiConfiguration } from '../../core/api/generated/api-configuration';
import { environment } from '../../../environments/environment';

const API = environment.apiBaseUrl;

describe('ProductDetailComponent', () => {
  let fixture: ComponentFixture<ProductDetailComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductDetailComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideApiConfiguration(environment.apiBaseUrl),
        provideRouter([]),
        { provide: AuthService, useValue: { isAuthenticated: () => true } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: new Map([['slug', 'a-product']]) } },
        },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ProductDetailComponent);
    fixture.detectChanges();
  });

  it('AC-FE-CATALOG-U-02: out-of-stock product disables the purchase button', async () => {
    httpMock.expectOne(`${API}/api/v1/catalog/products/a-product`).flush({
      id: '1',
      slug: 'a-product',
      name: 'A Product',
      description: 'desc',
      price: 10,
      image_url: 'https://example.com/a.jpg',
      in_stock: false,
      stock: 0,
      category: { id: 'c1', name: 'Cat', slug: 'cat' },
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    });

    await Promise.resolve();
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Out of stock');
    const button = el.querySelector('button');
    expect(button?.disabled).toBe(true);
  });

  it('AC-FE-CATALOG-U-04: product not found renders the not-found state', async () => {
    httpMock
      .expectOne(`${API}/api/v1/catalog/products/a-product`)
      .flush({ title: 'Not Found' }, { status: 404, statusText: 'Not Found' });

    await Promise.resolve();
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Product not found');
  });

  function flushInStockProduct(): void {
    httpMock.expectOne(`${API}/api/v1/catalog/products/a-product`).flush({
      id: '1',
      slug: 'a-product',
      name: 'A Product',
      description: 'desc',
      price: 10,
      image_url: 'https://example.com/a.jpg',
      in_stock: true,
      stock: 5,
      category: { id: 'c1', name: 'Cat', slug: 'cat' },
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    });
  }

  it('lets the user pick a quantity before adding to cart, and sends it on add', async () => {
    flushInStockProduct();
    await Promise.resolve();
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    const buttons = Array.from(el.querySelectorAll('button'));
    const incrementButton = buttons.find((b) => b.textContent?.trim() === '+');
    incrementButton?.dispatchEvent(new Event('click', { bubbles: true }));
    incrementButton?.dispatchEvent(new Event('click', { bubbles: true }));
    fixture.detectChanges();

    expect(el.textContent).toContain('3');

    const component = fixture.componentInstance as unknown as { addToCart: () => Promise<void> };
    const addPromise = component.addToCart();
    httpMock
      .expectOne(`${API}/api/v1/cart/items`)
      .flush({ item_id: 'i1', quantity: 3, unit_price: 10, subtotal: 30, cart_id: 'cart-1' });
    await addPromise;
  });

  it('does not let the quantity go below 1', async () => {
    flushInStockProduct();
    await Promise.resolve();
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    const decrementButton = Array.from(el.querySelectorAll('button')).find((b) => b.textContent?.trim() === '-');
    decrementButton?.dispatchEvent(new Event('click', { bubbles: true }));
    fixture.detectChanges();

    expect(decrementButton?.disabled).toBe(true);
  });
});
