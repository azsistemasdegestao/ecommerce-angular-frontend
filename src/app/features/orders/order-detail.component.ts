import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrderService } from './order.service';
import { OrderStatusBadgeComponent } from './components/order-status-badge.component';
import { OrderSummaryComponent } from './components/order-summary.component';
import { CancelOrderButtonComponent } from './components/cancel-order-button.component';

@Component({
  selector: 'app-order-detail',
  imports: [RouterLink, OrderStatusBadgeComponent, OrderSummaryComponent, CancelOrderButtonComponent],
  template: `
    <div class="mx-auto max-w-2xl p-6 md:p-10">
      @if (orderService.orderNotFound()) {
        <div class="flex flex-col items-center gap-4 py-12 text-center">
          <h1 class="font-display text-xl italic text-charcoal">Order not found</h1>
          <a class="text-champagne hover:underline" routerLink="/orders">Back to orders</a>
        </div>
      } @else if (orderService.currentOrder(); as order) {
        <div class="mb-6 flex items-center justify-between">
          <h1 class="font-display text-xl italic text-charcoal">Order #{{ order.id.slice(0, 8) }}</h1>
          <app-order-status-badge [status]="order.status" />
        </div>

        @if (order.status === 'Pending') {
          <a class="mb-4 block text-sm text-champagne hover:underline" [routerLink]="['/orders', order.id, 'payment']">
            View payment status
          </a>
        }

        <app-order-summary
          [items]="order.items"
          [total]="order.total"
          [shippingAddress]="order.shipping_address"
        />

        <div class="mt-6">
          <app-cancel-order-button [orderId]="order.id" [status]="order.status" />
        </div>
      }
    </div>
  `,
})
export class OrderDetailComponent implements OnInit {
  protected readonly orderService = inject(OrderService);
  private readonly route = inject(ActivatedRoute);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    // BR-FE-ORDERS-003: always fetch fresh on visit, never rely on a stale local value.
    if (id) {
      void this.orderService.loadOrderById(id);
    }
  }
}
