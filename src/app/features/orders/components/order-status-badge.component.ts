import { Component, Input } from '@angular/core';

const STATUS_CLASSES: Record<string, string> = {
  Pending: 'bg-yellow-100 text-yellow-800',
  Confirmed: 'bg-blue-100 text-blue-800',
  Processing: 'bg-indigo-100 text-indigo-800',
  Shipped: 'bg-purple-100 text-purple-800',
  Delivered: 'bg-green-100 text-green-800',
  Cancelled: 'bg-gray-100 text-gray-600',
};

@Component({
  selector: 'app-order-status-badge',
  template: `
    <span class="rounded-full px-2.5 py-0.5 text-xs font-medium" [class]="statusClass">
      {{ status }}
    </span>
  `,
})
export class OrderStatusBadgeComponent {
  @Input({ required: true }) status!: string;

  protected get statusClass(): string {
    return STATUS_CLASSES[this.status] ?? 'bg-gray-100 text-gray-600';
  }
}
