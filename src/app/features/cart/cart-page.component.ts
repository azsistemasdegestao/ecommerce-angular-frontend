import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CartService } from './cart.service';
import { CartItemRowComponent } from './components/cart-item-row.component';
import { CartSummaryComponent } from './components/cart-summary.component';
import { ModalComponent } from '../../shared/modal/modal.component';

@Component({
  selector: 'app-cart-page',
  imports: [RouterLink, CartItemRowComponent, CartSummaryComponent, ModalComponent],
  template: `
    <div class="mx-auto max-w-2xl p-6 md:p-10">
      <h1 class="mb-6 font-display text-2xl italic text-charcoal">Your cart</h1>

      @if (showEmptyCheckoutMessage()) {
        <p class="mb-4 text-sm text-amber-700" role="status">
          Your cart is empty - add items before checking out.
        </p>
      }

      @if (cartService.isEmpty()) {
        <div class="flex flex-col items-center gap-4 py-12 text-center">
          <p class="text-graphite-muted">Your cart is empty.</p>
          <a class="text-champagne hover:underline" routerLink="/">Browse the catalog</a>
        </div>
      } @else {
        <div>
          @for (item of cartService.cart().items; track item.id) {
            <app-cart-item-row
              [item]="item"
              [pending]="cartService.pendingItemIds().has(item.id)"
              [errorMessage]="cartService.itemErrors()[item.id]"
              (quantityChange)="cartService.updateQuantity(item.id, $event)"
              (remove)="cartService.removeItem(item.id)"
            />
          }
        </div>

        <button
          type="button"
          class="mt-4 text-sm text-red-700 hover:underline"
          (click)="confirmClearOpen.set(true)"
        >
          Clear cart
        </button>
      }

      <app-cart-summary
        [itemCount]="Number(cartService.cart().item_count)"
        [total]="Number(cartService.cart().total)"
        (checkout)="goToCheckout()"
      />

      <app-modal
        [open]="confirmClearOpen()"
        title="Clear cart"
        confirmLabel="Clear"
        (confirm)="clearCart()"
        (cancel)="confirmClearOpen.set(false)"
      >
        Remove all items from your cart? This cannot be undone.
      </app-modal>
    </div>
  `,
})
export class CartPageComponent implements OnInit {
  protected readonly cartService = inject(CartService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly confirmClearOpen = signal(false);
  protected readonly Number = Number;
  protected readonly showEmptyCheckoutMessage = signal(
    this.route.snapshot.queryParamMap.get('emptyCheckout') === '1',
  );

  ngOnInit(): void {
    void this.cartService.loadCart();
  }

  async clearCart(): Promise<void> {
    await this.cartService.clear();
    this.confirmClearOpen.set(false);
  }

  async goToCheckout(): Promise<void> {
    if (this.cartService.isEmpty()) return;
    await this.router.navigateByUrl('/checkout');
  }
}
