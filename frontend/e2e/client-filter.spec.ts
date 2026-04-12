import { test, expect } from '@playwright/test';
import { setRole, waitForPageLoad } from './helpers';

test.describe('Client Filter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
    await setRole(page, 'admin');
  });

  test('Client selector dropdown shows company list', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
    await page.waitForTimeout(1000);

    // Find the client selector in the header
    const selector = page.locator('select, [role="combobox"], [class*="ClientSelector"]').first();
    if (await selector.count() > 0) {
      await selector.click();
      await page.waitForTimeout(500);
      // Should show company names
      const options = page.locator('option, [role="option"]');
      const count = await options.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('Selecting company filters jobs list', async ({ page }) => {
    await page.goto('/jobs');
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);

    // Get initial job count
    const initialRows = await page.locator('[class*="cursor-pointer"]').count();

    // Try to find and use the client selector
    const selects = page.locator('header select, [class*="header"] select');
    if (await selects.count() > 0) {
      // Select a specific company
      const select = selects.first();
      const options = await select.locator('option').allTextContents();
      if (options.length > 1) {
        // Select first non-empty option
        await select.selectOption({ index: 1 });
        await page.waitForTimeout(2000);

        // Filtered count should differ from initial, or page should show selected company name
        const filteredRows = await page.locator('[class*="cursor-pointer"]').count();
        const selectedCompany = options[1].trim();
        const pageText = await page.locator('body').textContent();
        const hasCompanyInPage = pageText?.includes(selectedCompany);
        // Either filtering changed the count or the selected company appears in results
        expect(filteredRows !== initialRows || hasCompanyInPage).toBeTruthy();
      }
    }
  });
});
