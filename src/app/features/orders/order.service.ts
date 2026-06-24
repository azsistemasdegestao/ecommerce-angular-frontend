import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { createOrder } from '../../core/api/generated/fn/orders/create-order';
import { getOrders } from '../../core/api/generated/fn/orders/get-orders';
import { getOrderById } from '../../core/api/generated/fn/orders/get-order-by-id';
import { cancelOrder } from '../../core/api/generated/fn/orders/cancel-order';
import { ApiConfiguration } from '../../core/api/generated/api-configuration';
import { OrderSummaryDto } from '../../core/api/generated/models/order-summary-dto';
import { OrderDetailDto } from '../../core/api/generated/models/order-detail-dto';
import { CreateOrderResponse } from '../../core/api/generated/models/create-order-response';
import { CartService } from '../cart/cart.service';

export interface OrderFilters {
  page_number: number;
  page_size: number;
  status?: string;
}

export const DEFAULT_ORDER_FILTERS: OrderFilters = { page_number: 1, page_size: 20 };

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfiguration);
  private readonly cartService = inject(CartService);

  private readonly _orders = signal<OrderSummaryDto[]>([]);
  private readonly _totalCount = signal(0);
  private readonly _currentFilters = signal<OrderFilters>(DEFAULT_ORDER_FILTERS);
  private readonly _currentOrder = signal<OrderDetailDto | null>(null);
  private readonly _orderNotFound = signal(false);
  private readonly _isLoading = signal(false);
  private readonly _isSubmittingCheckout = signal(false);

  readonly orders = this._orders.asReadonly();
  readonly totalCount = this._totalCount.asReadonly();
  readonly currentFilters = this._currentFilters.asReadonly();
  readonly currentOrder = this._currentOrder.asReadonly();
  readonly orderNotFound = this._orderNotFound.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly isSubmittingCheckout = this._isSubmittingCheckout.asReadonly();

  async loadOrders(filters: Partial<OrderFilters>): Promise<void> {
    const normalized = { ...DEFAULT_ORDER_FILTERS, ...filters };
    this._currentFilters.set(normalized);
    this._isLoading.set(true);
    try {
      const resp = await firstValueFrom(
        getOrders(this.http, this.apiConfig.rootUrl, {
          page_number: normalized.page_number,
          page_size: normalized.page_size,
          status: normalized.status,
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
      const resp = await firstValueFrom(getOrderById(this.http, this.apiConfig.rootUrl, { id }));
      this._currentOrder.set(resp.body!);
    } catch (error) {
      const status = (error as { status?: number }).status;
      if (status === 404 || status === 403) {
        this._orderNotFound.set(true);
        this._currentOrder.set(null);
      } else {
        throw error;
      }
    } finally {
      this._isLoading.set(false);
    }
  }

  /** BR-FE-ORDERS-002: on success, the local cart is cleared immediately. */
  async checkout(shippingAddress: string): Promise<CreateOrderResponse> {
    this._isSubmittingCheckout.set(true);
    try {
      const resp = await firstValueFrom(
        createOrder(this.http, this.apiConfig.rootUrl, { body: { shipping_address: shippingAddress } }),
      );
      this.cartService.clearLocal();
      return resp.body!;
    } finally {
      this._isSubmittingCheckout.set(false);
    }
  }

  /** BR-FE-ORDERS-003: always reflects the latest status returned by the API. */
  async cancel(id: string): Promise<void> {
    const resp = await firstValueFrom(cancelOrder(this.http, this.apiConfig.rootUrl, { id }));
    const { status, updated_at } = resp.body!;
    this._currentOrder.update((order) => (order ? { ...order, status, updated_at } : order));
    this._orders.update((orders) => orders.map((o) => (o.id === id ? { ...o, status } : o)));
  }
}
