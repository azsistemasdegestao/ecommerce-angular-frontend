import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-admin-sidebar',
  imports: [RouterLink, RouterLinkActive],
  template: `
    @if (open) {
      <div class="fixed inset-0 z-30 bg-charcoal/40 md:hidden" (click)="closeRequested.emit()"></div>
    }

    <aside
      class="fixed inset-y-0 left-0 z-40 w-64 border-r border-charcoal/10 bg-cream transition-transform duration-300 md:static md:z-0 md:w-56 md:translate-x-0"
      [class.translate-x-0]="open"
      [class.-translate-x-full]="!open"
    >
      <nav class="flex flex-col gap-1 px-4 py-6 text-sm uppercase tracking-wide text-graphite-muted">
        <a
          routerLink="/admin/products"
          routerLinkActive="text-charcoal bg-champagne/10"
          class="flex items-center gap-3 rounded-sm px-3 py-2 transition-colors hover:text-champagne"
          (click)="closeRequested.emit()"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
          </svg>
          Products
        </a>
        <a
          routerLink="/admin/orders"
          routerLinkActive="text-charcoal bg-champagne/10"
          class="flex items-center gap-3 rounded-sm px-3 py-2 transition-colors hover:text-champagne"
          (click)="closeRequested.emit()"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M3 4h2l2.4 12.2a2 2 0 0 0 2 1.8h7.2a2 2 0 0 0 2-1.6L20 8H6" />
            <circle cx="9" cy="20" r="1" />
            <circle cx="17" cy="20" r="1" />
          </svg>
          Orders
        </a>
        <a
          routerLink="/admin/payments"
          routerLinkActive="text-charcoal bg-champagne/10"
          class="flex items-center gap-3 rounded-sm px-3 py-2 transition-colors hover:text-champagne"
          (click)="closeRequested.emit()"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="2" y="5" width="20" height="14" rx="2" />
            <line x1="2" y1="10" x2="22" y2="10" />
          </svg>
          Payments
        </a>
      </nav>
    </aside>
  `,
})
export class AdminSidebarComponent {
  @Input() open = false;
  @Output() closeRequested = new EventEmitter<void>();
}
