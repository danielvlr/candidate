import { test, expect, Page, Route } from '@playwright/test';

type JobDTO = {
  id: number;
  title: string;
  description: string;
  companyName: string;
  location: string;
  jobType: 'FULL_TIME';
  workMode: 'REMOTE';
  experienceLevel: 'MID';
  status: 'ACTIVE' | 'WARRANTY' | 'PAUSED' | 'CLOSED' | 'EXPIRED' | 'DRAFT';
  featured: boolean;
  urgent: boolean;
  guaranteeDays?: number;
  closedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

const isoDaysAgo = (days: number): string =>
  new Date(Date.now() - days * 86_400_000).toISOString();

const baseJob = (
  id: number,
  title: string,
  status: JobDTO['status'],
  overrides: Partial<JobDTO> = {},
): JobDTO => ({
  id,
  title,
  description: `Descrição da vaga ${id}`,
  companyName: `Empresa ${id}`,
  location: 'Remote',
  jobType: 'FULL_TIME',
  workMode: 'REMOTE',
  experienceLevel: 'MID',
  status,
  featured: false,
  urgent: false,
  guaranteeDays: 90,
  createdAt: isoDaysAgo(120),
  ...overrides,
});

const FIXTURES: JobDTO[] = [
  baseJob(1001, 'Vaga ATIVA sanity', 'ACTIVE'),
  baseJob(1002, 'Fechada fresca 60d', 'CLOSED', {
    closedAt: isoDaysAgo(30),
    guaranteeDays: 90,
  }),
  baseJob(1003, 'Fechada urgente 10d', 'CLOSED', {
    closedAt: isoDaysAgo(80),
    guaranteeDays: 90,
  }),
  baseJob(1004, 'Fechada EXPIRADA', 'CLOSED', {
    closedAt: isoDaysAgo(100),
    guaranteeDays: 90,
  }),
  baseJob(1005, 'Fechada quase vencida 5d', 'CLOSED', {
    closedAt: isoDaysAgo(85),
    guaranteeDays: 90,
  }),
  {
    id: 1006,
    title: 'Fechada sem closedAt',
    description: 'Descrição da vaga 1006',
    companyName: 'Empresa 1006',
    location: 'Remote',
    jobType: 'FULL_TIME',
    workMode: 'REMOTE',
    experienceLevel: 'MID',
    status: 'CLOSED',
    featured: false,
    urgent: false,
    guaranteeDays: 60,
    closedAt: null,
  },
  baseJob(1007, 'Status EXPIRED backend', 'EXPIRED', {
    closedAt: isoDaysAgo(150),
    guaranteeDays: 90,
  }),
];

const buildPageResponse = (content: JobDTO[]) => ({
  content,
  totalElements: content.length,
  totalPages: 1,
  size: content.length,
  number: 0,
  first: true,
  last: true,
  numberOfElements: content.length,
  empty: content.length === 0,
});

async function setupRoutes(page: Page) {
  await page.route('**/api/**', async (route: Route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;

    if (/\/api\/v1\/jobs\/\d+$/.test(path)) {
      const id = Number(path.split('/').pop());
      const job = FIXTURES.find(j => j.id === id);
      await route.fulfill({
        status: job ? 200 : 404,
        contentType: 'application/json',
        body: JSON.stringify(job ?? { error: 'not found' }),
      });
      return;
    }

    if (
      path.endsWith('/api/v1/jobs') ||
      path.endsWith('/api/v1/jobs/filter') ||
      path.endsWith('/api/v1/jobs/search')
    ) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(buildPageResponse(FIXTURES)),
      });
      return;
    }

    if (path.startsWith('/api/v1/job-history')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(Array.isArray([]) ? [] : {}),
    });
  });
}

const closedColumnLocator = (page: Page) =>
  page.locator('div.flex-shrink-0').filter({ has: page.locator('text=Fechada') }).first();

test.describe('/jobs CLOSED column — filter expired + sort by guarantee', () => {
  test.beforeEach(async ({ page }) => {
    await setupRoutes(page);
    await page.goto('/jobs', { waitUntil: 'domcontentloaded' });
    await page.waitForResponse(/\/api\/v1\/jobs(\/filter|\/search)?\?/);
    await closedColumnLocator(page).waitFor({ state: 'visible', timeout: 10_000 });
  });

  test('AC1+AC3: CLOSED renders non-expired only, ASC by remaining', async ({ page }) => {
    const column = closedColumnLocator(page);

    await expect(column).toContainText('Fechada quase vencida 5d');
    await expect(column).toContainText('Fechada urgente 10d');
    await expect(column).toContainText('Fechada fresca 60d');
    await expect(column).toContainText('Fechada sem closedAt');

    const visibleCards = column.locator('div.bg-white.rounded-lg.p-3, div.dark\\:bg-gray-800.rounded-lg.p-3');
    const titles = await visibleCards.locator('p.text-sm.font-medium').allInnerTexts();
    const closedTitles = titles.filter(t =>
      ['Fechada quase vencida 5d', 'Fechada urgente 10d', 'Fechada fresca 60d', 'Fechada sem closedAt'].includes(t.trim()),
    );
    expect(closedTitles.length).toBeGreaterThanOrEqual(4);
    expect(closedTitles[0].trim()).toBe('Fechada quase vencida 5d');
    expect(closedTitles[1].trim()).toBe('Fechada urgente 10d');
  });

  test('AC1: expired (remaining<=0) is NOT rendered as a primary card', async ({ page }) => {
    const column = closedColumnLocator(page);
    const expiredAsPrimary = column
      .locator('div.bg-white.rounded-lg.p-3')
      .filter({ hasText: 'Fechada EXPIRADA' });
    await expect(expiredAsPrimary).toHaveCount(0);
  });

  test('AC2: backend status=EXPIRED is excluded from all columns', async ({ page }) => {
    await expect(page.locator('text=Status EXPIRED backend')).toHaveCount(0);
  });

  test('AC8: expired footer toggles', async ({ page }) => {
    const column = closedColumnLocator(page);
    const footerBtn = column.getByRole('button', { name: /vaga.*com garantia vencida/i });
    await expect(footerBtn).toBeVisible();
    await expect(footerBtn).toContainText('1 vaga');

    await footerBtn.click();
    await expect(column).toContainText('Fechada EXPIRADA');
    await expect(column).toContainText(/Expirada h[áa] \d+ dia/);

    const hideBtn = column.getByRole('button', { name: /ocultar expiradas/i });
    await hideBtn.click();
    await expect(column).not.toContainText('Fechada EXPIRADA');
  });

  test('AC8: clicking expired card navigates to /jobs/:id', async ({ page }) => {
    const column = closedColumnLocator(page);
    await column.getByRole('button', { name: /vaga.*com garantia vencida/i }).click();
    await column.getByText('Fechada EXPIRADA').click();
    await expect(page).toHaveURL(/\/jobs\/1004/);
  });

  test('AC1 (list view): expired is also excluded from list rows', async ({ page }) => {
    await page.locator('button[title="Lista"]').click();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=Fechada EXPIRADA')).toHaveCount(0);
    await expect(page.locator('text=Status EXPIRED backend')).toHaveCount(0);
    await expect(page.locator('text=Fechada quase vencida 5d')).toBeVisible();
  });

  test('AC7: CLOSED with closedAt=null renders (treated as full guarantee)', async ({ page }) => {
    const column = closedColumnLocator(page);
    await expect(column).toContainText('Fechada sem closedAt');
  });

  test('AC6: ACTIVE column unchanged', async ({ page }) => {
    const activeColumn = page.locator('div.flex-shrink-0').filter({ has: page.locator('text=Ativa') }).first();
    await expect(activeColumn).toContainText('Vaga ATIVA sanity');
  });
});
