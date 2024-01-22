import {test, expect} from '@playwright/test';
import {captureHeapSnapshot} from '../memlab/memlab-api'

test('has title', async ({page}, testInfo) => {
    await page.goto('https://playwright.dev/');

    await captureHeapSnapshot(page, 1, "has_title")

    await page.goto('https://playwright.dev/tjdsal');


    await captureHeapSnapshot(page, 2, "has_title")

    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle(/Playwright/);
});

test('get started link', async ({page}) => {
    await page.goto('https://playwright.dev/');

    // Click the get started link.
    await page.getByRole('link', {name: 'Get started'}).click();

    // Expects page to have a heading with the name of Installation.
    await expect(page.getByRole('heading', {name: 'Installation'})).toBeVisible();
});
