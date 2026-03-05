import { test, expect } from '@playwright/test';

test('has title and page loads', async ({ page }) => {
    // Visit the locally running frontend URL
    await page.goto('/');

    // You can adjust this to whatever text or element you expect on the home page.
    // For instance, let's just make sure the page doesn't return an error.
    const title = await page.title();
    console.log(`Page title: ${title}`);

    // We expect something on the page, like a button or header.
    // Example: 
    // await expect(page.locator('text=Login')).toBeVisible();
});
