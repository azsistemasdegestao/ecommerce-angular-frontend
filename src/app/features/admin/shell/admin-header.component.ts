import { Component, EventEmitter, Output, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-admin-header',
  imports: [RouterLink],
  template: `
    <header class="sticky top-0 z-20 border-b border-charcoal/10 bg-cream/95 backdrop-blur-sm">
      <div class="flex items-center justify-between gap-4 px-4 py-4 md:px-8">
        <div class="flex items-center gap-4">
          <button
            type="button"
            class="text-charcoal/70 transition-colors hover:text-champagne md:hidden"
            aria-label="Menu"
            (click)="toggleSidebar.emit()"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <a routerLink="/admin" class="font-display text-xl italic text-charcoal">Maison Admin</a>
        </div>

        <div class="flex items-center gap-5">
          <a routerLink="/" class="text-sm uppercase tracking-wide text-graphite-muted transition-colors hover:text-champagne">
            View store
          </a>
          @if (authService.currentUser(); as user) {
            <span class="hidden text-sm text-graphite-muted sm:inline">{{ user.email }}</span>
          }
          <button
            type="button"
            class="text-sm uppercase tracking-wide text-graphite-muted transition-colors hover:text-champagne"
            (click)="onLogout()"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  `,
})
export class AdminHeaderComponent {
  @Output() toggleSidebar = new EventEmitter<void>();

  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  async onLogout(): Promise<void> {
    await this.authService.logout();
    await this.router.navigateByUrl('/login');
  }
}
