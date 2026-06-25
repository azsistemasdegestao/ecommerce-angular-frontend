import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ButtonComponent } from '../../../shared/button/button.component';

@Component({
  selector: 'app-cart-summary',
  imports: [DecimalPipe, ButtonComponent],
  template: `
    <div class="flex flex-col gap-3 border-t border-charcoal/10 pt-6">
      <div class="flex justify-between text-sm text-graphite-muted">
        <span>Items</span>
        <span>{{ itemCount }}</span>
      </div>
      <div class="flex justify-between text-base font-medium text-charcoal">
        <span>Total</span>
        <span class="text-champagne">{{ total | number: '1.2-2' }}</span>
      </div>
      <app-button [disabled]="itemCount === 0" (click)="checkout.emit()">Go to checkout</app-button>
    </div>
  `,
})
export class CartSummaryComponent {
  @Input() itemCount = 0;
  @Input() total = 0;
  @Output() checkout = new EventEmitter<void>();
}
