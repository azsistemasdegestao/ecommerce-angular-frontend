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
        <h1 class="text-xl font-semibold">Product not found</h1>
        <a class="text-blue-600 hover:underline" routerLink="/">Back to catalog</a>
      </div>
    } @else if (catalogService.currentProduct(); as product) {
      <div class="grid gap-6 p-4 md:grid-cols-2 md:p-6">
        <img
          [src]="product.image_url"
          [alt]="product.name"
          class="aspect-square w-full rounded-lg bg-gray-50 object-contain object-center"
        />
        <div class="flex flex-col gap-3">
          <p class="text-sm text-gray-500">{{ product.category.name }}</p>
          <h1 class="text-2xl font-semibold">{{ product.name }}</h1>
          <p class="text-xl font-semibold">{{ product.price | number: '1.2-2' }}</p>
          <p class="text-gray-700">{{ product.description }}</p>
          @if (!product.in_stock) {
            <span class="w-fit rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">Out of stock</span>
          } @else {
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="rounded-md border px-3 py-1 text-sm disabled:opacity-50"
                [disabled]="quantity() <= 1"
                (click)="decrementQuantity()"
              >
                -
              </button>
              <span class="w-8 text-center text-sm">{{ quantity() }}</span>
              <button type="button" class="rounded-md border px-3 py-1 text-sm" (click)="incrementQuantity()">
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
