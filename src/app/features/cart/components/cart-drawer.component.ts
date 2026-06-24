import { Component, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../cart.service';
import { ButtonComponent } from '../../../shared/button/button.component';

@Component({
  selector: 'app-cart-drawer',
  imports: [DecimalPipe, RouterLink, ButtonComponent],
  template: `
    @if (cartService.isDrawerOpen()) {
      <div class="fixed inset-0 z-30 bg-charcoal/60" (click)="cartService.closeDrawer()"></div>
      <aside class="fixed right-0 top-0 z-40 flex h-full w-80 flex-col gap-4 bg-surface p-6 shadow-xl">
        <div class="flex items-center justify-between">
          <h2 class="font-display text-lg italic text-charcoal">Cart</h2>
          <button type="button" class="text-graphite-muted hover:text-charcoal" (click)="cartService.closeDrawer()">
            Close
          </button>
        </div>

        @if (cartService.isEmpty()) {
          <p class="text-sm text-graphite-muted">Your cart is empty.</p>
        } @else {
          <ul class="flex-1 overflow-y-auto">
            @for (item of cartService.cart().items; track item.id) {
              <li class="flex justify-between border-b border-charcoal/10 py-2 text-sm text-charcoal">
                <span>{{ item.product_name }} × {{ item.quantity }}</span>
                <span class="text-champagne">{{ item.subtotal | number: '1.2-2' }}</span>
              </li>
            }
          </ul>
          <div class="flex justify-between text-base font-medium text-charcoal">
            <span>Total</span>
            <span class="text-champagne">{{ cartService.cart().total | number: '1.2-2' }}</span>
          </div>
          <app-button (click)="goToCheckout()">Go to checkout</app-button>
        }

        <a
          class="text-center text-sm text-champagne hover:underline"
          routerLink="/cart"
          (click)="cartService.closeDrawer()"
        >
          View full cart
        </a>
      </aside>
    }
  `,
})
export class CartDrawerComponent {
  protected readonly cartService = inject(CartService);
  private readonly router = inject(Router);

  async goToCheckout(): Promise<void> {
    if (this.cartService.isEmpty()) return;
    this.cartService.closeDrawer();
    await this.router.navigateByUrl('/checkout');
  }
}
