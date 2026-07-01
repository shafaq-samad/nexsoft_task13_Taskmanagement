import { expect, test } from '@playwright/test';

test('login, create task, move task, and delete task', async ({ page }) => {
  const uniqueTitle = `E2E task ${Date.now()}`;

  await page.goto('/');

  await page.getByRole('button', { name: 'Sarah Connor' }).click();

  await expect(page.getByRole('button', { name: 'Create Task' })).toBeVisible();

  await page.getByRole('button', { name: 'Create Task' }).click();
  await page.getByLabel('Task Title').fill(uniqueTitle);
  await page.getByLabel('Description').fill('End to end coverage');
  await page.getByRole('button', { name: 'Save' }).click();

  const createdCard = page.locator('button', { hasText: uniqueTitle }).first();
  await expect(createdCard).toBeVisible();

  await createdCard.click();
  const modal = page.locator('#task-modal');
  await expect(modal).toBeVisible();
  await expect(modal.getByLabel('Status State')).toBeVisible();
  await modal.getByLabel('Status State').selectOption('In Progress');
  await Promise.all([
    page.waitForResponse((response) => response.url().includes('/api/tasks') && response.status() === 200),
    modal.getByRole('button', { name: 'Save' }).click(),
  ]);

  const inProgressCard = page.locator('#column-in-progress').locator('button', { hasText: uniqueTitle }).first();
  await expect(inProgressCard).toBeVisible();

  await inProgressCard.click();
  await expect(modal).toBeVisible();
  const deleteButton = modal.getByRole('button', { name: /Delete \(Admin\)/ }).first();
  await expect(deleteButton).toBeVisible();
  page.once('dialog', (dialog) => dialog.accept());
  await deleteButton.click();

  await expect(page.locator('button', { hasText: uniqueTitle })).toHaveCount(0);
});
