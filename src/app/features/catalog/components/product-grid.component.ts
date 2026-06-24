import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ProductSummaryDto } from '../../../core/api/generated/models/product-summary-dto';
import { ProductCardComponent } from './product-card.component';
import { ButtonComponent } from '../../../shared/button/button.component';

@Component({
  selector: 'app-product-grid',
  imports: [ProductCardComponent, ButtonComponent],
  template: `
    @if (isLoading) {
      <div class="grid grid-cols-1 gap-x-6 gap-y-10 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        @for (placeholder of skeletonItems; track placeholder) {
          <div class="aspect-square animate-pulse rounded-sm bg-charcoal/5"></div>
        }
      </div>
    } @else if (products.length === 0) {
      <div class="flex flex-col items-center gap-4 py-20 text-center">
        <p class="text-graphite-muted">No products found.</p>
        <app-button variant="secondary" (click)="clearFilters.emit()">Clear filters</app-button>
      </div>
    } @else {
      <div class="grid grid-cols-1 gap-x-6 gap-y-10 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        @for (product of products; track product.id) {
          <app-product-card [product]="product" />
        }
      </div>
    }
  `,
})
export class ProductGridComponent {
  @Input() products: ProductSummaryDto[] = [];
  @Input() isLoading = false;
  @Output() clearFilters = new EventEmitter<void>();

  protected readonly skeletonItems = Array.from({ length: 8 }, (_, i) => i);
}
