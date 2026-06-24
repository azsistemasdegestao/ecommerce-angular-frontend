import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdminOrderService } from './admin-order.service';
import { ForceStatusFormComponent } from './components/force-status-form.component';
import { OrderStatusBadgeComponent } from '../../orders/components/order-status-badge.component';
import { OrderSummaryComponent } from '../../orders/components/order-summary.component';
import { ToastService } from '../../../shared/toast/toast.service';

@Component({
  selector: 'app-admin-order-detail-page',
  imports: [RouterLink, ForceStatusFormComponent, OrderStatusBadgeComponent, OrderSummaryComponent],
  template: `
    <div class="max-w-2xl p-4 lg:p-6">
      @if (adminOrderService.orderNotFound()) {
        <div class="flex flex-col items-center gap-4 py-12 text-center">
          <h1 class="text-xl font-semibold">Order not found</h1>
          <a class="text-blue-600 hover:underline" routerLink="/admin/orders">Back to orders</a>
        </div>
      } @else if (adminOrderService.currentOrder(); as order) {
        <div class="mb-4 flex items-center justify-between">
          <h1 class="text-xl font-semibold">Order #{{ order.id.slice(0, 8) }}</h1>
          <app-order-status-badge [status]="order.status" />
        </div>

        <app-order-summary
          [items]="order.items"
          [total]="order.total"
          [shippingAddress]="order.shipping_address"
        />

        <div class="mt-6">
          <app-force-status-form
            [currentStatus]="order.status"
            [submitting]="isUpdating()"
            (statusChange)="onForceStatus($event)"
          />
        </div>
      }
    </div>
  `,
})
export class AdminOrderDetailPageComponent implements OnInit {
  protected readonly adminOrderService = inject(AdminOrderService);
  private readonly route = inject(ActivatedRoute);
  private readonly toastService = inject(ToastService);

  protected readonly isUpdating = signal(false);
  private orderId = '';

  ngOnInit(): void {
    this.orderId = this.route.snapshot.paramMap.get('id')!;
    void this.adminOrderService.loadOrderById(this.orderId);
  }

  async onForceStatus(status: string): Promise<void> {
    this.isUpdating.set(true);
    try {
      await this.adminOrderService.forceStatus(this.orderId, status);
      this.toastService.show('success', `Order status updated to ${status}.`);
    } catch (error) {
      const apiStatus = (error as { status?: number }).status;
      this.toastService.show(
        'error',
        apiStatus === 422
          ? 'This status transition is not allowed.'
          : 'Could not update the order status.',
      );
    } finally {
      this.isUpdating.set(false);
    }
  }
}
