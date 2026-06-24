import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogService } from '../../features/catalog/catalog.service';

@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  template: `
    <footer class="bg-charcoal text-cream">
      <div class="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 py-16 md:grid-cols-4 md:px-10">
        <div class="flex flex-col gap-4">
          <span class="font-display text-xl italic">Maison</span>
          <p class="text-sm text-cream/60">Timeless pieces, curated for you.</p>
          <div class="flex items-center gap-4">
            <a href="#" class="text-cream/60 hover:text-champagne transition-colors" aria-label="Instagram">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="3" y="3" width="18" height="18" rx="4" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
              </svg>
            </a>
            <a href="#" class="text-cream/60 hover:text-champagne transition-colors" aria-label="Facebook">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M15 4h-2a4 4 0 0 0-4 4v3H7v3h2v6h3v-6h2.5l.5-3H12V8a1 1 0 0 1 1-1h2z" />
              </svg>
            </a>
            <a href="#" class="text-cream/60 hover:text-champagne transition-colors" aria-label="Pinterest">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="12" cy="12" r="9" />
                <path d="M9 17l2-9a3 3 0 1 1 4 2.8c0 2-1 3.7-3 3.7" />
              </svg>
            </a>
          </div>
        </div>

        <div class="flex flex-col gap-3">
          <h3 class="text-xs uppercase tracking-widest text-cream/50">Institutional</h3>
          <span class="text-sm text-cream/70">About us</span>
          <span class="text-sm text-cream/70">Sustainability</span>
          <span class="text-sm text-cream/70">Careers</span>
        </div>

        <div class="flex flex-col gap-3">
          <h3 class="text-xs uppercase tracking-widest text-cream/50">Help</h3>
          <span class="text-sm text-cream/70">Shipping &amp; returns</span>
          <span class="text-sm text-cream/70">FAQ</span>
          <span class="text-sm text-cream/70">Contact</span>
        </div>

        <div class="flex flex-col gap-3">
          <h3 class="text-xs uppercase tracking-widest text-cream/50">Categories</h3>
          @for (category of catalogService.categories(); track category.id) {
            <a [routerLink]="['/categories', category.slug]" class="text-sm text-cream/70 hover:text-champagne transition-colors">
              {{ category.name }}
            </a>
          }
        </div>
      </div>

      <div class="border-t border-cream/10 px-6 py-10 md:px-10">
        <div class="mx-auto flex max-w-7xl flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 class="font-display text-lg italic">Stay in touch</h3>
            <p class="text-sm text-cream/60">Subscribe for new arrivals and exclusive offers.</p>
          </div>
          <form class="flex w-full max-w-sm gap-2" (submit)="onSubscribe($event)">
            <input
              type="email"
              placeholder="Your email"
              class="flex-1 border border-cream/30 bg-transparent px-3 py-2 text-sm text-cream placeholder:text-cream/40 focus:border-champagne focus:outline-none"
            />
            <button
              type="submit"
              class="border border-cream/60 px-5 py-2 text-sm uppercase tracking-wide transition-colors duration-300 hover:bg-cream hover:text-charcoal"
            >
              Join
            </button>
          </form>
        </div>
        @if (subscribed()) {
          <p class="mt-3 text-sm text-champagne">Thank you for subscribing.</p>
        }
      </div>

      <div class="border-t border-cream/10 px-6 py-6 text-center text-xs text-cream/40 md:px-10">
        © {{ currentYear }} Maison. All rights reserved.
      </div>
    </footer>
  `,
})
export class FooterComponent implements OnInit {
  protected readonly catalogService = inject(CatalogService);
  protected readonly subscribed = signal(false);
  protected readonly currentYear = new Date().getFullYear();

  ngOnInit(): void {
    void this.catalogService.loadCategories();
  }

  onSubscribe(event: Event): void {
    event.preventDefault();
    this.subscribed.set(true);
  }
}
