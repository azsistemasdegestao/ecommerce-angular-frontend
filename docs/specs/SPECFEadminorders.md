# SPEC-FE-admin-orders — Admin: Orders

## Overview

Administrative view of all orders in the system (not just the logged-in
user's), with filters and the ability to manually force a status.
Consumes `/admin/orders/**`. Designed **desktop-first**.

## Routes / Screens

| Route | Screen | Auth | Responsive |
|---|---|---|---|
| `/admin/orders` | Listing of all orders, with filters | `adminGuard` | Desktop-first |
| `/admin/orders/:id` | Order detail (any user) | `adminGuard` | Desktop-first |

## Components

- `AdminOrderTableComponent` — table with columns order, user, status,
  total, date; filters by status and by `user_id`.
- `AdminOrderFilterBarComponent` — status filter (dropdown) and user
  search.
- `ForceStatusFormComponent` — new-status selector + confirmation, used
  on the order detail screen.
- Reuses `OrderSummaryComponent` and `OrderStatusBadgeComponent` from
  `SPEC-FE-orders.md` to display order data (avoids duplicating the
  items/address presentation).

## State

- `AdminOrderService` with signals: `orders` (paginated list),
  `currentOrder`, `currentFilters` (page_number, page_size, status,
  user_id).

## User flows

1. **List**: `/admin/orders` → paginated table of all orders → filters
   by status and/or user.
2. **View detail**: click a row → `/admin/orders/:id` → shows all order
   data (any user, with no ownership restriction unlike the regular
   customer detail screen).
3. **Force status**: on the detail screen, the admin selects a new
   status (e.g. mark as `Shipped`) → confirmation → `POST
   /admin/orders/{id}/status` → table/detail update with the new status.

## API integration

| Endpoint | Usage on screen |
|---|---|
| `GET /admin/orders` | Listing with `status`, `user_id` filters, pagination |
| `GET /admin/orders/{id}` | Detail (any order) |
| `POST /admin/orders/{id}/status` | Force status manually |

## Loading / error / empty states

- **Empty**: no orders for the applied filters → message + suggestion to
  clear filters.
- **404 on detail**: order doesn't exist → not-found screen.
- **Error forcing status**: message explaining the invalid transition,
  if the API rejects the change.

## Business Rules

- **BR-FE-ADMINORDERS-001**: manually changing the status always requires
  explicit confirmation (modal), since it's an action that bypasses the
  order's normal event flow.
- **BR-FE-ADMINORDERS-002**: the admin table never implicitly filters by
  user — by default it shows orders from all users (unlike the regular
  customer listing in `SPEC-FE-orders.md`).

## Validation Criteria

### Unit Tests

| ID | Scenario | Input | Expected |
|---|---|---|---|
| AC-FE-ADMINORDERS-U-01 | Status filter updates the listing | Admin selects status "Cancelled" | `GET /admin/orders` called with `status=Cancelled` |
| AC-FE-ADMINORDERS-U-02 | Filter by user_id returns only that user's orders | Admin enters a `user_id` | Request includes the `user_id` parameter |
| AC-FE-ADMINORDERS-U-03 | Forcing status requires confirmation | Admin selects a new status on the detail screen | Confirmation modal shown before the API call |
| AC-FE-ADMINORDERS-U-04 | Invalid status transition shows an error | API returns 422 | Error message shown, status not changed in the UI |

### E2E Tests

| ID | Scenario | Input | Expected |
|---|---|---|---|
| AC-FE-ADMINORDERS-E-01 | Admin views another user's order | Navigation to `/admin/orders/:id` for an order that isn't the admin's | Detail is shown normally (no 403, unlike the regular customer flow) |
| AC-FE-ADMINORDERS-E-02 | Forcing status reflects in the listing after confirmation | Admin marks an order as Shipped | Badge updated both in the detail and in the listing table |

## Dependencies

- `SPEC-FE-00-foundation.md` (adminGuard, ModalComponent,
  PaginationComponent).
- `SPEC-FE-orders.md` (reused presentation components:
  `OrderSummaryComponent`, `OrderStatusBadgeComponent`).
- Backend: `docs/specs/admin/SPEC-admin.md`, `docs/specs/orders/SPEC-orders.md`.
