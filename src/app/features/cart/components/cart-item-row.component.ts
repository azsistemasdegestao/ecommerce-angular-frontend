import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { CartItemDto } from '../../../core/api/generated/models/cart-item-dto';
import { ButtonComponent } from '../../../shared/button/button.component';

@Component({
  selector: 'app-cart-item-row',
  imports: [DecimalPipe, ButtonComponent],
  template: `
    <div class="flex items-center gap-4 border-b border-charcoal/10 py-4">
      <img [src]="item.image_url" [alt]="item.product_name" class="h-16 w-16 rounded-sm bg-cream object-cover" />
      <div class="flex-1">
        <p class="font-display text-base text-charcoal">{{ item.product_name }}</p>
        <p class="text-sm text-graphite-muted">{{ item.unit_price | number: '1.2-2' }}</p>
        @if (errorMessage) {
          <p class="text-sm text-red-700" role="alert">{{ errorMessage }}</p>
        }
      </div>
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="rounded-sm border border-charcoal/20 px-2 py-1 text-sm text-charcoal transition-colors hover:border-champagne hover:text-champagne disabled:opacity-50"
          [disabled]="pending || Number(item.quantity) <= 1"
          (click)="quantityChange.emit(Number(item.quantity) - 1)"
        >
          -
        </button>
        <span class="w-6 text-center text-sm text-charcoal">{{ item.quantity }}</span>
        <button
          type="button"
          class="rounded-sm border border-charcoal/20 px-2 py-1 text-sm text-charcoal transition-colors hover:border-champagne hover:text-champagne disabled:opacity-50"
          [disabled]="pending"
          (click)="quantityChange.emit(Number(item.quantity) + 1)"
        >
          +
        </button>
      </div>
      <p class="w-20 text-right text-sm font-medium text-champagne">{{ item.subtotal | number: '1.2-2' }}</p>
      <app-button variant="ghost" [disabled]="pending" (click)="remove.emit()">Remove</app-button>
    </div>
  `,
})
export class CartItemRowComponent {
  @Input({ required: true }) item!: CartItemDto;
  @Input() pending = false;
  @Input() errorMessage?: string;

  @Output() quantityChange = new EventEmitter<number>();
  @Output() remove = new EventEmitter<void>();

  protected readonly Number = Number;
}
