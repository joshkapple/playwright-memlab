import {expect} from '@playwright/test';
import {memlabTest as test} from "../memlab/MemlabTools";

test('has title', async ({page, memlabTool}, testInfo) => {
    await page.goto('https://playwright.dev/');

    await memlabTool.startTrackingHeap()
    await memlabTool.captureHeapSnapshot(1, "has_title")

    await page.goto('https://playwright.dev/tjdsal');
    await memlabTool.captureHeapSnapshot( 2, "has_title")

    await page.goto('https://playwright.dev/');
    await memlabTool.captureHeapSnapshot(3, "has_title")

    memlabTool.clearCDPSession()


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
