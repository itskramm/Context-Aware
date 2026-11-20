import { test, expect } from '@playwright/test';

test.describe('Digest View', () => {
  test('should display digest results', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('ValidPass123!');
    await page.getByRole('button', { name: /login/i }).click();
    await page.goto('/digests');
    await expect(page.getByText(/digests/i)).toBeVisible();
  });
});
