# SPEC-FE-catalog — Catalog

## Overview

Product listing and detail, category navigation. This is the public part
of the site, rendered via SSR for SEO. Consumes `/catalog/**`, which is
cached by the backend (5min list, 10min detail, 30min categories).

## Routes / Screens

| Route | Screen | Auth | Rendering | Responsive |
|---|---|---|---|---|
| `/` | Home / product listing | Public | SSR | Mobile-first |
| `/products/:slug` | Product detail | Public | SSR | Mobile-first |
| `/categories/:slug` | Listing filtered by category | Public | SSR | Mobile-first |

## Components

- `ProductGridComponent` — responsive grid of `ProductCardComponent` (1
  column on mobile, multiple columns at `md`+).
- `ProductCardComponent` — image, name, price, stock indicator, link to
  detail.
- `ProductDetailComponent` — image, name, price, description, category,
  "add to cart" button (delegates to `SPEC-FE-cart.md`).
- `FilterBarComponent` — text search, price range, category filter,
  "in stock only" filter; collapses into a panel/drawer on mobile.
- `CategoryNavComponent` — category navigation (header or sidebar).
- Reuses `PaginationComponent` from `SPEC-FE-00-foundation.md`.

## State

- `CatalogService` with signals: `products`, `categories`,
  `currentFilters` (page_number, page_size, category_slug, search,
  min_price, max_price, in_stock), `isLoading`, `totalPages`.
- Filters are reflected in the URL query string (so SSR works correctly
  and filtered links can be shared).
- On SSR, the first render fetches data on the server (no loading flash);
  subsequent client-side navigations use the same service.

## User flows

1. User visits `/` → sees a paginated product grid → can filter by
   category, search, price, stock → URL updates with the filters.
2. User clicks a product → navigates to `/products/:slug` → sees the full
   detail → can add it to the cart.
3. User navigates to a category via `CategoryNavComponent` → grid is
   filtered by `category_slug`.
4. User paginates (`PaginationComponent`) → a new page of results is
   fetched while keeping the active filters.

## API integration

| Endpoint | Usage on screen |
|---|---|
| `GET /catalog/products` | Grid/listing (`/`, `/categories/:slug`), with filter and pagination query params |
| `GET /catalog/products/{slug}` | Detail screen |
| `GET /catalog/categories` | `CategoryNavComponent`, `FilterBarComponent` |

## Loading / error / empty states

- **Loading**: skeleton cards in the grid (not a full-screen spinner, to
  avoid hurting SSR/CLS).
- **Empty**: no products found with the current filters → message "no
  products found" + "clear filters" button.
- **Product 404**: `GET /catalog/products/{slug}` returns 404 (product
  does not exist or was soft-deleted) → the detail page shows "product
  not found" with a link back to the catalog (without breaking
  navigation).
- **Network/5xx error**: generic error message with a "try again"
  button; does not crash the whole screen.

## Business Rules

- **BR-FE-CATALOG-001**: out-of-stock products (`in_stock: false`) remain
  visible in the listing and detail, but the "add to cart" button is
  disabled with an "out of stock" indicator — they must never be hidden
  (the backend only removes soft-deleted products).
- **BR-FE-CATALOG-002**: filters are always reflected in the URL (query
  string), never only in in-memory state, to allow SSR and link sharing.
- **BR-FE-CATALOG-003**: pagination respects the maximum `page_size` of
  100 returned by the backend; the frontend never requests a `page_size`
  above that limit.

## Validation Criteria

### Unit Tests

| ID | Scenario | Input | Expected |
|---|---|---|---|
| AC-FE-CATALOG-U-01 | Search filter updates the query string and re-fetches | User types a search term | URL contains `?search=...`; `GET /catalog/products` called with the parameter |
| AC-FE-CATALOG-U-02 | Out-of-stock product disables the purchase button | `in_stock: false` in the product DTO | "Add to cart" button disabled, "out of stock" badge visible |
| AC-FE-CATALOG-U-03 | Empty listing shows a message and a clear-filters button | API returns `items: []` | "No products found" message rendered |
| AC-FE-CATALOG-U-04 | Product not found shows a 404 state | API returns 404 on `/catalog/products/{slug}` | "Product not found" component rendered, no unhandled error |
| AC-FE-CATALOG-U-05 | Pagination never exceeds the maximum page_size | Attempt to set page_size > 100 | Request is capped at 100 |

### E2E Tests

| ID | Scenario | Input | Expected |
|---|---|---|---|
| AC-FE-CATALOG-E-01 | Full navigation: home → filter by category → product detail | User clicks a category and then a product | URL and content reflect the navigation; going back restores the previous filters |
| AC-FE-CATALOG-E-02 | SSR delivers HTML with products without waiting for hydration | Direct `curl`/fetch to the `/` route (without running JS) | Returned HTML already contains the product names (not empty) |
| AC-FE-CATALOG-E-03 | Pagination keeps active filters when moving to the next page | User filters by category and advances to page 2 | Page 2 returns products from the same filtered category |

## Dependencies

- `SPEC-FE-00-foundation.md` (PaginationComponent, mobile-first
  responsive strategy, SSR).
- Backend: `docs/specs/catalog/SPEC-catalog.md`.
