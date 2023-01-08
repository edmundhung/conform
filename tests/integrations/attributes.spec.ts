import { type Locator, test, expect } from '@playwright/test';
import { getPlayground } from '../helpers';

function getFieldset(form: Locator) {
	return {
		title: form.locator('[name="title"]'),
		description: form.locator('[name="description"]'),
		tags: form.locator('[name="tags"]'),
		images: form.locator('[name="images"]'),
		rating: form.locator('[name="rating"]'),
	};
}

test.beforeEach(async ({ page }) => {
	await page.goto('/attributes');
});

test('setup validation attributes', async ({ page }) => {
	const playground = getPlayground(page);
	const fieldset = getFieldset(playground.container);

	await expect(fieldset.title).toHaveJSProperty('required', true);
	await expect(fieldset.title).toHaveJSProperty('minLength', 1);
	await expect(fieldset.title).toHaveJSProperty('maxLength', 200);
	await expect(fieldset.title).toHaveJSProperty(
		'pattern',
		'[0-9a-zA-Z ]{1,200}',
	);
	await expect(fieldset.title).toHaveJSProperty('multiple', false);
	await expect(fieldset.title).toHaveJSProperty('min', '');
	await expect(fieldset.title).toHaveJSProperty('max', '');
	await expect(fieldset.title).toHaveJSProperty('step', '');

	await expect(fieldset.description).toHaveJSProperty('required', true);
	await expect(fieldset.description).toHaveJSProperty('minLength', 20);
	await expect(fieldset.description).toHaveJSProperty('maxLength', 1000);
	await expect(fieldset.description).toHaveJSProperty('pattern', undefined);
	await expect(fieldset.description).toHaveJSProperty('multiple', undefined);
	await expect(fieldset.description).toHaveJSProperty('min', undefined);
	await expect(fieldset.description).toHaveJSProperty('max', undefined);
	await expect(fieldset.description).toHaveJSProperty('step', undefined);

	await expect(fieldset.images).toHaveJSProperty('required', true);
	await expect(fieldset.images).toHaveJSProperty('minLength', -1);
	await expect(fieldset.images).toHaveJSProperty('maxLength', -1);
	await expect(fieldset.images).toHaveJSProperty('pattern', '');
	await expect(fieldset.images).toHaveJSProperty('multiple', true);
	await expect(fieldset.images).toHaveJSProperty('min', '');
	await expect(fieldset.images).toHaveJSProperty('max', '');
	await expect(fieldset.images).toHaveJSProperty('step', '');

	await expect(fieldset.tags).toHaveJSProperty('required', true);
	await expect(fieldset.tags).toHaveJSProperty('minLength', undefined);
	await expect(fieldset.tags).toHaveJSProperty('maxLength', undefined);
	await expect(fieldset.tags).toHaveJSProperty('pattern', undefined);
	await expect(fieldset.tags).toHaveJSProperty('multiple', true);
	await expect(fieldset.tags).toHaveJSProperty('min', undefined);
	await expect(fieldset.tags).toHaveJSProperty('max', undefined);
	await expect(fieldset.tags).toHaveJSProperty('step', undefined);

	await expect(fieldset.rating).toHaveJSProperty('required', true);
	await expect(fieldset.rating).toHaveJSProperty('minLength', -1);
	await expect(fieldset.rating).toHaveJSProperty('maxLength', -1);
	await expect(fieldset.rating).toHaveJSProperty('pattern', '');
	await expect(fieldset.rating).toHaveJSProperty('multiple', false);
	await expect(fieldset.rating).toHaveJSProperty('min', '0.5');
	await expect(fieldset.rating).toHaveJSProperty('max', '5');
	await expect(fieldset.rating).toHaveJSProperty('step', '0.5');
});

test('setup aria-attributes', async ({ page }) => {
	const playground = getPlayground(page);
	const fieldset = getFieldset(playground.container);

	await expect(playground.form).toHaveAttribute('id', 'test');
	await expect(fieldset.title).toHaveAttribute('id', 'test-title');
	await expect(fieldset.title).toHaveAttribute(
		'aria-describedby',
		'test-title-error',
	);
	await expect(fieldset.title).toHaveAttribute('aria-invalid', 'false');
	await expect(fieldset.description).toHaveAttribute('id', 'test-description');
	await expect(fieldset.description).toHaveAttribute(
		'aria-describedby',
		'test-description-error',
	);
	await expect(fieldset.description).toHaveAttribute('aria-invalid', 'false');
	await expect(fieldset.images).toHaveAttribute('id', 'test-images');
	await expect(fieldset.images).toHaveAttribute(
		'aria-describedby',
		'test-images-error',
	);
	await expect(fieldset.images).toHaveAttribute('aria-invalid', 'false');
	await expect(fieldset.tags).toHaveAttribute('id', 'test-tags');
	await expect(fieldset.tags).toHaveAttribute(
		'aria-describedby',
		'test-tags-error',
	);
	await expect(fieldset.tags).toHaveAttribute('aria-invalid', 'false');
	await expect(fieldset.rating).toHaveAttribute('id', 'test-rating');
	await expect(fieldset.rating).toHaveAttribute(
		'aria-describedby',
		'test-rating-error',
	);
	await expect(fieldset.rating).toHaveAttribute('aria-invalid', 'false');

	await playground.submit.click();
	await expect(fieldset.title).toHaveAttribute('aria-invalid', 'true');
	await expect(fieldset.description).toHaveAttribute('aria-invalid', 'true');
	await expect(fieldset.images).toHaveAttribute('aria-invalid', 'true');
	await expect(fieldset.tags).toHaveAttribute('aria-invalid', 'true');
	await expect(fieldset.rating).toHaveAttribute('aria-invalid', 'true');

	await playground.reset.click();
	await expect(fieldset.title).toHaveAttribute('aria-invalid', 'false');
	await expect(fieldset.description).toHaveAttribute('aria-invalid', 'false');
	await expect(fieldset.images).toHaveAttribute('aria-invalid', 'false');
	await expect(fieldset.tags).toHaveAttribute('aria-invalid', 'false');
	await expect(fieldset.rating).toHaveAttribute('aria-invalid', 'false');
});
