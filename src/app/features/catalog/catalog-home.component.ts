import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, combineLatest } from 'rxjs';
import { CatalogFilters, CatalogService, DEFAULT_PAGE_SIZE } from './catalog.service';
import { ProductGridComponent } from './components/product-grid.component';
import { FilterBarComponent, FilterBarChange } from './components/filter-bar.component';
import { CategoryNavComponent } from './components/category-nav.component';
import { PaginationComponent } from '../../shared/pagination/pagination.component';

@Component({
  selector: 'app-catalog-home',
  imports: [ProductGridComponent, FilterBarComponent, CategoryNavComponent, PaginationComponent],
  template: `
    <div class="flex flex-col gap-4 p-4 md:flex-row md:p-6">
      <aside class="md:w-48">
        <app-category-nav [categories]="catalogService.categories()" />
      </aside>
      <div class="flex-1">
        <app-filter-bar
          [categories]="catalogService.categories()"
          [filters]="catalogService.currentFilters()"
          (filtersChange)="onFiltersChange($event)"
        />
        <div class="mt-4">
          <app-product-grid
            [products]="catalogService.products()"
            [isLoading]="catalogService.isLoading()"
            (clearFilters)="onClearFilters()"
          />
        </div>
        <div class="mt-6">
          <app-pagination
            [page]="catalogService.currentFilters().page_number"
            [pageSize]="catalogService.currentFilters().page_size"
            [totalItems]="catalogService.totalCount()"
            (pageChange)="onPageChange($event)"
          />
        </div>
      </div>
    </div>
  `,
})
export class CatalogHomeComponent implements OnInit, OnDestroy {
  protected readonly catalogService = inject(CatalogService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private subscription?: Subscription;

  ngOnInit(): void {
    void this.catalogService.loadCategories();
    this.subscription = combineLatest([this.route.paramMap, this.route.queryParamMap]).subscribe(
      ([params, queryParams]) => {
        void this.catalogService.loadProducts({
          page_number: Number(queryParams.get('page_number') ?? 1),
          page_size: Number(queryParams.get('page_size') ?? DEFAULT_PAGE_SIZE),
          category_slug: params.get('slug') ?? undefined,
          search: queryParams.get('search') ?? undefined,
          min_price: queryParams.get('min_price') ? Number(queryParams.get('min_price')) : undefined,
          max_price: queryParams.get('max_price') ? Number(queryParams.get('max_price')) : undefined,
          in_stock: queryParams.get('in_stock') === 'true' ? true : undefined,
        });
      },
    );
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  onFiltersChange(change: FilterBarChange): void {
    this.navigateWithFilters({ ...change, page_number: 1 });
  }

  onPageChange(page: number): void {
    this.navigateWithFilters({ page_number: page });
  }

  onClearFilters(): void {
    void this.router.navigate(['/'], { queryParams: {} });
  }

  private categoryCommands(slug: string | undefined): unknown[] {
    return slug ? ['/categories', slug] : ['/'];
  }

  private navigateWithFilters(partial: Partial<CatalogFilters>): void {
    const current = this.catalogService.currentFilters();
    const merged = { ...current, ...partial };
    void this.router.navigate(this.categoryCommands(merged.category_slug), {
      queryParams: {
        page_number: merged.page_number > 1 ? merged.page_number : null,
        page_size: merged.page_size !== DEFAULT_PAGE_SIZE ? merged.page_size : null,
        search: merged.search || null,
        min_price: merged.min_price ?? null,
        max_price: merged.max_price ?? null,
        in_stock: merged.in_stock ? 'true' : null,
      },
    });
  }
}
