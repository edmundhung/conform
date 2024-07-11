import { test, expect } from '@playwright/test';
import { getPlayground } from './helpers';

test('shouldDirtyConsider', async ({ page }) => {
	await page.goto('/dirty');
	const playground = getPlayground(page);

	await expect(playground.container.getByTestId('is-dirty')).toHaveText(
		'false',
	);
});
