import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { AdminProductService } from './admin-product.service';
import { provideApiConfiguration } from '../../../core/api/generated/api-configuration';
import { environment } from '../../../../environments/environment';

const API = environment.apiBaseUrl;

describe('AdminProductService', () => {
  let service: AdminProductService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideApiConfiguration(environment.apiBaseUrl),
      ],
    });
    service = TestBed.inject(AdminProductService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('AC-FE-ADMINPRODUCTS-U-01: creating a product successfully returns its id', async () => {
    const promise = service.create({
      name: 'Sneaker',
      category_id: 'cat-1',
      price: 49.9,
      stock: 10,
      description: 'desc',
      image_url: 'https://x/img.png',
      slug: null,
    });
    httpMock.expectOne(`${API}/api/v1/catalog/products`).flush({
      id: 'product-1',
      name: 'Sneaker',
      slug: 'sneaker',
      price: 49.9,
      stock: 10,
      created_at: '2024-01-01T00:00:00Z',
    });
    expect(await promise).toBe('product-1');
  });

  it('AC-FE-ADMINPRODUCTS-U-05 (delete API): removing a product drops it from the local list', async () => {
    const loadPromise = service.loadProducts();
    httpMock.expectOne((r) => r.url === `${API}/api/v1/catalog/products`).flush({
      items: [
        { id: 'p1', name: 'A', slug: 'a', price: 1, image_url: '', in_stock: true, category: { id: 'c', name: 'C', slug: 'c' } },
      ],
      page_number: 1,
      page_size: 20,
      total_count: 1,
    });
    await loadPromise;

    const deletePromise = service.delete('p1');
    httpMock.expectOne(`${API}/api/v1/catalog/products/p1`).flush('');
    await deletePromise;

    expect(service.products()).toEqual([]);
  });
});
