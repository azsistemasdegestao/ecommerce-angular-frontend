# SPEC-FE-00 — Foundation

## Overview

Shared technical foundation for all frontend features. Defines project
setup, routing, authentication/session, API client, shared components,
containerization, and conventions. Every feature spec (`SPEC-FE-auth.md`,
`SPEC-FE-catalog.md`, etc.) references this document instead of repeating
this content.

Stack: Angular 21 (standalone components, no NgModules), SSR with
`@angular/ssr`, Tailwind CSS, Vitest (unit/component), Playwright (E2E),
signals for state, API client generated from the backend's OpenAPI spec.

## Project setup

- `ng new ecommerce-frontend --ssr --style=css --routing` as the starting
  point; remove the default Karma/Jasmine setup and configure Vitest as
  the test runner.
- Tailwind CSS configured via PostCSS, with `tailwind.config.ts` defining
  the standard breakpoints (`sm`, `md`, `lg`, `xl`) — see "Responsive
  strategy" below.
- Folder structure organized by feature, mirroring the backend:
  ```
  src/app/
    core/            (AuthService, interceptors, guards, generated api-client)
    shared/           (Button, Input, Modal, Toast, Spinner, Pagination)
    features/
      auth/
      catalog/
      cart/
      orders/
      payments/
      admin/
        products/
        orders/
        payments/
  ```
- `environment.ts` / `environment.prod.ts` with `apiBaseUrl`, overridden at
  runtime in the container via the `API_BASE_URL` environment variable (see
  "Containerization").

## Routing

- Lazy-loaded routes per feature using `loadChildren` / `loadComponent`.
- High-level structure:
  - `/` → catalog (home/listing)
  - `/products/:slug` → catalog detail
  - `/cart` → cart
  - `/checkout` → orders (checkout)
  - `/orders`, `/orders/:id` → orders
  - `/login`, `/register`, `/forgot-password`, `/reset-password`, `/account` → auth
  - `/admin/products/**`, `/admin/orders/**`, `/admin/payments/**` → admin
- Guards (functional, `CanActivateFn`):
  - `authGuard` — requires a valid session (in-memory access token or a
    successful refresh); redirects to `/login` with `returnUrl` if not
    authenticated.
  - `adminGuard` — requires `authGuard` AND the `Admin` role in the token;
    redirects to `/` (or a 403 page) if authenticated but without the role.
- `/admin/**` routes live in a lazy chunk separate from the storefront
  routes, so they don't inflate the initial client bundle.

## Session state (`AuthService`)

- `AuthService` is the single owner of authentication state, using
  signals:
  - `currentUser: Signal<UserDto | null>`
  - `isAuthenticated: Signal<boolean>` (computed from `currentUser`)
  - `accessToken`: kept in a private service variable (NOT a publicly
    exposed signal, to reduce the access surface) — never persisted to
    `localStorage`/`sessionStorage`.
  - `refreshToken`: persisted to `localStorage` under the key
    `ecommerce_refresh_token`.
- **App bootstrap** (`provideAppInitializer`): on app startup, if a
  `refresh_token` exists in `localStorage`, silently calls `POST
  /auth/refresh` to obtain a new `access_token` before rendering protected
  routes. On failure, clears the refresh token and treats the user as
  anonymous (without forcing a redirect — only route guards do that).
- **Logout**: calls `POST /auth/logout`, clears the in-memory
  `accessToken`, and removes `refresh_token` from `localStorage`,
  regardless of the API response (logout is best-effort on the client
  side).
- **Refresh token rotation**: every response from `/auth/login` or
  `/auth/refresh` replaces the stored `refresh_token` with the newly
  returned value (rotation, consistent with the backend).

## API client

- Generated from the backend's `GET /openapi/v1` using a codegen tool
  (e.g. `openapi-typescript` for types plus a thin layer of Angular
  services using `HttpClient`, or `ng-openapi-gen` to generate the
  services directly). The `npm run generate:api` script runs the codegen
  and writes to `src/app/core/api/generated/`.
- **HTTP Interceptor** (`authInterceptor`):
  - Attaches `Authorization: Bearer <access_token>` to every request to
    the API, except explicitly public routes (login, register,
    forgot/reset-password, catalog GET).
  - On `401 Unauthorized`: attempts a single `POST /auth/refresh` and
    retries the original request with the new token; if the refresh also
    fails, propagates the error and forces a local logout.
  - On `429 Too Many Requests`: reads the `Retry-After` header and exposes
    that value on the handled error, so the UI can show "try again in
    Ns".
  - On any 4xx/5xx error, parses the `ProblemDetails` body (`type`,
    `title`, `status`, `errors`, `traceId`) and turns it into a typed
    error (`ApiError`) consumed by components.
- All dates travel as ISO 8601 UTC; conversion for local display happens
  in components/pipes, never in services.

## Shared components (`shared/`)

Built from scratch with Tailwind, no third-party library:

- `ButtonComponent` — primary/secondary/danger/ghost variants, `loading`
  state (shows an inline spinner and disables the button).
- `InputComponent` / `SelectComponent` — form control wrappers with inline
  validation error display.
- `ModalComponent` — used for confirmations (e.g. product soft-delete,
  payment refund).
- `ToastService` + `ToastComponent` — global notifications
  (success/error/warning), used by the interceptor for errors not handled
  locally.
- `SpinnerComponent` — reusable loading indicator.
- `PaginationComponent` — generic pagination (page_number/page_size/
  total_pages), used by catalog, orders, and admin lists.

## Containerization

- Multi-stage `Dockerfile` at the root of the frontend project:
  - **Stage 1 (build)**: `node:lts` image, `npm ci`, `npm run
    generate:api`, `ng build` (produces the SSR bundle — server and
    browser).
  - **Stage 2 (runtime)**: `node:lts-slim` image, copies only the build
    output (`dist/`) and production `node_modules`, exposes the SSR
    server port (`node dist/ecommerce-frontend/server/server.mjs`).
- A new `frontend` service is added to the project's `docker-compose`, on
  the same network as the other services (API, Postgres, Redis, MinIO,
  etc.).
- `API_BASE_URL` environment variable injected into the container,
  pointing to the API service's hostname inside the compose network (e.g.
  `http://api:8080/api/v1`); read at runtime by the SSR server and exposed
  to the client bundle via a config endpoint or an `index.html`
  transform.

## Responsive strategy

- Standard Tailwind breakpoints, documented and used consistently: `sm`
  640px, `md` 768px, `lg` 1024px, `xl` 1280px.
- **Storefront mobile-first**: `auth`, `catalog`, `cart`, `orders`, and
  `payments` screens are designed starting from the smallest breakpoint,
  with unprefixed base classes representing mobile and `md:`/`lg:` adding
  desktop layout.
- **Admin desktop-first**: `/admin/**` screens are designed for `lg`+
  first (tables, filters, bulk actions); below `md` the layout is purely
  functional (no dedicated optimization — e.g. tables with horizontal
  scroll instead of cards).

## Conventions

- Spec files: `SPEC-FE-[feature].md`.
- Business Rules: `BR-FE-[FEATURE]-NNN` (numbered per feature, starting at
  001).
- Validation Criteria: `AC-FE-[FEATURE]-U-NN` for component/unit tests
  (Vitest), `AC-FE-[FEATURE]-E-NN` for E2E (Playwright).
- Angular component/service naming follows the official style guide
  (`[Name]Component`, `[Name]Service`, `[name].guard.ts`,
  `[name].interceptor.ts`).
- All UI copy is in English; translation keys are not needed at this stage
  (no i18n).

## Validation Criteria

### Unit Tests

| ID | Scenario | Input | Expected |
|---|---|---|---|
| AC-FE-FOUNDATION-U-01 | Interceptor attaches Bearer token when an access token is in memory | Request to a protected route with `accessToken` set | `Authorization: Bearer <token>` header present on the request |
| AC-FE-FOUNDATION-U-02 | Interceptor does not attach a token on public routes | Request to `GET /catalog/products` without a session | `Authorization` header absent |
| AC-FE-FOUNDATION-U-03 | Interceptor performs an automatic refresh on 401 and retries the request | Simulated 401 response followed by a successful refresh | Original request is retried with the new token, with no error visible to the caller |
| AC-FE-FOUNDATION-U-04 | Interceptor forces a local logout if the refresh also fails | 401 on the original request and 401 on the refresh | `AuthService.currentUser()` becomes `null`; refresh token removed from localStorage |
| AC-FE-FOUNDATION-U-05 | `authGuard` blocks a route without a session | Navigation to a protected route without an authenticated user | Redirects to `/login?returnUrl=...` |
| AC-FE-FOUNDATION-U-06 | `adminGuard` blocks an authenticated user without the Admin role | Customer user navigates to `/admin/products` | Redirected away from `/admin/**` |
| AC-FE-FOUNDATION-U-07 | Silent bootstrap uses the stored refresh token | `localStorage` has a valid refresh_token on app startup | `AuthService.isAuthenticated()` becomes `true` before the first protected navigation resolves |

### E2E Tests

| ID | Scenario | Input | Expected |
|---|---|---|---|
| AC-FE-FOUNDATION-E-01 | Page reload keeps the session via the refresh token | Logged-in user reloads the page | Stays authenticated, without needing to log in again |
| AC-FE-FOUNDATION-E-02 | Access to `/admin/**` without permission is blocked | Customer attempts to access `/admin/products` directly via URL | Redirected, does not see admin content |
| AC-FE-FOUNDATION-E-03 | Rate limit shows a message with the wait time | API returns 429 with `Retry-After: 30` on any call | Toast shows a message mentioning the 30s wait |

## Dependencies

- Backend: all endpoints and contract described in `docs/GUARDRAILS.md`,
  `docs/context/CONVENTIONS.md`, and `docs/specs/**` of the backend
  repository.
- No dependency on any other frontend spec (this is the base document).
