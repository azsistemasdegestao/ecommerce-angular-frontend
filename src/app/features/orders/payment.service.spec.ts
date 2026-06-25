import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PaymentService } from './payment.service';
import { provideApiConfiguration } from '../../core/api/generated/api-configuration';
import { environment } from '../../../environments/environment';

const API = environment.apiBaseUrl;
const ORDER_ID = 'order-1';

function paymentResponse(status: string, paymentMethod = 'CreditCard') {
  return {
    id: 'payment-1',
    order_id: ORDER_ID,
    order_user_id: 'user-1',
    amount: 49.9,
    provider: 'mock',
    payment_method: paymentMethod,
    status,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };
}

describe('PaymentService', () => {
  let service: PaymentService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideApiConfiguration(environment.apiBaseUrl),
      ],
    });
    service = TestBed.inject(PaymentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    service.stopPolling();
    vi.useRealTimers();
  });

  it('AC-FE-PAYMENT-U-01: polling starts 600ms after the initial POST, not immediately', async () => {
    const initPromise = service.initialize(ORDER_ID);
    httpMock
      .expectOne(`${API}/api/v1/payments/${ORDER_ID}`)
      .flush({ title: 'Not Found' }, { status: 404, statusText: 'Not Found' });
    await Promise.resolve();
    await Promise.resolve();

    const postReq = httpMock.expectOne(`${API}/api/v1/payments`);
    postReq.flush({ payment_id: 'payment-1', order_id: ORDER_ID, amount: 49.9, status: 'Pending', message: 'ok' });
    await initPromise;

    httpMock.expectNone(`${API}/api/v1/payments/${ORDER_ID}`);

    await vi.advanceTimersByTimeAsync(599);
    httpMock.expectNone(`${API}/api/v1/payments/${ORDER_ID}`);

    await vi.advanceTimersByTimeAsync(2);
    httpMock.expectOne(`${API}/api/v1/payments/${ORDER_ID}`).flush(paymentResponse('Pending'));
  });

  it('AC-FE-PAYMENT-U-03: polling stops immediately on receiving Processed', async () => {
    const initPromise = service.initialize(ORDER_ID);
    httpMock.expectOne(`${API}/api/v1/payments/${ORDER_ID}`).flush(paymentResponse('Pending'));
    await initPromise;

    await vi.advanceTimersByTimeAsync(1000);
    httpMock.expectOne(`${API}/api/v1/payments/${ORDER_ID}`).flush(paymentResponse('Processed'));
    await Promise.resolve();
    await Promise.resolve();

    expect(service.pollingState()).toBe('resolved');

    await vi.advanceTimersByTimeAsync(2000);
    httpMock.expectNone(`${API}/api/v1/payments/${ORDER_ID}`);
  });

  it('AC-FE-PAYMENT-U-04: polling stops after 15s without resolution', async () => {
    const initPromise = service.initialize(ORDER_ID);
    httpMock.expectOne(`${API}/api/v1/payments/${ORDER_ID}`).flush(paymentResponse('Pending'));
    await initPromise;

    for (let i = 0; i < 15; i++) {
      await vi.advanceTimersByTimeAsync(1000);
      httpMock.expectOne(`${API}/api/v1/payments/${ORDER_ID}`).flush(paymentResponse('Pending'));
      await Promise.resolve();
      await Promise.resolve();
    }

    expect(service.pollingState()).toBe('timed_out');
    await vi.advanceTimersByTimeAsync(2000);
    httpMock.expectNone(`${API}/api/v1/payments/${ORDER_ID}`);
  });

  it('AC-FE-PAYMENT-U-05: a network error on a poll does not trigger a Failed state', async () => {
    const initPromise = service.initialize(ORDER_ID);
    httpMock.expectOne(`${API}/api/v1/payments/${ORDER_ID}`).flush(paymentResponse('Pending'));
    await initPromise;

    await vi.advanceTimersByTimeAsync(1000);
    httpMock.expectOne(`${API}/api/v1/payments/${ORDER_ID}`).error(new ProgressEvent('timeout'));
    await Promise.resolve();
    await Promise.resolve();

    expect(service.pollingState()).toBe('polling');
  });

  it('AC-FE-PAYMENT-U-02: polling uses a fixed 1s interval between attempts', async () => {
    const initPromise = service.initialize(ORDER_ID);
    httpMock.expectOne(`${API}/api/v1/payments/${ORDER_ID}`).flush(paymentResponse('Pending'));
    await initPromise;

    // Resuming on an already-Pending payment polls once immediately (0ms);
    // the fixed 1s cadence applies to subsequent polls after that.
    await vi.advanceTimersByTimeAsync(0);
    httpMock.expectOne(`${API}/api/v1/payments/${ORDER_ID}`).flush(paymentResponse('Pending'));
    await Promise.resolve();
    await Promise.resolve();

    for (let i = 0; i < 3; i++) {
      await vi.advanceTimersByTimeAsync(999);
      httpMock.expectNone(`${API}/api/v1/payments/${ORDER_ID}`);
      await vi.advanceTimersByTimeAsync(1);
      httpMock.expectOne(`${API}/api/v1/payments/${ORDER_ID}`).flush(paymentResponse('Pending'));
      await Promise.resolve();
      await Promise.resolve();
    }
  });

  it('AC-FE-PAYMENT-U-06: after 3 consecutive network failures, shows a connection warning', async () => {
    const toastService = TestBed.inject((await import('../../shared/toast/toast.service')).ToastService);
    const showSpy = vi.spyOn(toastService, 'show');

    const initPromise = service.initialize(ORDER_ID);
    httpMock.expectOne(`${API}/api/v1/payments/${ORDER_ID}`).flush(paymentResponse('Pending'));
    await initPromise;

    for (let i = 0; i < 3; i++) {
      await vi.advanceTimersByTimeAsync(1000);
      httpMock.expectOne(`${API}/api/v1/payments/${ORDER_ID}`).error(new ProgressEvent('timeout'));
      await Promise.resolve();
      await Promise.resolve();
    }

    expect(showSpy).toHaveBeenCalledWith('warning', expect.stringContaining('Connection'));
    expect(service.pollingState()).toBe('polling');
  });

  it('AC-FE-PAYMENT-U-07: revisiting the screen does not duplicate the payment POST', async () => {
    const initPromise = service.initialize(ORDER_ID);
    httpMock.expectOne(`${API}/api/v1/payments/${ORDER_ID}`).flush(paymentResponse('Pending'));
    await initPromise;

    httpMock.expectNone(`${API}/api/v1/payments`);
  });

  it('AC-FE-PAYMENT-U-08: leaving the screen cancels in-progress polling', async () => {
    const initPromise = service.initialize(ORDER_ID);
    httpMock.expectOne(`${API}/api/v1/payments/${ORDER_ID}`).flush(paymentResponse('Pending'));
    await initPromise;

    service.stopPolling();
    await vi.advanceTimersByTimeAsync(2000);
    httpMock.expectNone(`${API}/api/v1/payments/${ORDER_ID}`);
  });

  it('AC-FE-PAYMENT-U-09: requestPayment sends the chosen payment method in the request body', async () => {
    const requestPromise = service.requestPayment(ORDER_ID, 'Pix');

    const req = httpMock.expectOne(`${API}/api/v1/payments`);
    expect(req.request.body).toEqual({ order_id: ORDER_ID, payment_method: 'Pix' });
    req.flush({
      payment_id: 'payment-1',
      order_id: ORDER_ID,
      amount: 49.9,
      status: 'Pending',
      payment_method: 'Pix',
      message: 'ok',
    });
    await requestPromise;

    expect(service.payment()?.payment_method).toBe('Pix');
  });

  it('AC-FE-PAYMENT-U-10: retrying after a failure reuses the originally chosen payment method', async () => {
    const firstRequest = service.requestPayment(ORDER_ID, 'Boleto');
    httpMock.expectOne(`${API}/api/v1/payments`).flush({
      payment_id: 'payment-1',
      order_id: ORDER_ID,
      amount: 49.9,
      status: 'Pending',
      payment_method: 'Boleto',
      message: 'ok',
    });
    await firstRequest;
    await vi.advanceTimersByTimeAsync(600);
    httpMock.expectOne(`${API}/api/v1/payments/${ORDER_ID}`).flush(paymentResponse('Failed', 'Boleto'));
    await Promise.resolve();
    await Promise.resolve();

    // Retry omits the method - the service must remember the one chosen originally.
    const retryRequest = service.requestPayment(ORDER_ID);
    const retryReq = httpMock.expectOne(`${API}/api/v1/payments`);
    expect(retryReq.request.body).toEqual({ order_id: ORDER_ID, payment_method: 'Boleto' });
    retryReq.flush({
      payment_id: 'payment-2',
      order_id: ORDER_ID,
      amount: 49.9,
      status: 'Pending',
      payment_method: 'Boleto',
      message: 'ok',
    });
    await retryRequest;
  });
});
