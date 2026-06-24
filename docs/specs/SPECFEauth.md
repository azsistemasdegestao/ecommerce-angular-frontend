# SPEC-FE-auth — Authentication

## Overview

Screens and flows for registration, login, password recovery, and user
account. Consumes the public `/auth/**` endpoints of the API. Session
foundations (token storage, interceptor, guards) live in
`SPEC-FE-00-foundation.md`.

## Routes / Screens

| Route | Screen | Auth | Responsive |
|---|---|---|---|
| `/login` | Login | Public | Mobile-first |
| `/register` | Register | Public | Mobile-first |
| `/forgot-password` | Forgot password | Public | Mobile-first |
| `/reset-password` | Reset password (token via query param) | Public | Mobile-first |
| `/account` | Account details (profile, change password) | `authGuard` | Mobile-first |

## Components

- `LoginFormComponent` — email/password fields, links to register and
  "forgot password", shows a generic invalid-credentials error.
- `RegisterFormComponent` — name, email, password, confirm password
  fields.
- `ForgotPasswordFormComponent` — email field, always shows a success
  message (without confirming whether the email exists).
- `ResetPasswordFormComponent` — reads the token from the query string,
  new password/confirmation fields.
- `AccountPageComponent` — shows user data, logout action.

## State

- All session state lives in `AuthService` (`SPEC-FE-00-foundation.md`).
- Each form has ephemeral local state (component-owned signals):
  `isSubmitting`, `errorMessage` — no dedicated service needed.

## User flows

1. **Register**: user fills the form → `POST /auth/register` → on success
   (201), redirects to `/login` with the message "account created, please
   log in"; on 409 (email already exists), shows an error on the email
   field.
2. **Login**: user fills email/password → `POST /auth/login` → success
   (200) stores `access_token` in memory and `refresh_token` in
   `localStorage` via `AuthService`, redirects to `returnUrl` (if present)
   or to `/`.
3. **Forgot password**: user provides an email → `POST
   /auth/forgot-password` → always shows "if the email exists, you'll
   receive instructions" (200), regardless of whether the email exists.
4. **Reset password**: user arrives via an email link with a token in the
   URL → fills in the new password → `POST /auth/reset-password` →
   success redirects to `/login`; an invalid/expired token shows an error
   and a link to request a new one.
5. **Logout**: from `/account` or a header button → calls
   `AuthService.logout()` → redirects to `/`.

## API integration

| Endpoint | Usage on screen |
|---|---|
| `POST /auth/register` | Registration screen |
| `POST /auth/login` | Login screen |
| `POST /auth/refresh` | Silent, via interceptor/bootstrap (no dedicated UI) |
| `POST /auth/logout` | Logout button on `/account` and in the header |
| `POST /auth/forgot-password` | Forgot password screen |
| `POST /auth/reset-password` | Reset password screen |

## Loading / error / empty states

- All forms disable the submit button and show an inline spinner
  (`ButtonComponent` with `loading`) during the request.
- **401 on login**: generic message "invalid email or password" — never
  differentiate "user not found" from "wrong password" (BR-FE-AUTH-001).
- **423/429 (lockout / rate limit) on login**: message "too many attempts,
  try again in a few minutes", without exposing the exact number of
  remaining attempts.
- **429 on register/forgot-password/reset-password**: uses the
  interceptor's `Retry-After` (foundation) to display the wait time.
- Validation fields (e.g. short password, invalid email) are validated
  client-side before submit, mirroring the backend's Business Rules, but
  the server error always takes priority if it diverges.

## Business Rules

- **BR-FE-AUTH-001**: never show different messages for "user not found"
  vs "incorrect password" — always the same generic login error message
  (prevents user enumeration, mirrors the backend rule).
- **BR-FE-AUTH-002**: the "forgot password" screen always shows the same
  success message, regardless of whether the email exists in the
  database.
- **BR-FE-AUTH-003**: after a successful `POST /auth/login` or `POST
  /auth/refresh`, the previous `refresh_token` in `localStorage` is
  always replaced by the new one (never accumulate old tokens).
- **BR-FE-AUTH-004**: on logout, the client clears local state even if the
  `POST /auth/logout` call fails (timeout, network, etc.) — logout is a
  guaranteed local action.

## Validation Criteria

### Unit Tests

| ID | Scenario | Input | Expected |
|---|---|---|---|
| AC-FE-AUTH-U-01 | Login with invalid credentials shows a generic message | API returns 401 | Message "invalid email or password" shown, without detailing which field is wrong |
| AC-FE-AUTH-U-02 | Successful login updates session state | API returns 200 with tokens | `AuthService.isAuthenticated()` becomes `true` |
| AC-FE-AUTH-U-03 | Registration with duplicate email shows a field error | API returns 409 | Inline error attached to the email field |
| AC-FE-AUTH-U-04 | Forgot password always shows a success message | API returns 200 (with or without an existing email) | Same success message in both cases |
| AC-FE-AUTH-U-05 | Reset password with an invalid token shows an error | API returns 400/422 | Error message + link to request a new token |
| AC-FE-AUTH-U-06 | Logout clears the session even on a network failure | Call to `/auth/logout` rejects (timeout) | `AuthService.currentUser()` becomes `null` and the refresh token is removed |
| AC-FE-AUTH-U-07 | Client-side validation blocks submit with an empty password | Login form with a blank password | Submit does not trigger an API call; required-field error shown |

### E2E Tests

| ID | Scenario | Input | Expected |
|---|---|---|---|
| AC-FE-AUTH-E-01 | Full flow: register → login → access account | New user registers and logs in | Lands on `/account` authenticated |
| AC-FE-AUTH-E-02 | Lockout after multiple failed attempts | 5 login attempts with the wrong password | Temporary lockout message shown on the 6th attempt |
| AC-FE-AUTH-E-03 | Accessing `/account` without login redirects to `/login` | Unauthenticated user navigates to `/account` | Redirected with `returnUrl=/account`, and after login is taken back to `/account` |

## Dependencies

- `SPEC-FE-00-foundation.md` (AuthService, interceptor, guards, shared
  components).
- Backend: `docs/specs/auth/SPEC-auth.md`.
