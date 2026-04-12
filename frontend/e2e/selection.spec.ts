import { test, expect } from '@playwright/test';
import { waitForPageLoad } from './helpers';

test.describe('List Selection & Action Bar', () => {
  test('Click on candidate row selects it with ring highlight', async ({ page }) => {
    await page.goto('/candidates');
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);

    // List rows are inside divide-y container, have flex and px-6
    const rows = page.locator('.divide-y > div[class*="px-6"]');
    const count = await rows.count();
    if (count === 0) {
      test.skip();
      return;
    }

    // Click first row
    await rows.first().click();
    await page.waitForTimeout(300);

    // Check ring highlight
    const classes = await rows.first().getAttribute('class');
    expect(classes).toContain('ring-2');
  });

  test('Shift+click selects multiple items without text selection', async ({ page }) => {
    await page.goto('/candidates');
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);

    const rows = page.locator('.divide-y > div[class*="px-6"]');
    const count = await rows.count();
    if (count < 2) {
      test.skip();
      return;
    }

    // Click first row normally
    await rows.first().click();
    await page.waitForTimeout(200);

    // Shift+click second row
    await rows.nth(1).click({ modifiers: ['Shift'] });
    await page.waitForTimeout(200);

    // Both should have ring highlight
    const firstClasses = await rows.first().getAttribute('class');
    const secondClasses = await rows.nth(1).getAttribute('class');
    expect(firstClasses).toContain('ring-2');
    expect(secondClasses).toContain('ring-2');

    // No text should be selected
    const selection = await page.evaluate(() => window.getSelection()?.toString() || '');
    expect(selection).toBe('');
  });

  test('Action bar shows selection count', async ({ page }) => {
    await page.goto('/candidates');
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);

    const rows = page.locator('.divide-y > div[class*="px-6"]');
    const count = await rows.count();
    if (count < 2) {
      test.skip();
      return;
    }

    // Select first
    await rows.first().click();
    await page.waitForTimeout(200);

    // Shift+click second
    await rows.nth(1).click({ modifiers: ['Shift'] });
    await page.waitForTimeout(200);

    // Action bar should show "2 candidatos selecionados"
    await expect(page.locator('body')).toContainText('selecionad');
  });
});
