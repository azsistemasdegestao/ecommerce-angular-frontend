import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { adminGetAllPayments } from '../../../core/api/generated/fn/admin-payments/admin-get-all-payments';
import { adminRefundPayment } from '../../../core/api/generated/fn/admin-payments/admin-refund-payment';
import { ApiConfiguration } from '../../../core/api/generated/api-configuration';
import { AdminPaymentSummaryDto } from '../../../core/api/generated/models/admin-payment-summary-dto';

@Injectable({ providedIn: 'root' })
export class AdminPaymentService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfiguration);

  private readonly _payments = signal<AdminPaymentSummaryDto[]>([]);
  private readonly _totalCount = signal(0);
  private readonly _pageNumber = signal(1);
  private readonly _isLoading = signal(false);
  private readonly _refundingIds = signal<ReadonlySet<string>>(new Set());

  readonly payments = this._payments.asReadonly();
  readonly totalCount = this._totalCount.asReadonly();
  readonly pageNumber = this._pageNumber.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly refundingIds = this._refundingIds.asReadonly();

  async loadPayments(pageNumber = 1, pageSize = 20): Promise<void> {
    this._pageNumber.set(pageNumber);
    this._isLoading.set(true);
    try {
      const resp = await firstValueFrom(
        adminGetAllPayments(this.http, this.apiConfig.rootUrl, { page_number: pageNumber, page_size: pageSize }),
      );
      this._payments.set(resp.body!.items);
      this._totalCount.set(Number(resp.body!.total_count));
    } finally {
      this._isLoading.set(false);
    }
  }

  async refund(id: string): Promise<void> {
    this._refundingIds.update((set) => new Set(set).add(id));
    try {
      const resp = await firstValueFrom(adminRefundPayment(this.http, this.apiConfig.rootUrl, { id }));
      // BR-FE-ADMINPAYMENTS-003: update the row locally, no full reload.
      this._payments.update((payments) =>
        payments.map((p) => (p.id === id ? { ...p, status: resp.body!.status } : p)),
      );
    } finally {
      this._refundingIds.update((set) => {
        const next = new Set(set);
        next.delete(id);
        return next;
      });
    }
  }
}
