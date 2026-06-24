import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { AdminProductsPageComponent } from './admin-products-page.component';
import { provideApiConfiguration } from '../../../core/api/generated/api-configuration';
import { environment } from '../../../../environments/environment';

const API = environment.apiBaseUrl;

describe('AdminProductsPageComponent', () => {
  let fixture: ComponentFixture<AdminProductsPageComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminProductsPageComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideApiConfiguration(environment.apiBaseUrl),
        provideRouter([]),
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(AdminProductsPageComponent);
    fixture.detectChanges();

    httpMock.expectOne((r) => r.url === `${API}/api/v1/catalog/products`).flush({
      items: [
        {
          id: 'p1',
          name: 'Sneaker',
          slug: 'sneaker',
          price: 49.9,
          image_url: '',
          in_stock: true,
          category: { id: 'c1', name: 'Cat', slug: 'cat' },
        },
      ],
      page_number: 1,
      page_size: 20,
      total_count: 1,
    });
    await Promise.resolve();
    await Promise.resolve();
    fixture.detectChanges();
  });

  it('AC-FE-ADMINPRODUCTS-U-05: deleting a product requires confirmation before any API call', () => {
    const el: HTMLElement = fixture.nativeElement;
    const deleteButton = Array.from(el.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Delete'),
    );
    deleteButton?.click();
    fixture.detectChanges();

    expect(el.textContent).toContain('Are you sure you want to delete this product?');
    httpMock.expectNone(`${API}/api/v1/catalog/products/p1`);
  });
});
