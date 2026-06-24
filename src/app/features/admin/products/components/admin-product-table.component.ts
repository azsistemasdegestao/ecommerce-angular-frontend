import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductSummaryDto } from '../../../../core/api/generated/models/product-summary-dto';

@Component({
  selector: 'app-admin-product-table',
  imports: [DecimalPipe, RouterLink],
  template: `
    <table class="w-full min-w-[640px] table-auto text-left text-sm">
      <thead class="border-b border-gray-200 text-gray-500">
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
          <tr class="border-b border-gray-100">
            <td class="py-2">{{ product.name }}</td>
            <td class="py-2 text-gray-500">{{ product.slug }}</td>
            <td class="py-2">{{ product.price | number: '1.2-2' }}</td>
            <td class="py-2">{{ product.category.name }}</td>
            <td class="py-2">{{ product.in_stock ? 'Active' : 'Out of stock' }}</td>
            <td class="py-2">
              <a class="text-blue-600 hover:underline" [routerLink]="['/admin/products', product.id, 'edit']">
                Edit
              </a>
              <button type="button" class="ml-3 text-red-600 hover:underline" (click)="deleteProduct.emit(product.id)">
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
