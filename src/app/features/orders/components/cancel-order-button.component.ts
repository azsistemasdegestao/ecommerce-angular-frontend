import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { OrderService } from '../order.service';
import { ToastService } from '../../../shared/toast/toast.service';
import { ButtonComponent } from '../../../shared/button/button.component';
import { ModalComponent } from '../../../shared/modal/modal.component';

const CANCELLABLE_STATUSES = new Set(['Pending', 'Confirmed']);

@Component({
  selector: 'app-cancel-order-button',
  imports: [ButtonComponent, ModalComponent],
  template: `
    @if (cancellable) {
      <app-button variant="danger" (click)="confirmOpen.set(true)">Cancel order</app-button>

      <app-modal
        [open]="confirmOpen()"
        title="Cancel order"
        confirmLabel="Cancel order"
        [confirmLoading]="isCancelling()"
        (confirm)="cancel()"
        (cancel)="confirmOpen.set(false)"
      >
        Are you sure you want to cancel this order? This cannot be undone.
      </app-modal>
    }
  `,
})
export class CancelOrderButtonComponent {
  @Input({ required: true }) orderId!: string;
  @Input({ required: true }) status!: string;
  @Output() cancelled = new EventEmitter<void>();

  private readonly orderService = inject(OrderService);
  private readonly toastService = inject(ToastService);

  protected readonly confirmOpen = signal(false);
  protected readonly isCancelling = signal(false);

  protected get cancellable(): boolean {
    return CANCELLABLE_STATUSES.has(this.status);
  }

  async cancel(): Promise<void> {
    this.isCancelling.set(true);
    try {
      await this.orderService.cancel(this.orderId);
      this.confirmOpen.set(false);
      this.cancelled.emit();
    } catch (error) {
      const status = (error as { status?: number }).status;
      if (status === 422) {
        // BR-FE-ORDERS-003: reflect the real status from the API, not a stale local value.
        await this.orderService.loadOrderById(this.orderId);
        this.toastService.show('error', 'This order can no longer be cancelled.');
      } else {
        this.toastService.show('error', 'Could not cancel the order. Please try again.');
      }
    } finally {
      this.isCancelling.set(false);
    }
  }
}
