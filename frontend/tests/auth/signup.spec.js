import { test, expect } from '@playwright/test';

test.describe('Signup Flow', () => {
  test('should display signup form', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.getByRole('heading', { name: /sign up/i })).toBeVisible();
  });

  test('should validate password requirements', async ({ page }) => {
    await page.goto('/signup');
    await page.getByLabel(/email/i).fill('newuser@example.com');
    await page.getByLabel(/^password/i).fill('weak');
    await expect(page.getByText(/password must/i)).toBeVisible();
  });
});
