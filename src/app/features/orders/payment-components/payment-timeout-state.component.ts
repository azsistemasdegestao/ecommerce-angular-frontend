import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonComponent } from '../../../shared/button/button.component';

@Component({
  selector: 'app-payment-timeout-state',
  imports: [ButtonComponent],
  template: `
    <div class="flex flex-col items-center gap-4 py-12 text-center">
      <p class="text-graphite-muted">
        We're still waiting to hear back about your payment. This doesn't mean it failed.
      </p>
      <app-button variant="secondary" [loading]="checking" (click)="checkNow.emit()">
        Check status now
      </app-button>
    </div>
  `,
})
export class PaymentTimeoutStateComponent {
  @Input() checking = false;
  @Output() checkNow = new EventEmitter<void>();
}
