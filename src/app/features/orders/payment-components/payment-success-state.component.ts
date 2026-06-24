import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-payment-success-state',
  imports: [RouterLink],
  template: `
    <div class="flex flex-col items-center gap-4 py-12 text-center">
      <div class="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-3xl text-emerald-700">
        ✓
      </div>
      <h2 class="font-display text-lg italic text-charcoal">Payment confirmed</h2>
      <p class="text-graphite-muted">Your payment was processed successfully.</p>
      <a class="text-champagne hover:underline" [routerLink]="['/orders', orderId]">View order</a>
    </div>
  `,
})
export class PaymentSuccessStateComponent {
  @Input({ required: true }) orderId!: string;
}
