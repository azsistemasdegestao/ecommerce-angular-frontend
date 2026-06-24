import { Component, Input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductSummaryDto } from '../../../core/api/generated/models/product-summary-dto';

@Component({
  selector: 'app-product-card',
  imports: [RouterLink, DecimalPipe],
  template: `
    <a
      [routerLink]="['/products', product.slug]"
      class="flex flex-col gap-2 rounded-lg border border-gray-200 p-3 hover:shadow-md"
    >
      <img
        [src]="product.image_url"
        [alt]="product.name"
        class="aspect-square w-full rounded-md bg-gray-50 object-contain object-center"
      />
      <h3 class="text-sm font-medium text-gray-900">{{ product.name }}</h3>
      <div class="flex items-center justify-between">
        <span class="text-sm font-semibold">{{ product.price | number: '1.2-2' }}</span>
        @if (!product.in_stock) {
          <span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">Out of stock</span>
        }
      </div>
    </a>
  `,
})
export class ProductCardComponent {
  @Input({ required: true }) product!: ProductSummaryDto;
}
