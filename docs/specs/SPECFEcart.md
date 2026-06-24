# SPEC-FE-cart — Cart

## Overview

Authenticated user's shopping cart: add, update quantity, remove items,
clear cart. Consumes `/cart/**`. The cart is never cached (backend rule)
— it always fetches the current state from the API.

## Routes / Screens

| Route | Screen | Auth | Responsive |
|---|---|---|---|
| (global drawer, no dedicated route) | `CartDrawerComponent`, opened from any screen via a header icon | `authGuard` for mutations; visible but empty when anonymous | Mobile-first |
| `/cart` | Dedicated cart page (expanded version of the drawer) | `authGuard` | Mobile-first |

## Components

- `CartDrawerComponent` — side panel/modal accessible from any screen via
  a header icon, shows a quick summary (items, subtotal, "go to
  checkout" button).
- `CartPageComponent` — full-page version at `/cart`, same content as the
  drawer with more room (e.g. inline quantity editing).
- `CartItemRowComponent` — image, name, unit price, quantity selector,
  subtotal, remove button.
- `CartSummaryComponent` — total, item count, "go to checkout" button.

## State

- `CartService` with signals: `cart` (items, total, item_count),
  `isLoading`, `pendingItemIds` (items with an operation in progress, to
  disable controls individually).
- Loads the cart (`GET /cart`) on authentication (login or bootstrap with
  a valid session) and keeps it in memory for the session — never
  persists the cart to `localStorage` (backend rule: the cart is never
  cached/persisted outside the API).
- **Optimistic update**: when adding/updating/removing an item,
  `CartService` updates the local signal immediately (UI responds right
  away) and sends the request in parallel; on error, it undoes the local
  change (rollback) and shows an error toast.

## User flows

1. **Add to cart**: from the catalog/product detail →
   `CartService.addItem(productId, quantity)` → optimistic update →
   `POST /cart/items` → success confirms; 404 (product doesn't exist) or
   422 (insufficient stock) rolls back and shows a specific error.
2. **Update quantity**: user uses the stepper in `CartItemRowComponent` →
   optimistic update → `PUT /cart/items/{itemId}` → 422 (stock) reverts
   to the previous quantity and shows an error; 403 (item doesn't belong
   to the user — session-swap edge case) forces a reload of the cart
   from the server.
3. **Remove item**: remove button → optimistic update (removes from the
   list) → `DELETE /cart/items/{itemId}` → error re-inserts the item.
4. **Clear cart**: "clear cart" button with confirmation
   (`ModalComponent`) → `DELETE /cart`.
5. **Go to checkout**: button in `CartSummaryComponent` → navigates to
   `/checkout` (see `SPEC-FE-orders.md`); blocked if the cart is empty.

## API integration

| Endpoint | Usage on screen |
|---|---|
| `GET /cart` | Loads the initial cart state |
| `POST /cart/items` | Add a product |
| `PUT /cart/items/{itemId}` | Update quantity |
| `DELETE /cart/items/{itemId}` | Remove item |
| `DELETE /cart` | Clear cart |

## Loading / error / empty states

- **Empty**: cart with no items → message "your cart is empty" + link to
  the catalog; checkout button disabled.
- **Initial loading**: skeleton in the drawer/page while `GET /cart`
  loads for the first time in the session.
- **422 error (insufficient stock)**: specific message on the affected
  item ("only N in stock"), not a generic toast.
- **403 error (item belongs to another user)**: forces a full cart reload
  via `GET /cart` (anomalous situation, shouldn't occur in normal use).
- Controls for an item are disabled (`pendingItemIds`) while its own
  operation is in progress, without blocking the rest of the cart.

## Business Rules

- **BR-FE-CART-001**: cart state is never persisted to
  `localStorage`/`sessionStorage`/browser cache — always reflected from
  the API (consistent with the backend rule of never caching the cart).
- **BR-FE-CART-002**: every cart mutation is optimistic in the UI, but
  with automatic rollback on an API error — the user never sees a state
  that wasn't actually persisted on the server for longer than the
  duration of a request.
- **BR-FE-CART-003**: the "go to checkout" button is disabled when
  `item_count === 0`.

## Validation Criteria

### Unit Tests

| ID | Scenario | Input | Expected |
|---|---|---|---|
| AC-FE-CART-U-01 | Adding an item updates the UI before the API responds | `addItem` called | Item appears in the list immediately (optimistic) |
| AC-FE-CART-U-02 | 422 error when adding rolls back the optimistic update | API returns 422 | Item is removed from the local list; error shown |
| AC-FE-CART-U-03 | Updating quantity with insufficient stock reverts the value | API returns 422 on the PUT | Quantity reverts to the previous value; inline error on the item |
| AC-FE-CART-U-04 | Removing an item with a network error re-inserts the item | DELETE fails (timeout) | Item reappears in the list |
| AC-FE-CART-U-05 | Empty cart disables the checkout button | `item_count: 0` | "Go to checkout" button has `disabled` |
| AC-FE-CART-U-06 | Clearing the cart requires confirmation | User clicks "clear cart" | Confirmation modal is shown before calling `DELETE /cart` |

### E2E Tests

| ID | Scenario | Input | Expected |
|---|---|---|---|
| AC-FE-CART-E-01 | Full flow: add product → see it in the drawer → edit quantity → remove | Sequence of actions in catalog and cart | Cart correctly reflects each change after a page reload |
| AC-FE-CART-E-02 | Cart doesn't duplicate items, increments the existing quantity | Add the same product twice | Cart shows 1 item with quantity 2, not 2 separate items |

## Dependencies

- `SPEC-FE-00-foundation.md` (ButtonComponent, ModalComponent,
  ToastService).
- `SPEC-FE-catalog.md` (origin of the "add to cart" action).
- Backend: `docs/specs/cart/SPEC-cart.md`.
