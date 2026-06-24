import { Component, Input } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminOrderSummaryDto } from '../../../../core/api/generated/models/admin-order-summary-dto';
import { OrderStatusBadgeComponent } from '../../../orders/components/order-status-badge.component';

@Component({
  selector: 'app-admin-order-table',
  imports: [DatePipe, DecimalPipe, RouterLink, OrderStatusBadgeComponent],
  template: `
    <table class="w-full min-w-[640px] table-auto text-left text-sm">
      <thead class="border-b border-charcoal/10 text-graphite-muted">
        <tr>
          <th class="py-2">Order</th>
          <th class="py-2">User</th>
          <th class="py-2">Status</th>
          <th class="py-2">Total</th>
          <th class="py-2">Date</th>
        </tr>
      </thead>
      <tbody>
        @for (order of orders; track order.id) {
          <tr class="border-b border-charcoal/5">
            <td class="py-2">
              <a class="text-champagne hover:underline" [routerLink]="['/admin/orders', order.id]">
                {{ order.id.slice(0, 8) }}
              </a>
            </td>
            <td class="py-2">{{ order.user_email }}</td>
            <td class="py-2"><app-order-status-badge [status]="order.status" /></td>
            <td class="py-2">{{ order.total | number: '1.2-2' }}</td>
            <td class="py-2 text-graphite-muted">{{ order.created_at | date: 'mediumDate' }}</td>
          </tr>
        }
      </tbody>
    </table>
  `,
})
export class AdminOrderTableComponent {
  @Input() orders: AdminOrderSummaryDto[] = [];
}
