import { Component, Input } from '@angular/core';

const STATUS_CLASSES: Record<string, string> = {
  Pending: 'bg-amber-50 text-amber-800',
  Confirmed: 'bg-blue-50 text-blue-800',
  Processing: 'bg-indigo-50 text-indigo-800',
  Shipped: 'bg-purple-50 text-purple-800',
  Delivered: 'bg-emerald-50 text-emerald-800',
  Cancelled: 'bg-charcoal/5 text-graphite-muted',
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
    return STATUS_CLASSES[this.status] ?? 'bg-charcoal/5 text-graphite-muted';
  }
}
