# SPEC-FE-admin-products — Admin: Products

## Overview

Product CRUD for Admin users, including image upload and soft-delete.
Consumes the write endpoints of `/catalog/products`, restricted to
`adminGuard`. Unlike the storefront, this area is designed
**desktop-first** (tables, dense forms).

## Routes / Screens

| Route | Screen | Auth | Responsive |
|---|---|---|---|
| `/admin/products` | Product listing (table with actions) | `adminGuard` | Desktop-first |
| `/admin/products/new` | Create product | `adminGuard` | Desktop-first |
| `/admin/products/:id/edit` | Edit product (includes image upload) | `adminGuard` | Desktop-first |

## Components

- `AdminProductTableComponent` — table with columns name, slug, price,
  stock, category, status (active/soft-deleted), actions (edit, delete).
- `ProductFormComponent` — form shared between create and edit (name,
  slug, price, stock, category, description).
- `ImageUploaderComponent` — file input with preview, client-side type
  (jpeg/png/webp) and size (max 5MB) validation before upload.
- Reuses `ModalComponent` (delete confirmation) and `PaginationComponent`
  from `SPEC-FE-00-foundation.md`.

## State

- `AdminProductService` with signals: `products` (paginated list),
  `currentProduct` (form being edited), `isSaving`, `isUploadingImage`.

## User flows

1. **List**: `/admin/products` → paginated table → edit and delete
   actions per row.
2. **Create**: `/admin/products/new` → fills in the form → `POST
   /catalog/products` → success (201) redirects to the listing with a
   success toast.
3. **Edit**: `/admin/products/:id/edit` → pre-filled form → `PUT
   /catalog/products/{id}` → success (200) goes back to the listing.
4. **Image upload**: on the edit screen, selects a file → client-side
   validation (type/size) → `POST /catalog/products/{id}/image`
   (multipart) → preview updated with the new `image_url`.
5. **Delete (soft-delete)**: delete button in the table → confirmation
   modal → `DELETE /catalog/products/{id}` → product disappears from the
   listing (but the record persists as soft-deleted on the backend).

## API integration

| Endpoint | Usage on screen |
|---|---|
| `POST /catalog/products` | Create product |
| `PUT /catalog/products/{id}` | Edit product |
| `DELETE /catalog/products/{id}` | Delete (soft-delete) |
| `POST /catalog/products/{id}/image` | Image upload |
| `GET /catalog/products` | Populates the table (same public listing, with no soft-deleted filter exposed to the API — the backend already hides them) |

## Loading / error / empty states

- **Empty**: no products registered → message + "create first product"
  button.
- **Validation error (400/422)** on the form: errors mapped per field
  from the `ProblemDetails` `errors`.
- **Invalid image upload** (wrong type or size): client-side validation
  blocks the submit before calling the API, with a specific message
  ("only JPEG, PNG, or WEBP, up to 5MB").
- **429 on upload**: respects `Retry-After` (limit of 5 req/min on this
  endpoint).

## Business Rules

- **BR-FE-ADMIN-PRODUCTS-001**: deleting a product always requires
  explicit confirmation via a modal — never delete directly on button
  click.
- **BR-FE-ADMIN-PRODUCTS-002**: image validation (type and size) happens
  client-side before upload, exactly mirroring the backend's
  restrictions (jpeg/png/webp, max 5MB), to avoid an unnecessary network
  trip for clearly invalid files.

## Validation Criteria

### Unit Tests

| ID | Scenario | Input | Expected |
|---|---|---|---|
| AC-FE-ADMINPRODUCTS-U-01 | Creating a product successfully redirects to the listing | `POST /catalog/products` returns 201 | Navigation to `/admin/products`, success toast |
| AC-FE-ADMINPRODUCTS-U-02 | Validation error maps errors per field | API returns 400 with `errors: { name: [...] }` | The "name" field shows the corresponding message |
| AC-FE-ADMINPRODUCTS-U-03 | Uploading an invalid file is blocked on the client | A `.gif` file is selected | Upload is not triggered; invalid-type message shown |
| AC-FE-ADMINPRODUCTS-U-04 | Uploading a file above 5MB is blocked on the client | An 8MB file is selected | Upload is not triggered; size-exceeded message shown |
| AC-FE-ADMINPRODUCTS-U-05 | Deleting a product requires confirmation | Click on the delete button | Confirmation modal shown before any API call |

### E2E Tests

| ID | Scenario | Input | Expected |
|---|---|---|---|
| AC-FE-ADMINPRODUCTS-E-01 | Full flow: create product → upload image → edit → delete | Sequence of admin actions | Product goes through all states correctly and disappears from the listing after deletion |
| AC-FE-ADMINPRODUCTS-E-02 | Customer user cannot access /admin/products | Customer navigates directly to the URL | Redirected, admin content is not shown |

## Dependencies

- `SPEC-FE-00-foundation.md` (adminGuard, ModalComponent,
  PaginationComponent, desktop-first strategy).
- Backend: `docs/specs/catalog/SPEC-catalog.md`, `docs/specs/admin/SPEC-admin.md`.
