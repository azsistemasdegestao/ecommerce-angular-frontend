import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { adminGetAllOrders } from '../../../core/api/generated/fn/admin-orders/admin-get-all-orders';
import { adminGetOrderById } from '../../../core/api/generated/fn/admin-orders/admin-get-order-by-id';
import { adminUpdateOrderStatus } from '../../../core/api/generated/fn/admin-orders/admin-update-order-status';
import { ApiConfiguration } from '../../../core/api/generated/api-configuration';
import { AdminOrderSummaryDto } from '../../../core/api/generated/models/admin-order-summary-dto';
import { OrderDetailDto } from '../../../core/api/generated/models/order-detail-dto';

export interface AdminOrderFilters {
  page_number: number;
  page_size: number;
  status?: string;
  user_id?: string;
}

export const DEFAULT_ADMIN_ORDER_FILTERS: AdminOrderFilters = { page_number: 1, page_size: 20 };

@Injectable({ providedIn: 'root' })
export class AdminOrderService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfiguration);

  private readonly _orders = signal<AdminOrderSummaryDto[]>([]);
  private readonly _totalCount = signal(0);
  private readonly _currentFilters = signal<AdminOrderFilters>(DEFAULT_ADMIN_ORDER_FILTERS);
  private readonly _currentOrder = signal<OrderDetailDto | null>(null);
  private readonly _orderNotFound = signal(false);
  private readonly _isLoading = signal(false);

  readonly orders = this._orders.asReadonly();
  readonly totalCount = this._totalCount.asReadonly();
  readonly currentFilters = this._currentFilters.asReadonly();
  readonly currentOrder = this._currentOrder.asReadonly();
  readonly orderNotFound = this._orderNotFound.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();

  async loadOrders(filters: Partial<AdminOrderFilters>): Promise<void> {
    // BR-FE-ADMINORDERS-002: never implicitly filter by user - shows all by default.
    const normalized = { ...DEFAULT_ADMIN_ORDER_FILTERS, ...filters };
    this._currentFilters.set(normalized);
    this._isLoading.set(true);
    try {
      const resp = await firstValueFrom(
        adminGetAllOrders(this.http, this.apiConfig.rootUrl, {
          page_number: normalized.page_number,
          page_size: normalized.page_size,
          status: normalized.status,
          user_id: normalized.user_id,
        }),
      );
      this._orders.set(resp.body!.items);
      this._totalCount.set(Number(resp.body!.total_count));
    } finally {
      this._isLoading.set(false);
    }
  }

  async loadOrderById(id: string): Promise<void> {
    this._isLoading.set(true);
    this._orderNotFound.set(false);
    try {
      const resp = await firstValueFrom(adminGetOrderById(this.http, this.apiConfig.rootUrl, { id }));
      this._currentOrder.set(resp.body!);
    } catch (error) {
      if ((error as { status?: number }).status === 404) {
        this._orderNotFound.set(true);
      } else {
        throw error;
      }
    } finally {
      this._isLoading.set(false);
    }
  }

  async forceStatus(id: string, status: string): Promise<void> {
    const resp = await firstValueFrom(
      adminUpdateOrderStatus(this.http, this.apiConfig.rootUrl, { id, body: { status } }),
    );
    this._currentOrder.update((order) =>
      order ? { ...order, status: resp.body!.status, updated_at: resp.body!.updated_at } : order,
    );
    this._orders.update((orders) =>
      orders.map((o) => (o.id === id ? { ...o, status: resp.body!.status } : o)),
    );
  }
}
