import { test, expect } from '@playwright/test';
import { setRole, waitForPageLoad, getMainForm } from './helpers';

test.describe('Page Navigation - All routes render without errors', () => {
  test('Dashboard loads without errors', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
    await expect(page.locator('body')).not.toContainText('Cannot read properties');
    await expect(page.locator('body')).not.toContainText('Something went wrong');
  });

  test('Candidates list renders with data', async ({ page }) => {
    await page.goto('/candidates');
    await waitForPageLoad(page);
    await expect(page.locator('body')).toContainText('Candidatos');
    await page.waitForTimeout(2000);
    const hasContent = await page.locator('[class*="cursor-pointer"]').count();
    const hasEmpty = await page.getByText('Nenhum candidato').count();
    expect(hasContent + hasEmpty).toBeGreaterThan(0);
  });

  test('Jobs list renders with data', async ({ page }) => {
    await page.goto('/jobs');
    await waitForPageLoad(page);
    await expect(page.locator('body')).toContainText('Vagas');
    await page.waitForTimeout(2000);
    const hasContent = await page.locator('[class*="cursor-pointer"]').count();
    const hasEmpty = await page.getByText('Nenhuma vaga').count();
    expect(hasContent + hasEmpty).toBeGreaterThan(0);
  });

  test('Clients list renders with data', async ({ page }) => {
    await page.goto('/clients');
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);
    const hasContent = await page.locator('[class*="cursor-pointer"]').count();
    const hasEmpty = await page.getByText('Nenhum cliente').count();
    expect(hasContent + hasEmpty).toBeGreaterThan(0);
  });

  test('Assessorados list renders with data', async ({ page }) => {
    await page.goto('/assessorados');
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);
    const hasContent = await page.locator('[class*="cursor-pointer"]').count();
    const hasKanban = await page.locator('[class*="rounded-xl border-2"]').count();
    const hasEmpty = await page.getByText('Nenhum assessorado').count();
    expect(hasContent + hasKanban + hasEmpty).toBeGreaterThan(0);
  });

  test('Headhunters list renders with data', async ({ page }) => {
    await page.goto('/headhunters');
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);
    const hasContent = await page.locator('[class*="cursor-pointer"]').count();
    const hasEmpty = await page.getByText('Nenhum headhunter').count();
    expect(hasContent + hasEmpty).toBeGreaterThan(0);
  });

  test('Candidate create form loads', async ({ page }) => {
    await page.goto('/candidates/new');
    await waitForPageLoad(page);
    await expect(getMainForm(page)).toBeVisible();
    await expect(page.locator('input[name="fullName"]')).toBeVisible();
  });

  test('Client create form loads', async ({ page }) => {
    await page.goto('/clients/new');
    await waitForPageLoad(page);
    await expect(getMainForm(page)).toBeVisible();
  });

  test('Candidate edit form loads with data', async ({ page }) => {
    await page.goto('/candidates/1/edit');
    await waitForPageLoad(page);
    await page.waitForTimeout(3000);
    await expect(getMainForm(page)).toBeVisible();
    const nameInput = page.locator('input[name="fullName"]');
    await expect(nameInput).toBeVisible();
    const value = await nameInput.inputValue();
    expect(value.length).toBeGreaterThan(0);
  });

  test('Job detail view loads', async ({ page }) => {
    await page.goto('/jobs/1');
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).not.toContainText('Cannot read properties');
  });

  test('Client detail view loads', async ({ page }) => {
    await page.goto('/clients/1');
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).not.toContainText('Cannot read properties');
  });

  test('Assessorado detail view loads', async ({ page }) => {
    await page.goto('/assessorados/1');
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).not.toContainText('Cannot read properties');
  });
});

test.describe('Dashboard by Role', () => {
  test('Senior dashboard shows assessorados', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
    await page.waitForTimeout(500);
    // Switch to senior role via DEV switcher
    await setRole(page, 'senior');
    await page.waitForTimeout(1000);
    await expect(page.locator('body')).toContainText('Dashboard do Senior');
  });

  test('Headhunter dashboard loads', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
    await page.waitForTimeout(500);
    await setRole(page, 'headhunter');
    await page.waitForTimeout(1000);
    await expect(page.locator('body')).toContainText('Dashboard');
  });
});
