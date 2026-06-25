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
      class="group flex flex-col gap-3 rounded-sm bg-surface p-3 shadow-sm transition-shadow duration-500 hover:shadow-md"
    >
      <div class="aspect-square w-full overflow-hidden bg-cream">
        <img
          [src]="product.image_url"
          [alt]="product.name"
          class="h-full w-full object-contain object-center transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <h3 class="font-display text-lg text-charcoal">{{ product.name }}</h3>
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium text-champagne">{{ product.price | number: '1.2-2' }}</span>
        @if (!product.in_stock) {
          <span class="rounded-sm bg-charcoal/5 px-2 py-0.5 text-xs text-graphite-muted">Out of stock</span>
        }
      </div>
    </a>
  `,
})
export class ProductCardComponent {
  @Input({ required: true }) product!: ProductSummaryDto;
}
