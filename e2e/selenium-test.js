const { Builder, By, until, Key } = require('selenium-webdriver');

async function runSeleniumTests() {
    let driver = await new Builder().forBrowser('chrome').build();
    try {
        console.log("Starting Selenium Test Suite...");

        const timestamp = Date.now();
        const testUser = `user_${timestamp}`;
        const email = `${testUser}@example.com`;
        const testPassword = "password123";

        // -------------------------------------------------------------
        // TEST FLOW 1: Registration and Login
        // -------------------------------------------------------------
        console.log("running Flow 1: Registration and Login...");
        await driver.get('http://localhost:5173/register');

        // Wait for page load
        await driver.wait(until.elementLocated(By.xpath('//label[text()="Username"]')), 5000);

        await driver.findElement(By.xpath('//label[text()="Username"]/following-sibling::input')).sendKeys(testUser);
        await driver.findElement(By.xpath('//label[text()="Email"]/following-sibling::input')).sendKeys(email);
        await driver.findElement(By.xpath('//label[text()="Password"]/following-sibling::input')).sendKeys(testPassword);
        await driver.findElement(By.xpath('//label[text()="Wallet address (Hardhat)"]/following-sibling::input')).sendKeys('0x123...999');
        await driver.findElement(By.css('button[type="submit"]')).click();

        // Wait for redirect to feed
        await driver.wait(until.urlIs('http://localhost:5173/'), 8000);

        // Logout
        console.log("  -> User Registered. Logging out...");
        await driver.navigate().refresh();
        await driver.wait(until.elementLocated(By.xpath(`//span[text()="${testUser}"]`)), 5000).click();
        await driver.findElement(By.xpath('//button[text()="Logout"]')).click();

        // Wait for Login link to appear
        await driver.wait(until.elementLocated(By.xpath('//span[contains(text(), "Login")]')), 5000);

        // Login again
        console.log("  -> Securely Logging back in...");
        await driver.get('http://localhost:5173/login');
        await driver.wait(until.elementLocated(By.xpath('//label[text()="Email or Username"]')), 5000);
        await driver.findElement(By.xpath('//label[text()="Email or Username"]/following-sibling::input')).sendKeys(email);
        await driver.findElement(By.xpath('//label[text()="Password"]/following-sibling::input')).sendKeys(testPassword);
        await driver.findElement(By.css('button[type="submit"]')).click();
        await driver.wait(until.urlIs('http://localhost:5173/'), 5000);

        console.log("✔️ Test 1 Passed: User Registration and Login");


        // -------------------------------------------------------------
        // TEST FLOW 2: Creating a Post
        // -------------------------------------------------------------
        console.log("\nrunning Flow 2: Creating a Post...");
        await driver.get('http://localhost:5173/create');
        await driver.wait(until.elementLocated(By.xpath('//label[text()="Title"]')), 5000);

        const postTitle = `Selenium Test Post ${timestamp}`;
        const postBody = 'This is a test post body created by Selenium WebDriver automated testing. It needs to be relatively long so that the ML quality score reflects something meaningful.';

        // Fill out the post form
        await driver.findElement(By.xpath('//label[text()="Title"]/following-sibling::input')).sendKeys(postTitle);
        await driver.findElement(By.xpath('//label[text()="Body"]/following-sibling::textarea')).sendKeys(postBody);

        // Submit Post
        await driver.findElement(By.css('button[type="submit"]')).click();

        // Wait for success message and redirect
        await driver.wait(until.elementLocated(By.xpath(`//*[contains(text(), "Post created!")]`)), 8000);
        await driver.wait(until.urlIs('http://localhost:5173/'), 8000);

        // Verify the newly created post appears in the live feed
        await driver.navigate().refresh();
        await driver.wait(until.elementLocated(By.xpath(`//*[contains(text(), "${postTitle}")]`)), 8000);

        console.log("✔️ Test 2 Passed: Post Creation Flow");


        // -------------------------------------------------------------
        // TEST FLOW 3: General Navigation
        // -------------------------------------------------------------
        console.log("\nrunning Flow 3: General Navigation and Theming...");
        await driver.get('http://localhost:5173/');

        // Validate Module Navigation
        await driver.findElement(By.xpath('//span[contains(text(), "Badges")]')).click();
        await driver.wait(until.urlContains('/badges'), 5000);

        await driver.findElement(By.xpath('//span[contains(text(), "Chat")]')).click();
        await driver.wait(until.urlContains('/chat'), 5000);

        // Test Global Search Implementation
        const searchInput = await driver.findElement(By.css('input[placeholder="Search posts or users..."]'));
        await searchInput.sendKeys('test', Key.RETURN);
        await driver.wait(until.urlContains('/search?q=test'), 5000);
        await driver.wait(until.elementLocated(By.xpath('//*[contains(text(), "Search Results")]')), 5000);

        // Test Light/Dark Mode Toggle
        const themeButton = await driver.findElement(By.css('button[title^="Switch to"]'));
        const initialTheme = await themeButton.getText();
        await themeButton.click();
        const newTheme = await themeButton.getText();

        if (initialTheme !== newTheme) {
            console.log("✔️ Test 3 Passed: General Navigation and Theme Searching");
        }

    } catch (err) {
        console.error("Test Failed!", err);
    } finally {
        await driver.quit();
        console.log("\nSelenium Tests Complete! Chrome driver closed.");
    }
}

runSeleniumTests();
