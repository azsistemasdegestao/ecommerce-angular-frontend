import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CartService } from '../cart/cart.service';
import { OrderService } from './order.service';
import { PaymentService } from './payment.service';
import { OrderSummaryComponent } from './components/order-summary.component';
import { InputComponent } from '../../shared/input/input.component';
import { ButtonComponent } from '../../shared/button/button.component';

interface PaymentMethodOption {
  value: string;
  label: string;
}

const PAYMENT_METHOD_OPTIONS: PaymentMethodOption[] = [
  { value: 'CreditCard', label: 'Credit card' },
  { value: 'Pix', label: 'Pix' },
  { value: 'Boleto', label: 'Boleto' },
];

@Component({
  selector: 'app-checkout-page',
  imports: [ReactiveFormsModule, OrderSummaryComponent, InputComponent, ButtonComponent],
  template: `
    <div class="mx-auto max-w-xl p-6 md:p-10">
      <h1 class="mb-6 font-display text-2xl italic text-charcoal">Checkout</h1>

      @if (errorMessage()) {
        <p class="mb-4 text-sm text-red-700" role="alert">{{ errorMessage() }}</p>
      }

      <app-order-summary
        [items]="cartService.cart().items"
        [total]="cartService.cart().total"
      />

      <form class="mt-6 flex flex-col gap-4" [formGroup]="form" (ngSubmit)="submit()">
        <app-input
          label="Shipping address"
          formControlName="shipping_address"
          [errorMessage]="addressError()"
        />

        <div>
          <p class="mb-2 text-sm font-medium text-charcoal">Payment method</p>
          <div class="flex gap-2">
            @for (option of paymentMethodOptions; track option.value) {
              <button
                type="button"
                class="flex-1 rounded-sm border px-3 py-2 text-sm transition-colors"
                [class]="
                  form.controls.payment_method.value === option.value
                    ? 'border-champagne text-charcoal'
                    : 'border-charcoal/20 text-graphite-muted hover:border-champagne'
                "
                (click)="form.controls.payment_method.setValue(option.value)"
              >
                {{ option.label }}
              </button>
            }
          </div>
        </div>

        <app-button type="submit" [loading]="orderService.isSubmittingCheckout()">
          Confirm order
        </app-button>
      </form>
    </div>
  `,
})
export class CheckoutPageComponent implements OnInit {
  protected readonly cartService = inject(CartService);
  protected readonly orderService = inject(OrderService);
  private readonly paymentService = inject(PaymentService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  protected readonly errorMessage = signal('');
  protected readonly paymentMethodOptions = PAYMENT_METHOD_OPTIONS;

  protected readonly form = this.fb.nonNullable.group({
    shipping_address: ['', [Validators.required]],
    payment_method: ['CreditCard', [Validators.required]],
  });

  ngOnInit(): void {
    // Empty checkout never renders the form - redirect back with no flash.
    if (this.cartService.isEmpty()) {
      void this.router.navigate(['/cart'], { queryParams: { emptyCheckout: '1' } });
    }
  }

  protected addressError(): string {
    const control = this.form.controls.shipping_address;
    return control.touched && control.hasError('required') ? 'Shipping address is required.' : '';
  }

  async submit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.errorMessage.set('');
    try {
      const { shipping_address, payment_method } = this.form.getRawValue();
      const order = await this.orderService.checkout(shipping_address);
      try {
        await this.paymentService.requestPayment(order.id, payment_method);
      } catch {
        // The payment screen retries the request automatically on load if none exists yet.
      }
      await this.router.navigate(['/orders', order.id, 'payment']);
    } catch (error) {
      const status = (error as { status?: number }).status;
      this.errorMessage.set(
        status === 422
          ? 'Some items in your cart are no longer available in the requested quantity. Please review your cart.'
          : 'Something went wrong. Please try again.',
      );
    }
  }
}
