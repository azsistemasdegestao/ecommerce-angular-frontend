import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { AdminProductCreatePageComponent } from './admin-product-create-page.component';
import { authInterceptor } from '../../../core/interceptors/auth.interceptor';
import { provideApiConfiguration } from '../../../core/api/generated/api-configuration';
import { environment } from '../../../../environments/environment';

const API = environment.apiBaseUrl;

describe('AdminProductCreatePageComponent', () => {
  let fixture: ComponentFixture<AdminProductCreatePageComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminProductCreatePageComponent],
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideApiConfiguration(environment.apiBaseUrl),
        provideRouter([]),
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(AdminProductCreatePageComponent);
    fixture.detectChanges();
    httpMock.expectOne(`${API}/api/v1/catalog/categories`).flush([{ id: 'c1', name: 'Cat', slug: 'cat', product_count: 0 }]);
    await Promise.resolve();
    fixture.detectChanges();
  });

  it('AC-FE-ADMINPRODUCTS-U-02: a validation error maps errors per field', async () => {
    const component = fixture.componentInstance as unknown as {
      onSubmit: (v: Record<string, string>) => Promise<void>;
    };
    const submitPromise = component.onSubmit({
      name: 'X',
      category_id: 'c1',
      price: '10',
      stock: '5',
      description: '',
      image_url: 'https://x/img.png',
    });

    httpMock.expectOne(`${API}/api/v1/catalog/products`).flush(
      { title: 'Validation failed', errors: { name: ['Name is too short.'] } },
      { status: 400, statusText: 'Bad Request' },
    );
    await submitPromise;
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Name is too short.');
  });
});
