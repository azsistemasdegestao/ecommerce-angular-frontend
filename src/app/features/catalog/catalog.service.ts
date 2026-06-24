import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { getProducts } from '../../core/api/generated/fn/catalog/get-products';
import { getProductBySlug } from '../../core/api/generated/fn/catalog/get-product-by-slug';
import { getCategories } from '../../core/api/generated/fn/catalog/get-categories';
import { ApiConfiguration } from '../../core/api/generated/api-configuration';
import { ProductSummaryDto } from '../../core/api/generated/models/product-summary-dto';
import { ProductDetailDto } from '../../core/api/generated/models/product-detail-dto';
import { CategoryDto } from '../../core/api/generated/models/category-dto';
import { ApiError } from '../../core/api/api-error';

export const MAX_PAGE_SIZE = 100;
export const DEFAULT_PAGE_SIZE = 20;

export interface CatalogFilters {
  page_number: number;
  page_size: number;
  category_slug?: string;
  search?: string;
  min_price?: number;
  max_price?: number;
  in_stock?: boolean;
}

export const DEFAULT_FILTERS: CatalogFilters = {
  page_number: 1,
  page_size: DEFAULT_PAGE_SIZE,
};

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfiguration);

  private readonly _products = signal<ProductSummaryDto[]>([]);
  private readonly _categories = signal<CategoryDto[]>([]);
  private readonly _currentFilters = signal<CatalogFilters>(DEFAULT_FILTERS);
  private readonly _isLoading = signal(false);
  private readonly _totalPages = signal(1);
  private readonly _totalCount = signal(0);
  private readonly _currentProduct = signal<ProductDetailDto | null>(null);
  private readonly _productNotFound = signal(false);

  readonly products = this._products.asReadonly();
  readonly categories = this._categories.asReadonly();
  readonly currentFilters = this._currentFilters.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly totalPages = this._totalPages.asReadonly();
  readonly totalCount = this._totalCount.asReadonly();
  readonly currentProduct = this._currentProduct.asReadonly();
  readonly productNotFound = this._productNotFound.asReadonly();
  readonly isEmpty = computed(() => !this._isLoading() && this._products().length === 0);

  async loadProducts(filters: Partial<CatalogFilters>): Promise<void> {
    const normalized: CatalogFilters = {
      ...DEFAULT_FILTERS,
      ...filters,
      // BR-FE-CATALOG-003: never request a page_size above the backend's max.
      page_size: Math.min(filters.page_size ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE),
    };
    this._currentFilters.set(normalized);
    this._isLoading.set(true);
    try {
      const resp = await firstValueFrom(
        getProducts(this.http, this.apiConfig.rootUrl, {
          page_number: normalized.page_number,
          page_size: normalized.page_size,
          category_slug: normalized.category_slug,
          search: normalized.search,
          min_price: normalized.min_price,
          max_price: normalized.max_price,
          in_stock: normalized.in_stock,
        }),
      );
      const body = resp.body!;
      this._products.set(body.items);
      this._totalPages.set(Number(body.total_pages ?? 1));
      this._totalCount.set(Number(body.total_count));
    } finally {
      this._isLoading.set(false);
    }
  }

  async loadCategories(): Promise<void> {
    const resp = await firstValueFrom(getCategories(this.http, this.apiConfig.rootUrl));
    this._categories.set(resp.body!);
  }

  async loadProductBySlug(slug: string): Promise<void> {
    this._isLoading.set(true);
    this._productNotFound.set(false);
    try {
      const resp = await firstValueFrom(
        getProductBySlug(this.http, this.apiConfig.rootUrl, { slug }),
      );
      this._currentProduct.set(resp.body!);
    } catch (error) {
      const apiError = error as ApiError;
      if (apiError.status === 404) {
        this._productNotFound.set(true);
        this._currentProduct.set(null);
      } else {
        throw error;
      }
    } finally {
      this._isLoading.set(false);
    }
  }
}
