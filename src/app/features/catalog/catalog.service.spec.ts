import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { CatalogService, MAX_PAGE_SIZE } from './catalog.service';
import { provideApiConfiguration } from '../../core/api/generated/api-configuration';
import { environment } from '../../../environments/environment';

const API = environment.apiBaseUrl;

describe('CatalogService', () => {
  let service: CatalogService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideApiConfiguration(environment.apiBaseUrl),
      ],
    });
    service = TestBed.inject(CatalogService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('AC-FE-CATALOG-U-03: empty listing surfaces an empty products array', async () => {
    const promise = service.loadProducts({ page_number: 1, page_size: 20 });
    httpMock.expectOne((req) => req.url === `${API}/api/v1/catalog/products`).flush({
      items: [],
      page_number: 1,
      page_size: 20,
      total_count: 0,
    });
    await promise;

    expect(service.products()).toEqual([]);
    expect(service.isEmpty()).toBe(true);
  });

  it('AC-FE-CATALOG-U-04: product not found sets the not-found state instead of throwing', async () => {
    const promise = service.loadProductBySlug('does-not-exist');
    httpMock
      .expectOne(`${API}/api/v1/catalog/products/does-not-exist`)
      .flush({ title: 'Not Found' }, { status: 404, statusText: 'Not Found' });

    await promise;

    expect(service.productNotFound()).toBe(true);
    expect(service.currentProduct()).toBeNull();
  });

  it('AC-FE-CATALOG-U-05: pagination never requests a page_size above the backend max', async () => {
    const promise = service.loadProducts({ page_number: 1, page_size: 500 });
    const req = httpMock.expectOne((r) => r.url === `${API}/api/v1/catalog/products`);
    expect(req.request.params.get('page_size')).toBe(String(MAX_PAGE_SIZE));
    req.flush({ items: [], page_number: 1, page_size: MAX_PAGE_SIZE, total_count: 0 });
    await promise;
  });
});
