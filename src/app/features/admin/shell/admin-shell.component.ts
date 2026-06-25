import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, ActivatedRouteSnapshot, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { AdminHeaderComponent } from './admin-header.component';
import { AdminSidebarComponent } from './admin-sidebar.component';
import { AdminHeroComponent } from './admin-hero.component';
import { AdminFooterComponent } from './admin-footer.component';

function deepestTitle(snapshot: ActivatedRouteSnapshot): string {
  let current = snapshot.root;
  let title = '';
  while (current.firstChild) {
    current = current.firstChild;
    if (current.data['title']) title = current.data['title'] as string;
  }
  return title;
}

@Component({
  selector: 'app-admin-shell',
  imports: [RouterOutlet, AdminHeaderComponent, AdminSidebarComponent, AdminHeroComponent, AdminFooterComponent],
  template: `
    <div class="flex min-h-screen flex-col bg-cream">
      <app-admin-header (toggleSidebar)="sidebarOpen.set(!sidebarOpen())" />

      <div class="flex flex-1">
        <app-admin-sidebar [open]="sidebarOpen()" (closeRequested)="sidebarOpen.set(false)" />

        <div class="flex min-w-0 flex-1 flex-col">
          <app-admin-hero [title]="currentTitle()" />
          <main class="flex-1 p-4 lg:p-8">
            <router-outlet />
          </main>
          <app-admin-footer />
        </div>
      </div>
    </div>
  `,
})
export class AdminShellComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly sidebarOpen = signal(false);

  protected readonly currentTitle = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => deepestTitle(this.route.snapshot)),
    ),
    { initialValue: deepestTitle(this.route.snapshot) },
  );
}
