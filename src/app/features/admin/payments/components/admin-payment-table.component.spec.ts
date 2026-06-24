import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { AdminPaymentTableComponent } from './admin-payment-table.component';

describe('AdminPaymentTableComponent', () => {
  let fixture: ComponentFixture<AdminPaymentTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [AdminPaymentTableComponent] }).compileComponents();
    fixture = TestBed.createComponent(AdminPaymentTableComponent);
  });

  it('AC-FE-ADMINPAYMENTS-U-01: refund button appears only for Processed status', () => {
    fixture.componentRef.setInput('payments', [
      { id: 'p1', order_id: 'o1', user_id: 'u1', user_email: 'a@test.com', amount: 10, status: 'Failed', created_at: '2024-01-01T00:00:00Z' },
    ]);
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(Array.from(el.querySelectorAll('button')).some((b) => b.textContent?.includes('Refund'))).toBe(false);
  });

  it('shows the refund button for a Processed payment', () => {
    fixture.componentRef.setInput('payments', [
      { id: 'p1', order_id: 'o1', user_id: 'u1', user_email: 'a@test.com', amount: 10, status: 'Processed', created_at: '2024-01-01T00:00:00Z' },
    ]);
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(Array.from(el.querySelectorAll('button')).some((b) => b.textContent?.includes('Refund'))).toBe(true);
  });
});
