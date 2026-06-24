import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonComponent } from '../../../shared/button/button.component';

@Component({
  selector: 'app-payment-failed-state',
  imports: [ButtonComponent],
  template: `
    <div class="flex flex-col items-center gap-4 py-12 text-center">
      <div class="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-3xl text-red-600">
        ✕
      </div>
      <h2 class="text-lg font-semibold">Payment failed</h2>
      <p class="text-gray-600">We couldn't process your payment.</p>
      <app-button [loading]="retrying" (click)="retry.emit()">Try payment again</app-button>
    </div>
  `,
})
export class PaymentFailedStateComponent {
  @Input() retrying = false;
  @Output() retry = new EventEmitter<void>();
}
