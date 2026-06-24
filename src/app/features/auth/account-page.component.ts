import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ButtonComponent } from '../../shared/button/button.component';

@Component({
  selector: 'app-account-page',
  imports: [ButtonComponent],
  template: `
    <div class="mx-auto max-w-sm p-8 md:p-10">
      <h1 class="mb-6 font-display text-2xl italic text-charcoal">Account</h1>

      @if (currentUser(); as user) {
        <dl class="mb-6 flex flex-col gap-2 text-sm text-charcoal">
          <div>
            <dt class="text-graphite-muted">Email</dt>
            <dd>{{ user.email }}</dd>
          </div>
          <div>
            <dt class="text-graphite-muted">Role</dt>
            <dd>{{ user.role }}</dd>
          </div>
        </dl>
      }

      <app-button variant="secondary" [loading]="isLoggingOut()" (click)="logout()">
        Log out
      </app-button>
    </div>
  `,
})
export class AccountPageComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly currentUser = this.authService.currentUser;
  protected readonly isLoggingOut = signal(false);

  async logout(): Promise<void> {
    this.isLoggingOut.set(true);
    try {
      await this.authService.logout();
    } finally {
      this.isLoggingOut.set(false);
      await this.router.navigateByUrl('/');
    }
  }
}
