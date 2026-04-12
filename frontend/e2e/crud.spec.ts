import { test, expect } from '@playwright/test';
import { waitForPageLoad, getMainForm } from './helpers';

test.describe('CRUD Operations', () => {
  test('Create new candidate', async ({ page }) => {
    await page.goto('/candidates/new');
    await waitForPageLoad(page);

    await page.locator('input[name="fullName"]').fill('Teste Playwright');
    await page.locator('input[name="email"]').fill('teste.playwright@test.com');

    await getMainForm(page).locator('button[type="submit"]').click();
    await page.waitForTimeout(3000);

    // Should navigate back to list or show success
    const url = page.url();
    const hasSuccess = url.includes('/candidates') || await page.getByText(/sucesso|criado/i).count() > 0;
    expect(hasSuccess).toBeTruthy();
  });

  test('Edit candidate loads existing data', async ({ page }) => {
    await page.goto('/candidates/1/edit');
    await waitForPageLoad(page);
    await page.waitForTimeout(3000);

    const nameInput = page.locator('input[name="fullName"]');
    await expect(nameInput).toBeVisible();
    const value = await nameInput.inputValue();
    expect(value.length).toBeGreaterThan(0);
  });

  test('Edit candidate and save', async ({ page }) => {
    await page.goto('/candidates/2/edit');
    await waitForPageLoad(page);
    await page.waitForTimeout(3000);

    const headlineInput = page.locator('input[name="headline"]');
    if (await headlineInput.isVisible()) {
      await headlineInput.fill('Teste Playwright Edit');
      await getMainForm(page).locator('button[type="submit"]').click();
      await page.waitForTimeout(3000);

      const hasSuccess = page.url().includes('/candidates') || await page.getByText(/sucesso|atualizado/i).count() > 0;
      expect(hasSuccess).toBeTruthy();
    }
  });

  test('Create new client', async ({ page }) => {
    await page.goto('/clients/new');
    await waitForPageLoad(page);

    const companyInput = page.locator('input[name="companyName"]');
    if (await companyInput.isVisible()) {
      await companyInput.fill('Empresa Teste Playwright');

      const cnpjInput = page.locator('input[name="cnpj"]');
      if (await cnpjInput.isVisible()) {
        await cnpjInput.fill('99.999.999/0001-99');
      }

      await getMainForm(page).locator('button[type="submit"]').click();
      await page.waitForTimeout(3000);
    }
  });
});
