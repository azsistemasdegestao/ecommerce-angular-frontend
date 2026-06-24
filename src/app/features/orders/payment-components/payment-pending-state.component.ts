import { Component } from '@angular/core';
import { SpinnerComponent } from '../../../shared/spinner/spinner.component';

@Component({
  selector: 'app-payment-pending-state',
  imports: [SpinnerComponent],
  template: `
    <div class="flex flex-col items-center gap-4 py-12 text-center">
      <app-spinner [size]="40" />
      <p class="text-graphite-muted">Processing your payment...</p>
    </div>
  `,
})
export class PaymentPendingStateComponent {}
