import { expect, test } from '@playwright/test';

const API_BASE_URL = 'http://localhost:8080';
const REFRESH_TOKEN_KEY = 'ecommerce_refresh_token';

async function loginAsNewUser(
  page: import('@playwright/test').Page,
  request: import('@playwright/test').APIRequestContext,
): Promise<void> {
  const email = `e2e-cart-${Date.now()}-${Math.random().toString(36).slice(2)}@test.com`;
  await request.post(`${API_BASE_URL}/api/v1/auth/register`, {
    data: { email, password: 'Password@123', first_name: 'Test', last_name: 'User' },
  });
  const loginResponse = await request.post(`${API_BASE_URL}/api/v1/auth/login`, {
    data: { email, password: 'Password@123' },
  });
  const { refresh_token } = await loginResponse.json();

  await page.goto('/');
  await page.evaluate(
    ([key, value]) => localStorage.setItem(key, value),
    [REFRESH_TOKEN_KEY, refresh_token],
  );
}

async function firstInStockProductSlug(
  request: import('@playwright/test').APIRequestContext,
): Promise<string> {
  const resp = await request.get(`${API_BASE_URL}/api/v1/catalog/products?in_stock=true&page_size=1`);
  const { items } = await resp.json();
  return items[0].slug;
}

test('AC-FE-CART-E-01: add product, see it in the drawer, edit quantity, remove', async ({
  page,
  request,
}) => {
  await loginAsNewUser(page, request);
  const slug = await firstInStockProductSlug(request);

  await page.goto(`/products/${slug}`);
  // Product detail is SSR'd; wait for hydration's app initializer (which
  // sets the in-memory access token via /auth/refresh) before interacting,
  // otherwise the click can race ahead and fire with no Authorization header.
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: 'Add to cart' }).click();

  await page.getByRole('button', { name: /^Cart \(1\)$/ }).click();
  const drawer = page.locator('aside');
  await expect(drawer).toBeVisible();
  await expect(drawer.getByText('× 1')).toBeVisible();
  await drawer.getByRole('button', { name: 'Close' }).click();

  await page.goto('/cart');
  const quantityLabel = page.locator('span').filter({ hasText: /^1$/ }).first();
  await expect(quantityLabel).toBeVisible();

  await page.getByRole('button', { name: '+' }).click();
  await expect(page.locator('span').filter({ hasText: /^2$/ }).first()).toBeVisible();

  await page.getByRole('button', { name: 'Remove' }).click();
  await expect(page.getByText('Your cart is empty.')).toBeVisible();
});

test('AC-FE-CART-E-02: adding the same product twice increments quantity instead of duplicating', async ({
  page,
  request,
}) => {
  await loginAsNewUser(page, request);
  const slug = await firstInStockProductSlug(request);

  await page.goto(`/products/${slug}`);
  // See comment in the previous test: wait for hydration before interacting.
  await page.waitForLoadState('networkidle');
  // Wait for the cart badge to reflect the first add before clicking again -
  // avoids racing Angular's hydration/event-replay on a freshly loaded page.
  await page.getByRole('button', { name: 'Add to cart' }).click();
  await expect(page.getByRole('button', { name: /^Cart \(1\)$/ })).toBeVisible();
  await page.getByRole('button', { name: 'Add to cart' }).click();
  await expect(page.getByRole('button', { name: /^Cart \(2\)$/ })).toBeVisible();

  await page.goto('/cart');
  await expect(page.locator('span').filter({ hasText: /^2$/ }).first()).toBeVisible();

  const itemRowCount = await page.locator('img[alt]').count();
  expect(itemRowCount).toBe(1);
});
