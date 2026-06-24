import { expect, test } from '@playwright/test';

const API_BASE_URL = 'http://localhost:8080';

test('AC-FE-AUTH-E-01: full flow register -> login -> access account', async ({ page }) => {
  const email = `e2e-auth-${Date.now()}@test.com`;

  await page.goto('/register');
  await page.getByLabel('First name').fill('Test');
  await page.getByLabel('Last name').fill('User');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill('Password@123');
  await page.getByLabel('Confirm password').fill('Password@123');
  await page.getByRole('button', { name: 'Create account' }).click();

  await expect(page).toHaveURL(/\/login\?registered=1$/);

  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('Password@123');
  await page.getByRole('button', { name: 'Log in' }).click();

  // Login redirects via client-side navigation (no returnUrl -> '/'); wait
  // for that to land before doing a full reload to /account, otherwise the
  // reload can race ahead of the refresh_token being written to localStorage.
  await expect(page).toHaveURL(/\/$/);

  await page.goto('/account');
  await expect(page).toHaveURL(/\/account$/);
  await expect(page.getByText(email)).toBeVisible();
});

test('AC-FE-AUTH-E-03: accessing /account without login redirects to /login and back', async ({
  page,
  request,
}) => {
  const email = `e2e-returnurl-${Date.now()}@test.com`;
  await request.post(`${API_BASE_URL}/api/v1/auth/register`, {
    data: { email, password: 'Password@123', first_name: 'Test', last_name: 'User' },
  });

  await page.goto('/account');
  await expect(page).toHaveURL(/\/login\?returnUrl=%2Faccount$/);

  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('Password@123');
  await page.getByRole('button', { name: 'Log in' }).click();

  await expect(page).toHaveURL(/\/account$/);
});

// Runs last: deliberately exhausts the backend's per-IP auth rate limit,
// which would otherwise interfere with the other tests' own login calls.
test('AC-FE-AUTH-E-02: lockout after multiple failed attempts', async ({ page, request }) => {
  const email = `e2e-lockout-${Date.now()}@test.com`;
  await request.post(`${API_BASE_URL}/api/v1/auth/register`, {
    data: { email, password: 'Password@123', first_name: 'Test', last_name: 'User' },
  });

  // Scoped to the inline form error (a 429 also raises a global toast, which
  // shares role="alert").
  const formError = page.locator('p[role="alert"]');

  await page.goto('/login');
  for (let attempt = 1; attempt <= 6; attempt++) {
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill('WrongPassword@1');
    await page.getByRole('button', { name: 'Log in' }).click();
    await expect(formError).toBeVisible();
  }

  await expect(formError).toContainText('Too many attempts');
});
