import type { Page } from '@playwright/test';

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
