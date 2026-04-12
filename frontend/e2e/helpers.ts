import { Page } from '@playwright/test';

/** Switch role using the DEV role selector dropdown in the header */
export async function setRole(page: Page, role: 'admin' | 'senior' | 'headhunter') {
  const selector = page.locator('select').filter({ has: page.locator(`option[value="${role}"]`) });
  if (await selector.count() > 0) {
    await selector.selectOption(role);
    await page.waitForTimeout(500);
  }
}

/** Wait for page to fully load */
export async function waitForPageLoad(page: Page) {
  await page.waitForTimeout(500);
  await page.waitForLoadState('networkidle').catch(() => {});
}

/** Get the main content form (not the search/command form) */
export function getMainForm(page: Page) {
  return page.locator('form.space-y-6');
}
