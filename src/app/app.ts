import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { ToastComponent } from './shared/toast/toast.component';
import { CartDrawerComponent } from './features/cart/components/cart-drawer.component';
import { CartService } from './features/cart/cart.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastComponent, CartDrawerComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly cartService = inject(CartService);

  private readonly router = inject(Router);
  protected readonly isAdminRoute = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects.startsWith('/admin')),
    ),
    { initialValue: this.router.url.startsWith('/admin') },
  );
}
