import { test, expect } from '@playwright/test';

test.describe.serial('End-to-end user flows', () => {

    const timestamp = Date.now();
    const testUser = {
        username: `testuser_${timestamp}`,
        email: `testuser_${timestamp}@example.com`,
        password: 'password123',
        wallet: '0x1234567890123456789012345678901234567890'
    };

    test('Flow 1: User Registration and Login', async ({ page }) => {
        // -----------------------------------------
        // Registration
        // -----------------------------------------
        await page.goto('/register');

        // Fill out the registration form
        await page.locator('.form-group:has-text("Username") input').fill(testUser.username);
        await page.locator('.form-group:has-text("Email") input').fill(testUser.email);
        await page.locator('.form-group:has-text("Password") input').fill(testUser.password);
        await page.locator('.form-group:has-text("Wallet") input').fill(testUser.wallet);

        // Submit the form
        await page.click('button[type="submit"]');

        // Wait for the success message or redirection
        await expect(page.locator('text=Registered successfully! Redirecting to feed...')).toBeVisible();

        // The app redirects to the feed ("/") after 800ms
        await page.waitForURL('**/');

        // Check if the user is logged in (Avatar/Username should be visible in navbar)
        await page.reload();
        await expect(page.locator(`text=${testUser.username}`).first()).toBeVisible();

        // -----------------------------------------
        // Logout
        // -----------------------------------------
        // Open profile menu
        await page.click(`text=${testUser.username}`);

        // Click Logout
        await page.click('button:has-text("Logout")');

        // Make sure Login link is back
        await expect(page.locator('text=Login').first()).toBeVisible();

        // -----------------------------------------
        // Login
        // -----------------------------------------
        await page.goto('/login');

        await page.fill('input[type="text"]', testUser.email);
        await page.fill('input[type="password"]', testUser.password);
        await page.click('button[type="submit"]');

        // Wait for the success message
        await expect(page.locator('text=Login success! Redirecting to feed...')).toBeVisible();

        // Wait for redirect
        await page.waitForURL('**/');

        // Check if the user is logged in again
        await page.reload();
        await expect(page.locator(`text=${testUser.username}`).first()).toBeVisible();
    });


    test('Flow 2: Creating a Post', async ({ page }) => {
        // First, login
        await page.goto('/login');
        await page.fill('input[type="text"]', testUser.email);
        await page.fill('input[type="password"]', testUser.password);
        await page.click('button[type="submit"]');
        await page.waitForURL('**/');

        // Navigate to create post
        await page.click('text=Create Post');
        await page.waitForURL('**/create');

        const postTitle = `Test Post ${Date.now()}`;
        const postBody = 'This is a test post body created by Playwright automated testing. It needs to be relatively long so that the quality score might reflect something meaningful.';

        // Fill out the form
        await page.locator('.form-group:has-text("Title") input').fill(postTitle);
        await page.locator('.form-group:has-text("Body") textarea').fill(postBody);

        // Submit
        await page.click('button[type="submit"]');

        // Wait for success
        await expect(page.locator('text=Post created! Redirecting to feed...')).toBeVisible();

        // Wait for redirect to feed
        await page.waitForURL('**/');

        // Verify the post appears in the feed
        await expect(page.locator(`text=${postTitle}`).first()).toBeVisible();
    });


    test('Flow 3: General Navigation and Search', async ({ page }) => {
        await page.goto('/');

        // Go to Badges page
        await page.click('text=Badges');
        await page.waitForURL('**/badges');
        await expect(page.locator('.page-title').first()).toBeVisible();

        // Go to Chat page
        await page.click('text=Chat');
        await page.waitForURL('**/chat');

        // Use the global search
        await page.fill('input[placeholder="Search posts or users..."]', 'test');
        await page.keyboard.press('Enter');

        await page.waitForURL('**/search?q=test');
        await expect(page.locator('text=Search Results').first()).toBeVisible();

        // Toggle Light/Dark mode
        const initialThemeText = await page.locator('button[title^="Switch to"]').innerText();
        await page.click('button[title^="Switch to"]');
        const newThemeText = await page.locator('button[title^="Switch to"]').innerText();
        expect(initialThemeText).not.toEqual(newThemeText);
    });

});
