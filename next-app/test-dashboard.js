const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/dashboard');
  
  // Fill in the map code
  await page.fill('input[name="mapCode"]', '6155-1398-4059');
  
  // Click the fetch button
  await page.click('button[type="submit"]:not([disabled])');
  
  // Wait for data to load
  await page.waitForTimeout(5000);
  
  // Take a screenshot
  await page.screenshot({ path: 'dashboard-with-data.png', fullPage: true });
  
  await browser.close();
})(); 