import { test, expect } from '@playwright/test';
import { setRole, waitForPageLoad } from './helpers';

test.describe('Kanban Board', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
    await setRole(page, 'admin');
  });

  test('Assessorados page has view toggle', async ({ page }) => {
    await page.goto('/assessorados');
    await waitForPageLoad(page);
    await page.waitForTimeout(1000);

    // Should have toggle buttons for List and Kanban
    const listBtn = page.getByRole('button', { name: /lista/i });
    const kanbanBtn = page.getByRole('button', { name: /kanban/i });

    const hasListBtn = await listBtn.count();
    const hasKanbanBtn = await kanbanBtn.count();
    expect(hasListBtn + hasKanbanBtn).toBeGreaterThan(0);
  });

  test('Kanban view shows 6 columns', async ({ page }) => {
    await page.goto('/assessorados');
    await waitForPageLoad(page);
    await page.waitForTimeout(1000);

    // Click Kanban toggle if available
    const kanbanBtn = page.getByRole('button', { name: /kanban/i });
    if (await kanbanBtn.count() > 0) {
      await kanbanBtn.click();
      await page.waitForTimeout(500);
    }

    // Check for phase column headers
    const phases = ['Onboarding', 'Busca Ativa', 'Prep. Entrevista', 'Negociação', 'Colocado', 'Concluído'];
    for (const phase of phases) {
      const column = page.getByText(phase, { exact: false });
      await expect(column.first()).toBeVisible();
    }
  });

  test('Kanban columns fill width without horizontal scroll', async ({ page }) => {
    await page.goto('/assessorados');
    await waitForPageLoad(page);
    await page.waitForTimeout(1000);

    const kanbanBtn = page.getByRole('button', { name: /kanban/i });
    if (await kanbanBtn.count() > 0) {
      await kanbanBtn.click();
      await page.waitForTimeout(500);
    }

    // Check no horizontal scrollbar on the kanban container
    const hasHScroll = await page.evaluate(() => {
      const body = document.documentElement;
      return body.scrollWidth > body.clientWidth;
    });
    expect(hasHScroll).toBeFalsy();
  });
});
