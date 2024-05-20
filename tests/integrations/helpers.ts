import type { Locator, Page } from '@playwright/test';

export function getPlayground(page: Page) {
	const container = page.locator('body');
	const submission = container.locator('pre');

	return {
		container,
		form: container.locator('form'),
		submit: container.locator('footer button[type="submit"]'),
		reset: container.locator('footer button[type="reset"]'),
		submission,
		result: () => submission.innerText().then(JSON.parse),
		error: container.locator('main p'),
	};
}

export async function selectAll(locator: Locator) {
	switch (process.platform) {
		case 'darwin':
			await locator.press('Meta+a');
			break;
		default:
			await locator.press('Control+a');
	}
}

export async function cut(locator: Locator) {
	switch (process.platform) {
		case 'darwin':
			await locator.press('Meta+x');
			break;
		default:
			await locator.press('Control+x');
	}
}

export async function paste(locator: Locator) {
	switch (process.platform) {
		case 'darwin':
			await locator.press('Meta+v');
			break;
		default:
			await locator.press('Control+v');
	}
}
