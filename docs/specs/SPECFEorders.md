# SPEC-FE-orders — Orders and Checkout

## Overview

Converting the cart into an order (checkout), listing and detail of the
user's orders, cancellation. Consumes `/orders/**`. The payment step
itself (after the order is created) is described in
`SPEC-FE-payments.md`.

## Routes / Screens

| Route | Screen | Auth | Responsive |
|---|---|---|---|
| `/checkout` | Checkout (delivery address + order review) | `authGuard` | Mobile-first |
| `/orders` | Listing of the user's orders | `authGuard` | Mobile-first |
| `/orders/:id` | Order detail (includes payment status) | `authGuard` | Mobile-first |

## Components

- `CheckoutFormComponent` — delivery address field, summary of the cart
  items (reusing data from `CartService`), "confirm order" button.
- `OrderListComponent` — paginated list of orders with a status filter.
- `OrderSummaryComponent` — items, total, address, used both in the
  checkout review and in the order detail.
- `OrderStatusBadgeComponent` — visual badge per status (Pending,
  Confirmed, Processing, Shipped, Delivered, Cancelled), with distinct
  colors.
- `CancelOrderButtonComponent` — cancel button with confirmation
  (`ModalComponent`), visible only when the status allows it.

## State

- `OrderService` with signals: `orders` (paginated list), `currentOrder`
  (detail), `currentFilters` (page_number, page_size, status),
  `isSubmittingCheckout`.
- Checkout doesn't duplicate the cart state — it reads directly from
  `CartService` (`SPEC-FE-cart.md`) for the item review.

## User flows

1. **Checkout**: a user with items in the cart visits `/checkout` →
   fills in/confirms the delivery address → reviews items and total →
   confirms → `POST /orders` → success (201): `CartService` is emptied
   locally (mirroring that the backend cleared the cart), the user is
   redirected to the payment screen of the newly created order (see
   `SPEC-FE-payments.md`).
2. **Checkout with an empty cart**: visiting `/checkout` with no items in
   the cart redirects back to `/cart` with a message.
3. **Checkout with a stock error**: `POST /orders` returns 422 (some item
   went out of stock between navigation and confirmation) → specific
   message, keeps the user on `/checkout`, suggests reviewing the cart.
4. **List orders**: `/orders` → paginated list, filterable by status →
   clicking an order navigates to `/orders/:id`.
5. **View detail**: `/orders/:id` → shows items, address, current status,
   and the associated payment status; if the order's payment is still
   pending, shows a link/shortcut to the payment screen.
6. **Cancel order**: button visible only when `status` is `Pending` or
   `Confirmed` → confirmation → `POST /orders/{id}/cancel` → success
   updates the status badge to `Cancelled`; 422 (state no longer allows
   cancellation, e.g. already `Shipped`) shows an error and refreshes the
   screen with the real status from the API.

## API integration

| Endpoint | Usage on screen |
|---|---|
| `POST /orders` | Confirm checkout |
| `GET /orders` | Paginated listing with status filter |
| `GET /orders/{id}` | Order detail |
| `POST /orders/{id}/cancel` | Cancel button |

## Loading / error / empty states

- **Empty checkout**: no items in the cart → redirects, does not render
  an empty checkout form.
- **Empty listing**: "you don't have any orders yet" + link to the
  catalog.
- **403/404 on detail**: order doesn't exist or doesn't belong to the
  user → "order not found" screen, with a link back to `/orders`.
- **422 on checkout**: error highlighted per affected item when the API
  returns per-item details; otherwise a generic stock message.
- **422 on cancellation**: message explaining that the order has already
  progressed too far in the flow to be cancelled.

## Business Rules

- **BR-FE-ORDERS-001**: the cancel button only appears for orders in
  `Pending` or `Confirmed` — for other statuses, it isn't even rendered
  (avoids clicks that would result in a predictable 422).
- **BR-FE-ORDERS-002**: after a successful `POST /orders`, the local cart
  state is cleared immediately, without waiting for a new `GET /cart`
  (the backend has already cleared the cart as part of checkout).
- **BR-FE-ORDERS-003**: the order detail screen reflects the latest
  status from the API on every visit — it never relies on a status
  stored locally from a previous visit.

## Validation Criteria

### Unit Tests

| ID | Scenario | Input | Expected |
|---|---|---|---|
| AC-FE-ORDERS-U-01 | Checkout with an empty cart redirects to /cart | `CartService.cart().item_count === 0` on visiting /checkout | Automatic navigation to `/cart` |
| AC-FE-ORDERS-U-02 | Successful checkout clears the local cart | `POST /orders` returns 201 | `CartService.cart().items` becomes empty without a new call to `GET /cart` |
| AC-FE-ORDERS-U-03 | 422 error on checkout keeps the user on the screen | API returns 422 | Stays on `/checkout`, error message shown |
| AC-FE-ORDERS-U-04 | Cancel button hidden for a Shipped order | `order.status === 'Shipped'` | `CancelOrderButtonComponent` not rendered |
| AC-FE-ORDERS-U-05 | Successful cancellation updates the status badge | `POST /orders/{id}/cancel` returns 200 with status Cancelled | Badge changes to "Cancelled" without a manual page reload |
| AC-FE-ORDERS-U-06 | Detail of a non-existent order shows a not-found state | API returns 404 | "Order not found" screen rendered |

### E2E Tests

| ID | Scenario | Input | Expected |
|---|---|---|---|
| AC-FE-ORDERS-E-01 | Full flow: cart with items → checkout → order created → appears in the listing | User completes checkout | New order appears in `/orders` with initial status Pending |
| AC-FE-ORDERS-E-02 | Order cancellation reflects in /orders and /orders/:id | User cancels a Pending order | Status updated on both screens |
| AC-FE-ORDERS-E-03 | Status filter in the listing returns only orders with that status | User filters by "Delivered" | All displayed items have a Delivered badge |

## Dependencies

- `SPEC-FE-00-foundation.md` (PaginationComponent, ModalComponent).
- `SPEC-FE-cart.md` (cart state consumed at checkout).
- `SPEC-FE-payments.md` (next step after creating the order).
- Backend: `docs/specs/orders/SPEC-orders.md`.
