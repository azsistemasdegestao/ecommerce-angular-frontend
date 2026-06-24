# SPEC-FE-admin-payments — Admin: Payments

## Overview

Administrative view of all payments in the system and the refund action.
Consumes `/admin/payments/**`. Designed **desktop-first**.

## Routes / Screens

| Route | Screen | Auth | Responsive |
|---|---|---|---|
| `/admin/payments` | Listing of all payments | `adminGuard` | Desktop-first |

## Components

- `AdminPaymentTableComponent` — table with columns payment, order, user,
  amount, status, date; per-row refund action (when applicable).
- `RefundConfirmModalComponent` — refund confirmation, showing the amount
  and affected order before confirming.

## State

- `AdminPaymentService` with signals: `payments` (paginated list),
  `isRefunding` (per id, to disable the row during the operation).

## User flows

1. **List**: `/admin/payments` → paginated table of payments from all
   users.
2. **Refund**: for a payment with status `Processed`, a "refund" button →
   confirmation modal showing the amount and affected order → `POST
   /admin/payments/{id}/refund` → success updates the status to
   `Refunded` in the table; the associated order is also cancelled by the
   backend as a side effect (reflect this to the user, without
   automatically navigating to the order).

## API integration

| Endpoint | Usage on screen |
|---|---|
| `GET /admin/payments` | Paginated listing |
| `POST /admin/payments/{id}/refund` | Refund action |

## Loading / error / empty states

- **Empty**: no payments registered → informative message.
- **Refund button**: visible and enabled only for payments with status
  `Processed`; hidden/disabled for `Pending`, `Processing`, `Failed`, and
  `Refunded`.
- **Refund error**: specific message if the API rejects it (e.g. payment
  already refunded by another admin session between the table load and
  the click).

## Business Rules

- **BR-FE-ADMINPAYMENTS-001**: the refund action is only exposed in the
  UI for payments with status `Processed` — never render the button for
  other statuses, even though the attempt would be rejected by the
  backend anyway.
- **BR-FE-ADMINPAYMENTS-002**: a refund always requires explicit
  confirmation via a modal, showing the amount and affected order before
  confirming.
- **BR-FE-ADMINPAYMENTS-003**: after a successful refund, the table row
  is updated to reflect `Refunded` without needing to reload the entire
  page (local update of the item in the list).

## Validation Criteria

### Unit Tests

| ID | Scenario | Input | Expected |
|---|---|---|---|
| AC-FE-ADMINPAYMENTS-U-01 | Refund button appears only for Processed status | Payment with `status: 'Failed'` | Refund button not rendered |
| AC-FE-ADMINPAYMENTS-U-02 | Refund requires confirmation | Click on the refund button of a Processed payment | Confirmation modal shown before the API call |
| AC-FE-ADMINPAYMENTS-U-03 | Successful refund updates the row without a full reload | API returns 200 with status Refunded | Table row shows `Refunded`; other rows are not re-fetched |
| AC-FE-ADMINPAYMENTS-U-04 | Refund error shows a specific message | API returns 409/422 | Error message shown; row keeps the previous status |

### E2E Tests

| ID | Scenario | Input | Expected |
|---|---|---|---|
| AC-FE-ADMINPAYMENTS-E-01 | Full refund flow | Admin refunds a Processed payment | Status changes to Refunded in the table; the associated order appears as Cancelled in `/admin/orders` |

## Dependencies

- `SPEC-FE-00-foundation.md` (adminGuard, ModalComponent,
  PaginationComponent).
- `SPEC-FE-admin-orders.md` (side effect of the refund on the associated
  order).
- Backend: `docs/specs/admin/SPEC-admin.md`, `docs/specs/payments/SPEC-payments.md`.
