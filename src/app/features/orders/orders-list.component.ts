import { Component, OnInit, inject } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { OrderService } from './order.service';
import { OrderStatusBadgeComponent } from './components/order-status-badge.component';
import { SelectComponent, SelectOption } from '../../shared/select/select.component';
import { PaginationComponent } from '../../shared/pagination/pagination.component';

const STATUS_OPTIONS: SelectOption[] = [
  { value: '', label: 'All statuses' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Confirmed', label: 'Confirmed' },
  { value: 'Processing', label: 'Processing' },
  { value: 'Shipped', label: 'Shipped' },
  { value: 'Delivered', label: 'Delivered' },
  { value: 'Cancelled', label: 'Cancelled' },
];

@Component({
  selector: 'app-orders-list',
  imports: [
    DatePipe,
    DecimalPipe,
    ReactiveFormsModule,
    RouterLink,
    OrderStatusBadgeComponent,
    SelectComponent,
    PaginationComponent,
  ],
  template: `
    <div class="mx-auto max-w-3xl p-4 md:p-6">
      <h1 class="mb-4 text-xl font-semibold">Your orders</h1>

      <app-select label="Status" [options]="statusOptions" [formControl]="statusControl" />

      @if (!orderService.isLoading() && orderService.orders().length === 0) {
        <div class="flex flex-col items-center gap-4 py-12 text-center">
          <p class="text-gray-600">You don't have any orders yet.</p>
          <a class="text-blue-600 hover:underline" routerLink="/">Browse the catalog</a>
        </div>
      } @else {
        <div class="mt-4 flex flex-col gap-2">
          @for (order of orderService.orders(); track order.id) {
            <a
              [routerLink]="['/orders', order.id]"
              class="flex items-center justify-between rounded-md border border-gray-200 p-3 hover:bg-gray-50"
            >
              <span class="text-sm text-gray-600">{{ order.created_at | date: 'mediumDate' }}</span>
              <app-order-status-badge [status]="order.status" />
              <span class="text-sm font-semibold">{{ order.total | number: '1.2-2' }}</span>
            </a>
          }
        </div>

        <div class="mt-6">
          <app-pagination
            [page]="orderService.currentFilters().page_number"
            [pageSize]="orderService.currentFilters().page_size"
            [totalItems]="orderService.totalCount()"
            (pageChange)="onPageChange($event)"
          />
        </div>
      }
    </div>
  `,
})
export class OrdersListComponent implements OnInit {
  protected readonly orderService = inject(OrderService);
  protected readonly statusOptions = STATUS_OPTIONS;
  protected readonly statusControl = new FormControl('');

  ngOnInit(): void {
    void this.orderService.loadOrders({});
    this.statusControl.valueChanges.subscribe((status) => {
      void this.orderService.loadOrders({
        ...this.orderService.currentFilters(),
        status: status || undefined,
        page_number: 1,
      });
    });
  }

  onPageChange(page: number): void {
    void this.orderService.loadOrders({ ...this.orderService.currentFilters(), page_number: page });
  }
}
