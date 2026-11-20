import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('ValidPass123!');
    await page.getByRole('button', { name: /login/i }).click();
    await expect(page).toHaveURL('/dashboard');
  });

  test('should display dashboard with stats', async ({ page }) => {
    await expect(page.getByText(/total lectures/i)).toBeVisible();
    await expect(page.getByText(/total digests/i)).toBeVisible();
  });

  test('should navigate to upload page', async ({ page }) => {
    await page.getByRole('button', { name: /upload lecture/i }).click();
    await expect(page).toHaveURL('/upload');
  });
});
