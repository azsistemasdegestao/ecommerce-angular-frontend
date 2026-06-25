import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CartService } from '../../features/cart/cart.service';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="sticky top-0 z-20 border-b border-charcoal/10 bg-cream/95 backdrop-blur-sm">
      <div class="flex items-center justify-between gap-4 px-6 py-4 md:px-10 lg:px-16">
        <a routerLink="/" class="font-display text-xl italic text-charcoal md:text-2xl">Maison</a>

        <nav class="hidden items-center gap-8 text-sm uppercase tracking-wide text-graphite-muted md:flex">
          <a
            routerLink="/"
            routerLinkActive="text-charcoal"
            [routerLinkActiveOptions]="{ exact: true }"
            class="hover:text-champagne transition-colors"
          >
            Shop
          </a>
          <a routerLink="/orders" routerLinkActive="text-charcoal" class="hover:text-champagne transition-colors">
            Orders
          </a>
        </nav>

        <div class="flex items-center gap-5">
          <button type="button" class="text-charcoal/70 hover:text-champagne transition-colors" aria-label="Search">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>

          <a
            [routerLink]="authService.currentUser() ? '/account' : '/login'"
            class="text-charcoal/70 hover:text-champagne transition-colors"
            aria-label="Account"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8" />
            </svg>
          </a>

          <button
            type="button"
            class="relative text-charcoal/70 hover:text-champagne transition-colors"
            aria-label="Cart"
            (click)="cartService.toggleDrawer()"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M3 4h2l2.4 12.2a2 2 0 0 0 2 1.8h7.2a2 2 0 0 0 2-1.6L20 8H6" />
              <circle cx="9" cy="20" r="1" />
              <circle cx="17" cy="20" r="1" />
            </svg>
            @if (Number(cartService.cart().item_count) > 0) {
              <span
                class="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-champagne text-[10px] font-medium text-charcoal"
              >
                {{ cartService.cart().item_count }}
              </span>
            }
          </button>

          <button
            type="button"
            class="text-charcoal/70 hover:text-champagne transition-colors md:hidden"
            aria-label="Menu"
            (click)="mobileMenuOpen.set(!mobileMenuOpen())"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      @if (mobileMenuOpen()) {
        <nav class="flex flex-col gap-1 border-t border-charcoal/10 px-6 py-4 text-sm uppercase tracking-wide text-graphite-muted md:hidden">
          <a routerLink="/" class="py-2 hover:text-champagne transition-colors" (click)="mobileMenuOpen.set(false)">Shop</a>
          <a routerLink="/orders" class="py-2 hover:text-champagne transition-colors" (click)="mobileMenuOpen.set(false)">Orders</a>
        </nav>
      }
    </header>
  `,
})
export class NavbarComponent {
  protected readonly cartService = inject(CartService);
  protected readonly authService = inject(AuthService);
  protected readonly mobileMenuOpen = signal(false);
  protected readonly Number = Number;
}
