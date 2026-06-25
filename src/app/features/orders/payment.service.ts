import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { requestPayment as requestPaymentFn } from '../../core/api/generated/fn/payments/request-payment';
import { getPaymentByOrderId } from '../../core/api/generated/fn/payments/get-payment-by-order-id';
import { ApiConfiguration } from '../../core/api/generated/api-configuration';
import { PaymentDetailDto } from '../../core/api/generated/models/payment-detail-dto';
import { ApiError } from '../../core/api/api-error';
import { ToastService } from '../../shared/toast/toast.service';

export type PollingState = 'idle' | 'polling' | 'resolved' | 'timed_out';

const INITIAL_POLL_DELAY_MS = 600;
const POLL_INTERVAL_MS = 1000;
const POLL_TIMEOUT_MS = 15000;
const MAX_NETWORK_RETRIES = 3;

const UNRESOLVED_STATUSES = new Set(['Pending', 'Processing']);

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfiguration);
  private readonly toastService = inject(ToastService);

  private readonly _payment = signal<PaymentDetailDto | null>(null);
  private readonly _pollingState = signal<PollingState>('idle');
  private readonly _networkRetryCount = signal(0);
  private lastPaymentMethod = '';

  readonly payment = this._payment.asReadonly();
  readonly pollingState = this._pollingState.asReadonly();
  readonly networkRetryCount = this._networkRetryCount.asReadonly();

  private pollTimer: ReturnType<typeof setTimeout> | null = null;
  private pollStartedAt = 0;

  /**
   * Called when the payment screen mounts. If no payment exists yet for the
   * order, triggers one. If one already exists and is still
   * Pending/Processing, resumes polling without a new POST (client-side
   * idempotency per BR-FE-PAYMENT-002).
   */
  async initialize(orderId: string): Promise<void> {
    try {
      const resp = await firstValueFrom(getPaymentByOrderId(this.http, this.apiConfig.rootUrl, { orderId }));
      this._payment.set(resp.body!);
      this.lastPaymentMethod = resp.body!.payment_method;
      if (UNRESOLVED_STATUSES.has(resp.body!.status)) {
        this.beginPolling(orderId, 0);
      } else {
        this._pollingState.set('resolved');
      }
    } catch (error) {
      if ((error as ApiError).status === 404) {
        await this.requestPayment(orderId, this.lastPaymentMethod);
      } else {
        throw error;
      }
    }
  }

  /**
   * Initial trigger, and also used for "try again" after a Failed payment -
   * in which case `paymentMethod` is omitted and the previously chosen
   * method (set on the first call) is reused.
   */
  async requestPayment(orderId: string, paymentMethod?: string): Promise<void> {
    const method = paymentMethod || this.lastPaymentMethod || 'CreditCard';
    this.lastPaymentMethod = method;

    const resp = await firstValueFrom(
      requestPaymentFn(this.http, this.apiConfig.rootUrl, { body: { order_id: orderId, payment_method: method } }),
    );
    this._payment.set({
      id: resp.body!.payment_id,
      order_id: resp.body!.order_id,
      amount: resp.body!.amount,
      status: resp.body!.status,
      payment_method: resp.body!.payment_method,
      provider: '',
      order_user_id: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    this.beginPolling(orderId, INITIAL_POLL_DELAY_MS);
  }

  /** Manual on-demand check after a timeout - does not restart automatic polling. */
  async checkNow(orderId: string): Promise<void> {
    const resp = await firstValueFrom(getPaymentByOrderId(this.http, this.apiConfig.rootUrl, { orderId }));
    this._payment.set(resp.body!);
    if (!UNRESOLVED_STATUSES.has(resp.body!.status)) {
      this._pollingState.set('resolved');
    }
  }

  /** BR-FE-PAYMENT-003: cancels any in-progress automatic polling. */
  stopPolling(): void {
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
  }

  private beginPolling(orderId: string, initialDelayMs: number): void {
    this._pollingState.set('polling');
    this._networkRetryCount.set(0);
    this.pollStartedAt = Date.now();
    this.stopPolling();
    this.pollTimer = setTimeout(() => void this.poll(orderId), initialDelayMs);
  }

  private async poll(orderId: string): Promise<void> {
    let resp;
    try {
      resp = await firstValueFrom(getPaymentByOrderId(this.http, this.apiConfig.rootUrl, { orderId }));
    } catch {
      // BR-FE-PAYMENT-001: network errors get up to 3 silent retries before
      // warning the user; the payment state itself is left untouched.
      const retries = this._networkRetryCount() + 1;
      this._networkRetryCount.set(retries);
      if (retries >= MAX_NETWORK_RETRIES) {
        this.toastService.show('warning', 'Connection issue while checking payment status.');
      }
      this.scheduleNextPoll(orderId);
      return;
    }

    this._networkRetryCount.set(0);
    this._payment.set(resp.body!);

    if (!UNRESOLVED_STATUSES.has(resp.body!.status)) {
      this._pollingState.set('resolved');
      this.stopPolling();
      return;
    }

    this.scheduleNextPoll(orderId);
  }

  private scheduleNextPoll(orderId: string): void {
    if (Date.now() - this.pollStartedAt >= POLL_TIMEOUT_MS) {
      this._pollingState.set('timed_out');
      this.stopPolling();
      return;
    }
    this.pollTimer = setTimeout(() => void this.poll(orderId), POLL_INTERVAL_MS);
  }
}
