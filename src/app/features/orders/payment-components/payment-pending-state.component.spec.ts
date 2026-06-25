import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PaymentPendingStateComponent } from './payment-pending-state.component';

// jsdom has no real <canvas> support, so the QR rendering itself is stubbed here;
// this spec only verifies that the component wires the mock Pix code into it.
vi.mock('qrcode', () => ({
  toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,fake'),
}));

describe('PaymentPendingStateComponent', () => {
  let fixture: ComponentFixture<PaymentPendingStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PaymentPendingStateComponent] }).compileComponents();
    fixture = TestBed.createComponent(PaymentPendingStateComponent);
  });

  it('shows a generic processing spinner for non-Pix methods', () => {
    fixture.componentRef.setInput('paymentMethod', 'CreditCard');
    fixture.componentRef.setInput('paymentId', 'payment-1');
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Processing your payment');
    expect(el.querySelector('img')).toBeNull();
  });

  it('shows a mock Pix QR code and copy-paste code for the Pix method', async () => {
    fixture.componentRef.setInput('paymentMethod', 'Pix');
    fixture.componentRef.setInput('paymentId', 'payment-1');
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Scan the Pix QR code');
    expect(el.textContent).toContain('Simulated Pix code');

    // The QR code data URL resolves asynchronously.
    await Promise.resolve();
    await Promise.resolve();
    fixture.detectChanges();

    const img = el.querySelector('img');
    expect(img?.getAttribute('src')).toContain('data:image');
  });
});
