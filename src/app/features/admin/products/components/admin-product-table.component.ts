import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductSummaryDto } from '../../../../core/api/generated/models/product-summary-dto';

@Component({
  selector: 'app-admin-product-table',
  imports: [DecimalPipe, RouterLink],
  template: `
    <table class="w-full min-w-[640px] table-auto text-left text-sm">
      <thead class="border-b border-charcoal/10 text-graphite-muted">
        <tr>
          <th class="py-2">Name</th>
          <th class="py-2">Slug</th>
          <th class="py-2">Price</th>
          <th class="py-2">Category</th>
          <th class="py-2">Status</th>
          <th class="py-2">Actions</th>
        </tr>
      </thead>
      <tbody>
        @for (product of products; track product.id) {
          <tr class="border-b border-charcoal/5">
            <td class="py-2">{{ product.name }}</td>
            <td class="py-2 text-graphite-muted">{{ product.slug }}</td>
            <td class="py-2">{{ product.price | number: '1.2-2' }}</td>
            <td class="py-2">{{ product.category.name }}</td>
            <td class="py-2">{{ product.in_stock ? 'Active' : 'Out of stock' }}</td>
            <td class="py-2">
              <a class="text-champagne hover:underline" [routerLink]="['/admin/products', product.id, 'edit']">
                Edit
              </a>
              <button type="button" class="ml-3 text-charcoal/60 hover:text-red-700" (click)="deleteProduct.emit(product.id)">
                Delete
              </button>
            </td>
          </tr>
        }
      </tbody>
    </table>
  `,
})
export class AdminProductTableComponent {
  @Input() products: ProductSummaryDto[] = [];
  @Output() deleteProduct = new EventEmitter<string>();
}
