import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { AdminPaymentSummaryDto } from '../../../../core/api/generated/models/admin-payment-summary-dto';

@Component({
  selector: 'app-admin-payment-table',
  imports: [DatePipe, DecimalPipe],
  template: `
    <table class="w-full min-w-[720px] table-auto text-left text-sm">
      <thead class="border-b border-gray-200 text-gray-500">
        <tr>
          <th class="py-2">Payment</th>
          <th class="py-2">Order</th>
          <th class="py-2">User</th>
          <th class="py-2">Amount</th>
          <th class="py-2">Status</th>
          <th class="py-2">Date</th>
          <th class="py-2">Actions</th>
        </tr>
      </thead>
      <tbody>
        @for (payment of payments; track payment.id) {
          <tr class="border-b border-gray-100">
            <td class="py-2">{{ payment.id.slice(0, 8) }}</td>
            <td class="py-2">{{ payment.order_id.slice(0, 8) }}</td>
            <td class="py-2">{{ payment.user_email }}</td>
            <td class="py-2">{{ payment.amount | number: '1.2-2' }}</td>
            <td class="py-2">{{ payment.status }}</td>
            <td class="py-2 text-gray-500">{{ payment.created_at | date: 'mediumDate' }}</td>
            <td class="py-2">
              @if (payment.status === 'Processed') {
                <button
                  type="button"
                  class="text-blue-600 hover:underline disabled:opacity-50"
                  [disabled]="refundingIds.has(payment.id)"
                  (click)="refundRequest.emit(payment.id)"
                >
                  Refund
                </button>
              }
            </td>
          </tr>
        }
      </tbody>
    </table>
  `,
})
export class AdminPaymentTableComponent {
  @Input() payments: AdminPaymentSummaryDto[] = [];
  @Input() refundingIds: ReadonlySet<string> = new Set();
  @Output() refundRequest = new EventEmitter<string>();
}
