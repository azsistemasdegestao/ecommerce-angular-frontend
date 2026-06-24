import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CatalogHomeComponent } from './catalog-home.component';
import { provideApiConfiguration } from '../../core/api/generated/api-configuration';
import { environment } from '../../../environments/environment';

const API = environment.apiBaseUrl;

describe('CatalogHomeComponent', () => {
  let fixture: ComponentFixture<CatalogHomeComponent>;
  let httpMock: HttpTestingController;
  let router: Router;
  let queryParamMap$: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let paramMap$: BehaviorSubject<ReturnType<typeof convertToParamMap>>;

  beforeEach(async () => {
    queryParamMap$ = new BehaviorSubject(convertToParamMap({}));
    paramMap$ = new BehaviorSubject(convertToParamMap({}));

    await TestBed.configureTestingModule({
      imports: [CatalogHomeComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideApiConfiguration(environment.apiBaseUrl),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: paramMap$,
            queryParamMap: queryParamMap$,
            snapshot: { paramMap: convertToParamMap({}) },
          },
        },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);

    fixture = TestBed.createComponent(CatalogHomeComponent);
    fixture.detectChanges();

    httpMock.expectOne(`${API}/api/v1/catalog/categories`).flush([]);
    httpMock.expectOne((req) => req.url === `${API}/api/v1/catalog/products`).flush({
      items: [],
      page_number: 1,
      page_size: 20,
      total_count: 0,
    });
  });

  it('AC-FE-CATALOG-U-01: search filter updates the query string and re-fetches', async () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    const component = fixture.componentInstance;
    component.onFiltersChange({ search: 'shoes' });

    expect(navigateSpy).toHaveBeenCalledWith(
      ['/'],
      expect.objectContaining({ queryParams: expect.objectContaining({ search: 'shoes' }) }),
    );

    queryParamMap$.next(convertToParamMap({ search: 'shoes' }));
    httpMock
      .expectOne((req) => req.url === `${API}/api/v1/catalog/products` && req.params.get('search') === 'shoes')
      .flush({ items: [], page_number: 1, page_size: 20, total_count: 0 });
  });

  it('selecting "All categories" while on a category route navigates back to the root catalog', async () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    // Simulate being on /categories/electronics.
    paramMap$.next(convertToParamMap({ slug: 'electronics' }));
    httpMock
      .expectOne((req) => req.url === `${API}/api/v1/catalog/products` && req.params.get('category_slug') === 'electronics')
      .flush({ items: [], page_number: 1, page_size: 20, total_count: 0 });

    const component = fixture.componentInstance;
    component.onFiltersChange({ category_slug: undefined });

    expect(navigateSpy).toHaveBeenCalledWith(['/'], expect.anything());
  });

  it('keeps the active category route when only an unrelated filter changes', async () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    paramMap$.next(convertToParamMap({ slug: 'electronics' }));
    httpMock
      .expectOne((req) => req.url === `${API}/api/v1/catalog/products` && req.params.get('category_slug') === 'electronics')
      .flush({ items: [], page_number: 1, page_size: 20, total_count: 0 });

    const component = fixture.componentInstance;
    component.onFiltersChange({ category_slug: 'electronics', in_stock: true });

    expect(navigateSpy).toHaveBeenCalledWith(['/categories', 'electronics'], expect.anything());
  });
});
