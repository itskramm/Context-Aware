import { test, expect } from '@playwright/test';

test.describe('Digest Generation', () => {
  test('should display digest form', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('ValidPass123!');
    await page.getByRole('button', { name: /login/i }).click();
    await page.goto('/digest/new');
    await expect(page.getByText(/generate digest/i)).toBeVisible();
  });
});
