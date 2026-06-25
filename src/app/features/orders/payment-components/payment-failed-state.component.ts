import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonComponent } from '../../../shared/button/button.component';

@Component({
  selector: 'app-payment-failed-state',
  imports: [ButtonComponent],
  template: `
    <div class="flex flex-col items-center gap-4 py-12 text-center">
      <div class="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-3xl text-red-700">
        ✕
      </div>
      <h2 class="font-display text-lg italic text-charcoal">Payment failed</h2>
      <p class="text-graphite-muted">We couldn't process your payment.</p>
      <app-button [loading]="retrying" (click)="retry.emit()">Try payment again</app-button>
    </div>
  `,
})
export class PaymentFailedStateComponent {
  @Input() retrying = false;
  @Output() retry = new EventEmitter<void>();
}
