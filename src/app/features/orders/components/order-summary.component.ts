import { Component, Input } from '@angular/core';
import { DecimalPipe } from '@angular/common';

export interface OrderSummaryItem {
  id: string;
  product_name: string;
  quantity: number | string;
  unit_price: number | string;
  subtotal: number | string;
}

@Component({
  selector: 'app-order-summary',
  imports: [DecimalPipe],
  template: `
    <div class="flex flex-col gap-3">
      @for (item of items; track item.id) {
        <div class="flex justify-between text-sm text-charcoal">
          <span>{{ item.product_name }} × {{ item.quantity }}</span>
          <span class="text-champagne">{{ item.subtotal | number: '1.2-2' }}</span>
        </div>
      }
      <div class="flex justify-between border-t border-charcoal/10 pt-2 text-base font-medium text-charcoal">
        <span>Total</span>
        <span class="text-champagne">{{ total | number: '1.2-2' }}</span>
      </div>
      @if (shippingAddress) {
        <div class="border-t border-charcoal/10 pt-2 text-sm text-graphite-muted">
          <p class="font-medium text-charcoal">Shipping address</p>
          <p>{{ shippingAddress }}</p>
        </div>
      }
    </div>
  `,
})
export class OrderSummaryComponent {
  @Input() items: OrderSummaryItem[] = [];
  @Input() total: number | string = 0;
  @Input() shippingAddress = '';
}
