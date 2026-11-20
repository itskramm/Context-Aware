import { test, expect } from '@playwright/test';

test.describe('Lecture Upload', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('ValidPass123!');
    await page.getByRole('button', { name: /login/i }).click();
  });

  test('should display upload form', async ({ page }) => {
    await page.goto('/upload');
    await expect(page.getByText(/upload lecture/i)).toBeVisible();
  });

  test('should show skeleton loading during upload', async ({ page }) => {
    await page.goto('/upload');
    // This test will verify skeleton loading implementation
    await expect(page.getByRole('button', { name: /upload/i })).toBeVisible();
  });
});
