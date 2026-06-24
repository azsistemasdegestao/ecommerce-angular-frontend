import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { CancelOrderButtonComponent } from './cancel-order-button.component';
import { provideApiConfiguration } from '../../../core/api/generated/api-configuration';
import { environment } from '../../../../environments/environment';

describe('CancelOrderButtonComponent', () => {
  let fixture: ComponentFixture<CancelOrderButtonComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CancelOrderButtonComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideApiConfiguration(environment.apiBaseUrl),
        provideRouter([]),
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(CancelOrderButtonComponent);
  });

  it('AC-FE-ORDERS-U-04: cancel button hidden for a Shipped order', () => {
    fixture.componentRef.setInput('orderId', 'order-1');
    fixture.componentRef.setInput('status', 'Shipped');
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('button')).toBeNull();
  });

  it('shows the cancel button for a Pending order', () => {
    fixture.componentRef.setInput('orderId', 'order-1');
    fixture.componentRef.setInput('status', 'Pending');
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('button')).not.toBeNull();
  });

  it('AC-FE-ORDERS-U-cancel-confirm: clicking cancel shows confirmation before any API call', () => {
    fixture.componentRef.setInput('orderId', 'order-1');
    fixture.componentRef.setInput('status', 'Pending');
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    el.querySelector('button')?.dispatchEvent(new Event('click', { bubbles: true }));
    fixture.detectChanges();

    expect(el.textContent).toContain('Are you sure you want to cancel this order?');
    httpMock.expectNone(`${environment.apiBaseUrl}/api/v1/orders/order-1/cancel`);
  });
});
