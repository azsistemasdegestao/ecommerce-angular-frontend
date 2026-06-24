import { Component, OnInit, inject } from '@angular/core';
import { AdminOrderService } from './admin-order.service';
import { AdminOrderTableComponent } from './components/admin-order-table.component';
import { AdminOrderFilterBarComponent, AdminOrderFilterChange } from './components/admin-order-filter-bar.component';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';

@Component({
  selector: 'app-admin-orders-page',
  imports: [AdminOrderTableComponent, AdminOrderFilterBarComponent, PaginationComponent],
  template: `
    <div class="p-4 lg:p-6">
      <h1 class="mb-4 text-xl font-semibold">Orders</h1>

      <app-admin-order-filter-bar (filtersChange)="onFiltersChange($event)" />

      @if (!adminOrderService.isLoading() && adminOrderService.orders().length === 0) {
        <p class="mt-6 text-gray-600">No orders match the current filters.</p>
      } @else {
        <div class="mt-4 overflow-x-auto">
          <app-admin-order-table [orders]="adminOrderService.orders()" />
        </div>

        <div class="mt-4">
          <app-pagination
            [page]="adminOrderService.currentFilters().page_number"
            [pageSize]="adminOrderService.currentFilters().page_size"
            [totalItems]="adminOrderService.totalCount()"
            (pageChange)="onPageChange($event)"
          />
        </div>
      }
    </div>
  `,
})
export class AdminOrdersPageComponent implements OnInit {
  protected readonly adminOrderService = inject(AdminOrderService);

  ngOnInit(): void {
    void this.adminOrderService.loadOrders({});
  }

  onFiltersChange(change: AdminOrderFilterChange): void {
    void this.adminOrderService.loadOrders({ ...change, page_number: 1 });
  }

  onPageChange(page: number): void {
    void this.adminOrderService.loadOrders({ ...this.adminOrderService.currentFilters(), page_number: page });
  }
}
