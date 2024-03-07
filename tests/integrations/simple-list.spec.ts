import { type Page, type Locator, test, expect } from '@playwright/test';
import { getPlayground } from '../helpers';

function getFieldset(form: Locator) {
	return {
		items: form.locator('ol > li'),
		insertTop: form.locator('button:text("Insert top")'),
		insertBottom: form.locator('button:text("Insert bottom")'),
	};
}

function getItemFieldset(list: Locator, index: number) {
	return {
		content: list.nth(index).locator(`[name="items[${index}]"]`),
		delete: list.nth(index).locator('button:text("Delete")'),
		clear: list.nth(index).locator('button:text("Clear")'),
		moveToTop: list.nth(index).locator('button:text("Move to top")'),
	};
}

async function runValidationScenario(page: Page) {
	const playground = getPlayground(page);
	const fieldset = getFieldset(playground.container);
	const item0 = getItemFieldset(fieldset.items, 0);
	const item1 = getItemFieldset(fieldset.items, 1);
	const item2 = getItemFieldset(fieldset.items, 2);

	await expect(fieldset.items).toHaveCount(0);
	await expect(playground.error).toHaveText(['']);

	// Insert first row
	await fieldset.insertBottom.click();
	await expect(fieldset.items).toHaveCount(1);
	await expect(playground.error).toHaveText(['', '']);

	// Submit form
	await playground.submit.click();
	await expect(playground.error).toHaveText(['', 'The field is required']);

	// Type `First Item` on first row
	await item0.content.type('First item');

	// Trigger revalidation
	await playground.submit.click();
	await expect(playground.error).toHaveText(['', '']);

	// Delete the first row
	await item0.delete.click();
	await expect(fieldset.items).toHaveCount(0);
	await expect(playground.error).toHaveText(['At least one item is required']);

	// Insert a new row
	await fieldset.insertTop.click();
	await expect(fieldset.items).toHaveCount(1);
	await expect(item0.content).toHaveValue('Top item');

	// Type `Another Item` on first row
	await item0.content.fill('Another item');

	// Insert a new row on top
	await fieldset.insertTop.click();
	await expect(fieldset.items).toHaveCount(2);
	await expect(item0.content).toHaveValue('Top item');
	await expect(item1.content).toHaveValue('Another item');

	// Insert a new row at the bottom
	await fieldset.insertBottom.click();
	await expect(fieldset.items).toHaveCount(3);
	await expect(playground.error).toHaveText([
		'Maximum 2 items are allowed',
		'',
		'',
		'',
	]);
	await expect(item0.content).toHaveValue('Top item');
	await expect(item1.content).toHaveValue('Another item');
	await expect(item2.content).toHaveValue('');

	await playground.submit.click();
	await expect(playground.error).toHaveText([
		'Maximum 2 items are allowed',
		'',
		'',
		'The field is required',
	]);

	// Delete the first row
	await item0.delete.click();
	await expect(fieldset.items).toHaveCount(2);
	await expect(item0.content).toHaveValue('Another item');
	await expect(item1.content).toHaveValue('');

	// Trigger revalidation
	await playground.submit.click();
	await expect(playground.error).toHaveText(['', '', 'The field is required']);

	// Type something on 2nd item
	await item1.content.type('2nd item');

	// Trigger revalidation
	await playground.submit.click();
	await expect(playground.error).toHaveText(['', '', 'Number is not allowed']);

	// Clear 2nd row
	await item1.clear.click();
	await expect(fieldset.items).toHaveCount(2);
	await expect(item0.content).toHaveValue('Another item');
	await expect(item1.content).toHaveValue('');
	await expect(playground.error).toHaveText(['', '', '']);

	// Trigger revalidation
	await playground.submit.click();
	await expect(playground.error).toHaveText(['', '', 'The field is required']);

	// Move 2nd row to top
	await item1.moveToTop.click();
	await expect(fieldset.items).toHaveCount(2);
	await expect(item0.content).toHaveValue('');
	await expect(item1.content).toHaveValue('Another item');

	// Trigger revalidation
	await playground.submit.click();
	await expect(playground.error).toHaveText(['', 'The field is required', '']);

	await item0.content.type('Last item');

	// Trigger revalidation
	await playground.submit.click();
	await expect(playground.error).toHaveText(['', '', '']);

	await expect.poll(playground.result).toStrictEqual({
		status: 'success',
		initialValue: {
			items: ['Last item', 'Another item'],
		},
		fields: ['items[0]', 'items[1]'],
		state: {
			validated: {
				items: true,
				'items[0]': true,
				'items[1]': true,
			},
		},
	});
}

async function testListDefaultValue(page: Page, shouldReset?: boolean) {
	const playground = getPlayground(page);
	const fieldset = getFieldset(playground.container);
	const item0 = getItemFieldset(fieldset.items, 0);
	const item1 = getItemFieldset(fieldset.items, 1);

	await expect(fieldset.items).toHaveCount(2);
	await expect(item0.content).toHaveValue('default item 0');
	await expect(item1.content).toHaveValue('default item 1');

	await item0.delete.click();
	await expect(fieldset.items).toHaveCount(1);
	await expect(item0.content).toHaveValue('default item 1');

	await fieldset.insertTop.click();
	await expect(fieldset.items).toHaveCount(2);
	await expect(item0.content).toHaveValue('Top item');
	await expect(item1.content).toHaveValue('default item 1');

	await item1.delete.click();
	await expect(fieldset.items).toHaveCount(1);
	await expect(item0.content).toHaveValue('Top item');

	await item0.content.fill('');

	await playground.submit.click();
	await expect(fieldset.items).toHaveCount(1);
	await expect(playground.error).toHaveText(['', 'The field is required']);

	if (shouldReset) {
		await playground.reset.click();
		await expect(fieldset.items).toHaveCount(2);
		await expect(item0.content).toHaveValue('default item 0');
		await expect(item1.content).toHaveValue('default item 1');
		await expect(playground.error).toHaveText(['', '', '']);
	}
}

test.describe('With JS', () => {
	test('Client Validation', async ({ page }) => {
		await page.goto('/simple-list');
		await runValidationScenario(page);
	});

	test('Server Validation', async ({ page }) => {
		await page.goto('/simple-list?noClientValidate=yes');
		await runValidationScenario(page);
	});

	test('Form reset without default value', async ({ page }) => {
		await page.goto('/simple-list');

		const playground = getPlayground(page);
		const fieldset = getFieldset(playground.container);

		await fieldset.insertBottom.click();
		await playground.submit.click();

		// Before reset
		await expect(fieldset.items).toHaveCount(1);
		await expect(playground.error).toHaveText(['', 'The field is required']);

		await playground.reset.click();

		// After reset
		await expect(fieldset.items).toHaveCount(0);
		await expect(playground.error).toHaveText(['']);
	});

	test('Form reset with default value', async ({ page }) => {
		await page.goto('/simple-list?hasDefaultValue=yes');
		await testListDefaultValue(page, true);
	});
});

test.describe('No JS', () => {
	test.use({ javaScriptEnabled: false });

	test('Validation without default value', async ({ page }) => {
		await page.goto('/simple-list');
		await runValidationScenario(page);
	});

	test('Validation with default value', async ({ page }) => {
		await page.goto('/simple-list?hasDefaultValue=yes');
		await testListDefaultValue(page);
	});
});
