# SPEC-FE-payments — Payment

## Overview

Payment status screen shown immediately after checkout (or when
revisiting an order with a pending payment). The backend processes
payments asynchronously: `POST /payments` responds `202 Accepted`
immediately and the actual result (`Processed`/`Failed`) only becomes
available later, via polling on `GET /payments/{orderId}`. This is the
most sensitive part of the frontend in terms of asynchronous UX.

## Routes / Screens

| Route | Screen | Auth | Responsive |
|---|---|---|---|
| `/orders/:id/payment` | Order payment status | `authGuard` | Mobile-first |

## Components

- `PaymentStatusPageComponent` — orchestrates triggering the payment (if
  not already requested) and displaying the current state.
- `PaymentPendingStateComponent` — spinner + "processing your payment"
  text, visible while status is `Pending`/`Processing`.
- `PaymentSuccessStateComponent` — visual confirmation, link to the order
  detail.
- `PaymentFailedStateComponent` — failure message, "try payment again"
  button (re-does `POST /payments` for the same order).
- `PaymentTimeoutStateComponent` — shown if polling expires without
  resolution; manual "check status now" button.

## State

- `PaymentService` with signals: `payment` (current DTO), `pollingState`
  (`idle | polling | resolved | timed_out`), `networkRetryCount`.
- Polling logic is entirely encapsulated in `PaymentService`
  (`startPolling(orderId)` / `stopPolling()`), not in the component — so
  it's independently testable and reusable in case the user leaves and
  returns to the screen.

## User flows

1. **Triggering payment**: on arriving at `/orders/:id/payment` from
   checkout, if no payment exists yet for the order, triggers `POST
   /payments` (202) and starts polling immediately.
2. **Revisit**: if the user leaves the screen and comes back (or reloads
   the page) with a payment already `Pending`/`Processing`, the screen
   does not trigger a new `POST /payments` — it only resumes polling via
   `GET /payments/{orderId}` (client-side idempotency).
3. **Polling** (`BR-FE-PAYMENT-001`): after the initial delay, queries
   `GET /payments/{orderId}` at a fixed interval until the status is no
   longer `Pending`/`Processing`, until timeout, or until the screen is
   destroyed (navigation away).
4. **Successful resolution**: status becomes `Processed` → stops polling
   → shows `PaymentSuccessStateComponent` → link to `/orders/:id`.
5. **Failed resolution**: status becomes `Failed` → stops polling → shows
   `PaymentFailedStateComponent` with a button to try again (new `POST
   /payments` for the same `order_id`).
6. **Timeout**: polling reaches the time limit without resolution → shows
   `PaymentTimeoutStateComponent` with a manual status-check button
   (which makes a single on-demand call to `GET /payments/{orderId}`,
   without restarting automatic polling).
7. **Network error during polling**: does not interrupt the flow or show
   an error to the user on the first attempts — see the retry Business
   Rule.

## API integration

| Endpoint | Usage on screen |
|---|---|
| `POST /payments` | Initial payment trigger and "try again" after failure |
| `GET /payments/{orderId}` | Status polling and manual check after timeout |

## Loading / error / empty states

- **Pending/Processing**: `PaymentPendingStateComponent`, no action
  buttons (user just waits).
- **Processed**: `PaymentSuccessStateComponent`.
- **Failed**: `PaymentFailedStateComponent` with a retry action.
- **Polling timeout**: `PaymentTimeoutStateComponent`, visually distinct
  from `Failed` — it's not a confirmed error, it's "we don't know yet".
- **Persistent network error** (silent retries exhausted): shows a
  connection-error toast, but keeps the pending state on screen (does not
  assume a payment failure due to a client-side network issue).

## Business Rules

- **BR-FE-PAYMENT-001 (polling parameters)**:
  - Initial delay before the first poll: **600ms** after `POST /payments`
    returns 202.
  - Interval between subsequent polls: **1 second**, fixed (no
    exponential backoff — the mock gateway resolves in 100-500ms, so a
    short, constant interval is sufficient).
  - Total automatic polling timeout: **15 seconds** from the first poll.
    If no resolution (`Processed`/`Failed`) occurs within that window,
    automatic polling stops and the screen moves to the timeout state.
  - Network errors during an individual poll (not to be confused with a
    business response): up to **3 silent retry attempts** (without
    showing an error to the user) before considering the connection
    unstable and warning via toast — these retries do not consume the
    15s timeout budget in a way that would prematurely interrupt
    polling.
- **BR-FE-PAYMENT-002**: never trigger a second `POST /payments` for the
  same order while a payment is already `Pending`/`Processing` for it
  (avoids duplicate charges); the retry button is only available in the
  `Failed` state.
- **BR-FE-PAYMENT-003**: when leaving the payment screen (navigating to
  another route), automatic polling is cancelled (no background timer
  leaks).

## Validation Criteria

### Unit Tests

| ID | Scenario | Input | Expected |
|---|---|---|---|
| AC-FE-PAYMENT-U-01 | Polling starts 600ms after the initial POST | `POST /payments` returns 202 | The first `GET /payments/{orderId}` occurs only after 600ms, not immediately |
| AC-FE-PAYMENT-U-02 | Polling uses a fixed 1s interval between attempts | Successive polls with Pending status | Each subsequent poll occurs ~1s after the previous one, with no growing interval |
| AC-FE-PAYMENT-U-03 | Polling stops immediately on receiving Processed | A poll returns status Processed | No new `GET` is triggered after that point |
| AC-FE-PAYMENT-U-04 | Polling stops after 15s without resolution | Status remains Pending/Processing past 15s | State changes to `timed_out`; automatic polling stops |
| AC-FE-PAYMENT-U-05 | Network error on a poll does not trigger a payment-failure state | A `GET` fails due to a network timeout | State remains `polling`, does not become `Failed`; automatic retry occurs |
| AC-FE-PAYMENT-U-06 | After 3 consecutive network failures, shows a connection warning | 3 consecutive `GET` calls fail | Connection-error toast shown, but the payment state is unchanged |
| AC-FE-PAYMENT-U-07 | Revisiting the screen does not duplicate the payment POST | Payment already exists with status Pending when the component mounts | Only `GET /payments/{orderId}` is called, never a new `POST /payments` |
| AC-FE-PAYMENT-U-08 | Leaving the screen cancels in-progress polling | Component destroyed while status is still Pending | No new `GET` occurs after navigating away |

### E2E Tests

| ID | Scenario | Input | Expected |
|---|---|---|---|
| AC-FE-PAYMENT-E-01 | Approved payment leads to the success screen | Full checkout flow through `Processed` resolution | User sees confirmation and can navigate to the order detail |
| AC-FE-PAYMENT-E-02 | Declined payment allows trying again | Flow through `Failed` resolution | Retry button triggers a new `POST /payments` and restarts polling |
| AC-FE-PAYMENT-E-03 | Timeout shows a manual check button | Simulated polling with no resolution for more than 15s | Manual button appears and, on click, performs a new status query |

## Dependencies

- `SPEC-FE-00-foundation.md` (SpinnerComponent, ToastService).
- `SPEC-FE-orders.md` (origin of the flow: newly created order).
- Backend: `docs/specs/payments/SPEC-payments.md` (event flow
  `PaymentRequested` → `PaymentProcessed`/`PaymentFailed`).
