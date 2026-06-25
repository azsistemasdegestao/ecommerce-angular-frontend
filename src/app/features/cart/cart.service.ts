import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { getCart } from '../../core/api/generated/fn/cart/get-cart';
import { addItemToCart } from '../../core/api/generated/fn/cart/add-item-to-cart';
import { updateCartItem } from '../../core/api/generated/fn/cart/update-cart-item';
import { removeCartItem } from '../../core/api/generated/fn/cart/remove-cart-item';
import { clearCart as clearCartFn } from '../../core/api/generated/fn/cart/clear-cart';
import { ApiConfiguration } from '../../core/api/generated/api-configuration';
import { CartDto } from '../../core/api/generated/models/cart-dto';
import { CartItemDto } from '../../core/api/generated/models/cart-item-dto';
import { ApiError } from '../../core/api/api-error';
import { ToastService } from '../../shared/toast/toast.service';
import { AuthService } from '../../core/auth/auth.service';

export interface AddableProduct {
  id: string;
  name: string;
  slug: string;
  imageUrl: string;
  price: number;
}

const EMPTY_CART: CartDto = { id: '', items: [], total: 0, item_count: 0, updated_at: '' };

function recompute(items: CartItemDto[]): Pick<CartDto, 'items' | 'item_count' | 'total'> {
  return {
    items,
    item_count: items.reduce((sum, item) => sum + Number(item.quantity), 0),
    total: items.reduce((sum, item) => sum + Number(item.subtotal), 0),
  };
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfiguration);
  private readonly toastService = inject(ToastService);
  private readonly authService = inject(AuthService);

  private readonly _cart = signal<CartDto>(EMPTY_CART);
  private readonly _isLoading = signal(false);
  private readonly _pendingItemIds = signal<ReadonlySet<string>>(new Set());
  private readonly _itemErrors = signal<Readonly<Record<string, string>>>({});
  private readonly _isDrawerOpen = signal(false);

  readonly isDrawerOpen = this._isDrawerOpen.asReadonly();
  readonly cart = this._cart.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly pendingItemIds = this._pendingItemIds.asReadonly();
  readonly itemErrors = this._itemErrors.asReadonly();
  readonly isEmpty = computed(() => this._cart().item_count === 0);

  constructor() {
    effect(() => {
      if (this.authService.isAuthenticated()) {
        void this.loadCart();
      } else {
        this.clearLocal();
      }
    });
  }

  private setPending(itemId: string, pending: boolean): void {
    this._pendingItemIds.update((set) => {
      const next = new Set(set);
      pending ? next.add(itemId) : next.delete(itemId);
      return next;
    });
  }

  private setItemError(itemId: string, message: string | null): void {
    this._itemErrors.update((errors) => {
      const next = { ...errors };
      if (message) next[itemId] = message;
      else delete next[itemId];
      return next;
    });
  }

  async loadCart(): Promise<void> {
    this._isLoading.set(true);
    try {
      const resp = await firstValueFrom(getCart(this.http, this.apiConfig.rootUrl));
      this._cart.set(resp.body!);
    } finally {
      this._isLoading.set(false);
    }
  }

  async addItem(product: AddableProduct, quantity: number): Promise<boolean> {
    if (!this.authService.isAuthenticated()) {
      this.toastService.show('warning', 'Crie uma conta ou faça login para adicionar itens ao carrinho.');
      return false;
    }

    const previous = this._cart();
    const existing = previous.items.find((item) => item.product_id === product.id);
    const tempId = existing?.id ?? `temp-${Math.random().toString(36).slice(2)}`;

    const optimisticItems = existing
      ? previous.items.map((item) =>
          item.id === existing.id
            ? {
                ...item,
                quantity: Number(item.quantity) + quantity,
                subtotal: Number(item.unit_price) * (Number(item.quantity) + quantity),
              }
            : item,
        )
      : [
          ...previous.items,
          {
            id: tempId,
            product_id: product.id,
            product_name: product.name,
            product_slug: product.slug,
            image_url: product.imageUrl,
            quantity,
            unit_price: product.price,
            subtotal: product.price * quantity,
          },
        ];
    this._cart.set({ ...previous, ...recompute(optimisticItems) });
    this.setPending(tempId, true);

    try {
      const resp = await firstValueFrom(
        addItemToCart(this.http, this.apiConfig.rootUrl, {
          body: { product_id: product.id, quantity },
        }),
      );
      const body = resp.body!;
      this._cart.update((current) => ({
        ...current,
        ...recompute(
          current.items.map((item) =>
            item.id === tempId
              ? {
                  ...item,
                  id: body.item_id,
                  quantity: body.quantity,
                  unit_price: body.unit_price,
                  subtotal: body.subtotal,
                }
              : item,
          ),
        ),
      }));
      return true;
    } catch (error) {
      this._cart.set(previous);
      const apiError = error as ApiError;
      if (apiError.status === 401) {
        this.toastService.show('warning', 'Crie uma conta ou faça login para adicionar itens ao carrinho.');
      } else if (apiError.status === 404) {
        this.toastService.show('error', 'This product is no longer available.');
      } else if (apiError.status === 422) {
        this.toastService.show('error', 'Not enough stock available for this product.');
      } else {
        this.toastService.show('error', 'Could not add this item to your cart.');
      }
      return false;
    } finally {
      this.setPending(tempId, false);
    }
  }

  async updateQuantity(itemId: string, quantity: number): Promise<void> {
    const previous = this._cart();
    const item = previous.items.find((i) => i.id === itemId);
    if (!item) return;
    const previousQuantity = Number(item.quantity);

    this._cart.set({
      ...previous,
      ...recompute(
        previous.items.map((i) =>
          i.id === itemId ? { ...i, quantity, subtotal: Number(i.unit_price) * quantity } : i,
        ),
      ),
    });
    this.setPending(itemId, true);
    this.setItemError(itemId, null);

    try {
      await firstValueFrom(
        updateCartItem(this.http, this.apiConfig.rootUrl, { itemId, body: { quantity } }),
      );
    } catch (error) {
      const apiError = error as ApiError;
      if (apiError.status === 403) {
        await this.loadCart();
        return;
      }
      this._cart.set({
        ...this._cart(),
        ...recompute(
          this._cart().items.map((i) => (i.id === itemId ? { ...i, quantity: previousQuantity, subtotal: Number(i.unit_price) * previousQuantity } : i)),
        ),
      });
      if (apiError.status === 422) {
        this.setItemError(itemId, `Only ${apiError.errors?.['stock']?.[0] ?? 'a limited quantity'} in stock.`);
      } else {
        this.toastService.show('error', 'Could not update the quantity.');
      }
    } finally {
      this.setPending(itemId, false);
    }
  }

  async removeItem(itemId: string): Promise<void> {
    const previous = this._cart();
    const index = previous.items.findIndex((i) => i.id === itemId);
    if (index === -1) return;

    this._cart.set({ ...previous, ...recompute(previous.items.filter((i) => i.id !== itemId)) });
    this.setPending(itemId, true);

    try {
      await firstValueFrom(removeCartItem(this.http, this.apiConfig.rootUrl, { itemId }));
    } catch {
      this._cart.set(previous);
      this.toastService.show('error', 'Could not remove the item. It has been restored.');
    } finally {
      this.setPending(itemId, false);
    }
  }

  async clear(): Promise<void> {
    this._isLoading.set(true);
    try {
      await firstValueFrom(clearCartFn(this.http, this.apiConfig.rootUrl));
      this._cart.set(EMPTY_CART);
    } finally {
      this._isLoading.set(false);
    }
  }

  /** Used after a successful checkout: the backend has already cleared the cart. */
  clearLocal(): void {
    this._cart.set(EMPTY_CART);
  }

  openDrawer(): void {
    this._isDrawerOpen.set(true);
  }

  closeDrawer(): void {
    this._isDrawerOpen.set(false);
  }

  toggleDrawer(): void {
    this._isDrawerOpen.update((open) => !open);
  }
}
