import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CatalogService } from './catalog.service';
import { CartService } from '../cart/cart.service';
import { ButtonComponent } from '../../shared/button/button.component';
import { ToastService } from '../../shared/toast/toast.service';

@Component({
  selector: 'app-product-detail',
  imports: [DecimalPipe, RouterLink, ButtonComponent],
  template: `
    @if (catalogService.productNotFound()) {
      <div class="flex flex-col items-center gap-4 p-12 text-center">
        <h1 class="font-display text-xl italic text-charcoal">Product not found</h1>
        <a class="text-champagne hover:underline" routerLink="/">Back to catalog</a>
      </div>
    } @else if (catalogService.currentProduct(); as product) {
      <div class="mx-auto grid max-w-7xl gap-10 p-6 md:grid-cols-2 md:gap-16 md:p-10 lg:p-16">
        <img
          [src]="product.image_url"
          [alt]="product.name"
          class="aspect-square w-full rounded-sm bg-cream object-contain object-center"
        />
        <div class="flex flex-col gap-4">
          <p class="text-xs uppercase tracking-wide text-graphite-muted">{{ product.category.name }}</p>
          <h1 class="font-display text-3xl italic text-charcoal md:text-4xl">{{ product.name }}</h1>
          <p class="text-xl font-medium text-champagne">{{ product.price | number: '1.2-2' }}</p>
          <p class="leading-relaxed text-graphite-muted">{{ product.description }}</p>
          @if (!product.in_stock) {
            <span class="w-fit rounded-sm bg-charcoal/5 px-3 py-1 text-sm text-graphite-muted">Out of stock</span>
          } @else {
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="rounded-sm border border-charcoal/20 px-3 py-1 text-sm text-charcoal transition-colors hover:border-champagne hover:text-champagne disabled:opacity-50"
                [disabled]="quantity() <= 1"
                (click)="decrementQuantity()"
              >
                -
              </button>
              <span class="w-8 text-center text-sm text-charcoal">{{ quantity() }}</span>
              <button
                type="button"
                class="rounded-sm border border-charcoal/20 px-3 py-1 text-sm text-charcoal transition-colors hover:border-champagne hover:text-champagne"
                (click)="incrementQuantity()"
              >
                +
              </button>
            </div>
          }
          <app-button [disabled]="!product.in_stock" (click)="addToCart()">Add to cart</app-button>
        </div>
      </div>
    }
  `,
})
export class ProductDetailComponent implements OnInit {
  protected readonly catalogService = inject(CatalogService);
  private readonly cartService = inject(CartService);
  private readonly toastService = inject(ToastService);
  private readonly route = inject(ActivatedRoute);

  protected readonly quantity = signal(1);

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) {
      void this.catalogService.loadProductBySlug(slug);
    }
  }

  protected incrementQuantity(): void {
    this.quantity.update((value) => value + 1);
  }

  protected decrementQuantity(): void {
    this.quantity.update((value) => Math.max(1, value - 1));
  }

  async addToCart(): Promise<void> {
    const product = this.catalogService.currentProduct();
    if (!product || !product.in_stock) return;
    await this.cartService.addItem(
      {
        id: product.id,
        name: product.name,
        slug: product.slug,
        imageUrl: product.image_url,
        price: Number(product.price),
      },
      this.quantity(),
    );
    this.toastService.show('success', `${product.name} added to your cart.`);
    this.quantity.set(1);
  }
}
