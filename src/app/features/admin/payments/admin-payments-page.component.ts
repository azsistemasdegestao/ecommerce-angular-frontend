import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { AdminPaymentService } from './admin-payment.service';
import { AdminPaymentTableComponent } from './components/admin-payment-table.component';
import { RefundConfirmModalComponent } from './components/refund-confirm-modal.component';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';
import { ToastService } from '../../../shared/toast/toast.service';

@Component({
  selector: 'app-admin-payments-page',
  imports: [AdminPaymentTableComponent, RefundConfirmModalComponent, PaginationComponent],
  template: `
    <div class="p-4 lg:p-6">
      <h1 class="mb-4 text-xl font-semibold">Payments</h1>

      @if (!adminPaymentService.isLoading() && adminPaymentService.payments().length === 0) {
        <p class="text-gray-600">No payments registered yet.</p>
      } @else {
        <div class="overflow-x-auto">
          <app-admin-payment-table
            [payments]="adminPaymentService.payments()"
            [refundingIds]="adminPaymentService.refundingIds()"
            (refundRequest)="onRefundRequest($event)"
          />
        </div>

        <div class="mt-4">
          <app-pagination
            [page]="adminPaymentService.pageNumber()"
            [pageSize]="20"
            [totalItems]="adminPaymentService.totalCount()"
            (pageChange)="onPageChange($event)"
          />
        </div>
      }

      <app-refund-confirm-modal
        [open]="refundCandidate() !== null"
        [amount]="refundCandidate()?.amount ?? 0"
        [orderId]="refundCandidate()?.order_id ?? ''"
        [refunding]="isRefundingCandidate()"
        (confirm)="confirmRefund()"
        (cancel)="refundCandidate.set(null)"
      />
    </div>
  `,
})
export class AdminPaymentsPageComponent implements OnInit {
  protected readonly adminPaymentService = inject(AdminPaymentService);
  private readonly toastService = inject(ToastService);

  protected readonly refundCandidate = signal<{ id: string; amount: number | string; order_id: string } | null>(
    null,
  );
  protected readonly isRefundingCandidate = computed(() => {
    const candidate = this.refundCandidate();
    return candidate ? this.adminPaymentService.refundingIds().has(candidate.id) : false;
  });

  ngOnInit(): void {
    void this.adminPaymentService.loadPayments();
  }

  onPageChange(page: number): void {
    void this.adminPaymentService.loadPayments(page);
  }

  onRefundRequest(id: string): void {
    const payment = this.adminPaymentService.payments().find((p) => p.id === id);
    if (payment) {
      this.refundCandidate.set(payment);
    }
  }

  async confirmRefund(): Promise<void> {
    const candidate = this.refundCandidate();
    if (!candidate) return;
    try {
      await this.adminPaymentService.refund(candidate.id);
      this.toastService.show('success', 'Payment refunded.');
    } catch (error) {
      const status = (error as { status?: number }).status;
      this.toastService.show(
        'error',
        status === 409 || status === 422
          ? 'This payment can no longer be refunded.'
          : 'Could not refund the payment.',
      );
    } finally {
      this.refundCandidate.set(null);
    }
  }
}
