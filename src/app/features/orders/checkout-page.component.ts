import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CartService } from '../cart/cart.service';
import { OrderService } from './order.service';
import { OrderSummaryComponent } from './components/order-summary.component';
import { InputComponent } from '../../shared/input/input.component';
import { ButtonComponent } from '../../shared/button/button.component';

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
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  protected readonly errorMessage = signal('');

  protected readonly form = this.fb.nonNullable.group({
    shipping_address: ['', [Validators.required]],
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
      const order = await this.orderService.checkout(this.form.getRawValue().shipping_address);
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
