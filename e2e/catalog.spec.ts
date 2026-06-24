import { expect, test } from '@playwright/test';

const API_BASE_URL = 'http://localhost:8080';

test('AC-FE-CATALOG-E-01: full navigation home -> category -> product detail -> back', async ({
  page,
  request,
}) => {
  const categoriesResp = await request.get(`${API_BASE_URL}/api/v1/catalog/categories`);
  const categories = await categoriesResp.json();
  const category = categories.find((c: { product_count: number }) => c.product_count > 0);
  expect(category).toBeTruthy();

  await page.goto('/');
  await page.getByRole('link', { name: category.name }).click();
  await expect(page).toHaveURL(new RegExp(`/categories/${category.slug}$`));

  const firstProductLink = page.locator('a[href^="/products/"]').first();
  await expect(firstProductLink).toBeVisible();
  const productName = await firstProductLink.locator('h3').textContent();
  await firstProductLink.click();

  await expect(page).toHaveURL(/\/products\//);
  await expect(page.getByRole('heading', { name: productName ?? '' })).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(new RegExp(`/categories/${category.slug}$`));
});

test('AC-FE-CATALOG-E-02: SSR delivers HTML with products without running JS', async ({ request }) => {
  const productsResp = await request.get(`${API_BASE_URL}/api/v1/catalog/products?page_size=1`);
  const { items } = await productsResp.json();
  expect(items.length).toBeGreaterThan(0);
  const knownProduct = items[0];

  const ssrResponse = await request.get(`/?search=${encodeURIComponent(knownProduct.name)}`);
  const html = await ssrResponse.text();
  expect(html).toContain(knownProduct.name);
});

test('AC-FE-CATALOG-E-03: pagination keeps the active category filter on the next page', async ({
  page,
  request,
}) => {
  const categoriesResp = await request.get(`${API_BASE_URL}/api/v1/catalog/categories`);
  const categories = await categoriesResp.json();
  const category = categories.find((c: { product_count: number }) => c.product_count >= 2);
  expect(category).toBeTruthy();

  await page.goto(`/categories/${category.slug}?page_size=1&page_number=1`);
  const firstPageName = await page.locator('a[href^="/products/"] h3').first().textContent();

  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page).toHaveURL(new RegExp(`/categories/${category.slug}\\?.*page_number=2`));

  const secondPageName = await page.locator('a[href^="/products/"] h3').first().textContent();
  expect(secondPageName).not.toBe(firstPageName);
});
