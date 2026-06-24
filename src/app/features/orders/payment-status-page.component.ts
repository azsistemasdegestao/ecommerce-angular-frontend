import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PaymentService } from './payment.service';
import { PaymentPendingStateComponent } from './payment-components/payment-pending-state.component';
import { PaymentSuccessStateComponent } from './payment-components/payment-success-state.component';
import { PaymentFailedStateComponent } from './payment-components/payment-failed-state.component';
import { PaymentTimeoutStateComponent } from './payment-components/payment-timeout-state.component';

@Component({
  selector: 'app-payment-status-page',
  imports: [
    PaymentPendingStateComponent,
    PaymentSuccessStateComponent,
    PaymentFailedStateComponent,
    PaymentTimeoutStateComponent,
  ],
  template: `
    <div class="mx-auto max-w-md p-4 md:p-6">
      @switch (paymentService.pollingState()) {
        @case ('timed_out') {
          <app-payment-timeout-state [checking]="isChecking()" (checkNow)="checkNow()" />
        }
        @case ('resolved') {
          @if (paymentService.payment()?.status === 'Processed') {
            <app-payment-success-state [orderId]="orderId" />
          } @else if (paymentService.payment()?.status === 'Failed') {
            <app-payment-failed-state [retrying]="isRetrying()" (retry)="retry()" />
          }
        }
        @default {
          <app-payment-pending-state />
        }
      }
    </div>
  `,
})
export class PaymentStatusPageComponent implements OnInit, OnDestroy {
  protected readonly paymentService = inject(PaymentService);
  private readonly route = inject(ActivatedRoute);

  protected readonly orderId = this.route.snapshot.paramMap.get('id')!;
  protected readonly isChecking = signal(false);
  protected readonly isRetrying = signal(false);

  ngOnInit(): void {
    void this.paymentService.initialize(this.orderId);
  }

  ngOnDestroy(): void {
    // BR-FE-PAYMENT-003: no background timer leaks when navigating away.
    this.paymentService.stopPolling();
  }

  async checkNow(): Promise<void> {
    this.isChecking.set(true);
    try {
      await this.paymentService.checkNow(this.orderId);
    } finally {
      this.isChecking.set(false);
    }
  }

  async retry(): Promise<void> {
    this.isRetrying.set(true);
    try {
      await this.paymentService.requestPayment(this.orderId);
    } finally {
      this.isRetrying.set(false);
    }
  }
}
