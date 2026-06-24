import { expect, test } from '@playwright/test';

const API_BASE_URL = 'http://localhost:8080';
const REFRESH_TOKEN_KEY = 'ecommerce_refresh_token';

async function registerAndLogin(
  request: import('@playwright/test').APIRequestContext,
  email: string,
): Promise<{ refreshToken: string }> {
  await request.post(`${API_BASE_URL}/api/v1/auth/register`, {
    data: { email, password: 'Password@123', first_name: 'Test', last_name: 'User' },
  });
  const loginResponse = await request.post(`${API_BASE_URL}/api/v1/auth/login`, {
    data: { email, password: 'Password@123' },
  });
  const body = await loginResponse.json();
  return { refreshToken: body.refresh_token };
}

test('AC-FE-FOUNDATION-E-01: page reload keeps the session via the refresh token', async ({
  page,
  request,
}) => {
  const email = `e2e-${Date.now()}@test.com`;
  const { refreshToken } = await registerAndLogin(request, email);

  await page.goto('/');
  await page.evaluate(
    ([key, value]) => localStorage.setItem(key, value),
    [REFRESH_TOKEN_KEY, refreshToken],
  );

  await page.goto('/account');
  await expect(page).toHaveURL(/\/account$/);

  await page.reload();
  await expect(page).toHaveURL(/\/account$/);
});

test('AC-FE-FOUNDATION-E-02: access to /admin/** without permission is blocked', async ({
  page,
  request,
}) => {
  const email = `e2e-customer-${Date.now()}@test.com`;
  const { refreshToken } = await registerAndLogin(request, email);

  await page.goto('/');
  await page.evaluate(
    ([key, value]) => localStorage.setItem(key, value),
    [REFRESH_TOKEN_KEY, refreshToken],
  );

  await page.goto('/admin/products');
  await expect(page).not.toHaveURL(/\/admin\/products$/);
  await expect(page.getByText('Admin · Products')).toHaveCount(0);
});

test('AC-FE-FOUNDATION-E-03: rate limit shows a message with the wait time', async ({ page, request }) => {
  // /cart now requires authGuard (SPEC-FE-cart), so the foundation interceptor
  // behavior must be exercised as a logged-in user.
  const email = `e2e-ratelimit-${Date.now()}@test.com`;
  const { refreshToken } = await registerAndLogin(request, email);

  await page.goto('/');
  await page.evaluate(
    ([key, value]) => localStorage.setItem(key, value),
    [REFRESH_TOKEN_KEY, refreshToken],
  );

  await page.route(`${API_BASE_URL}/api/v1/cart`, (route) =>
    route.fulfill({
      status: 429,
      headers: {
        'Retry-After': '30',
        'Access-Control-Allow-Origin': 'http://localhost:4200',
        'Access-Control-Expose-Headers': 'Retry-After',
      },
      contentType: 'application/json',
      body: JSON.stringify({ title: 'Too Many Requests', status: 429 }),
    }),
  );

  await page.goto('/cart');
  await expect(page.getByRole('alert')).toContainText('30s');
});
