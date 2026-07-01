import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', (msg) => console.log('PAGE', msg.type(), msg.text()));
  page.on('pageerror', (error) => console.log('PAGEERROR', error));
  page.on('request', (r) => {
    if (r.url().includes('/api/tasks')) console.log('REQ', r.method(), r.url());
  });
  page.on('response', (r) => {
    if (r.url().includes('/api/tasks')) console.log('RES', r.status(), r.url());
  });

  const uniqueTitle = `E2E task ${Date.now()}`;

  await page.goto('http://127.0.0.1:3000', { waitUntil: 'load', timeout: 30000 });
  console.log('initial button count', await page.locator('button').count());
  console.log('sarah withText count', await page.locator('button', { hasText: 'Sarah Connor' }).count());
  console.log('sarah locator texts', await page.locator('button', { hasText: 'Sarah Connor' }).allTextContents());
  console.log('quick button texts', await page.evaluate(() => Array.from(document.querySelectorAll('button')).map((button) => button.textContent?.trim()).filter(Boolean).slice(0, 20)));

  await page.getByRole('button', { name: 'Sarah Connor' }).click();
  await page.waitForSelector('#create-task-btn', { timeout: 10000 });

  await page.getByRole('button', { name: 'Create Task' }).click();
  await page.getByLabel('Task Title').fill(uniqueTitle);
  await page.getByLabel('Description').fill('End to end coverage');
  await Promise.all([
    page.waitForResponse((response) => response.url().endsWith('/api/tasks') && response.status() === 201),
    page.getByRole('button', { name: 'Save' }).click(),
  ]);

  await page.waitForTimeout(500);
  console.log('body children', await page.evaluate(() => document.body.children.length));
  console.log('document html', await page.evaluate(() => document.documentElement.outerHTML.slice(0,1200)));
  console.log('page title text', await page.locator('body').innerText().catch(() => 'ERROR'));
  console.log('all buttons count', await page.locator('button').count());
  console.log('matching buttons count', await page.locator('button', { hasText: uniqueTitle }).count());
  console.log('button texts', await page.locator('button').allTextContents());
  console.log('project selector', await page.locator('#project-selector').inputValue().catch(() => 'ERROR'));
  console.log('search value', await page.locator('input[placeholder="Search board tasks..."]').inputValue().catch(() => 'ERROR'));

  const createdCard = page.locator('button', { hasText: uniqueTitle }).first();
  console.log('created visible', await createdCard.isVisible().catch(() => 'error'));
  await createdCard.focus();
  await page.waitForTimeout(100);
  console.log('active element after focus', await page.evaluate(() => document.activeElement?.outerHTML?.slice(0,500)));
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(500);

  console.log('todo count', await page.locator('#column-todo').locator('button', { hasText: uniqueTitle }).count());
  console.log('in-progress count', await page.locator('#column-in-progress').locator('button', { hasText: uniqueTitle }).count());
  console.log('review count', await page.locator('#column-review').locator('button', { hasText: uniqueTitle }).count());
  console.log('done count', await page.locator('#column-done').locator('button', { hasText: uniqueTitle }).count());

  await browser.close();
})();
