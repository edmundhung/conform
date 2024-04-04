import { type Locator, test, expect } from '@playwright/test';
import { getPlayground } from '../helpers';

function getFieldset(form: Locator) {
	return {
		action: form.locator('[name="_action"]'),
		encType: form.locator('[name="_enctype"]'),
		method: form.locator('[name="_method"]'),
	};
}

test('default form attributes', async ({ page }) => {
	await page.goto('/form-attributes');

	const playground = getPlayground(page);
	const fieldset = getFieldset(playground.container);

	await playground.submit.click();
	await expect(fieldset.action).toHaveValue('/form-attributes');
	await expect(fieldset.encType).toHaveValue(
		'application/x-www-form-urlencoded',
	);
	await expect(fieldset.method).toHaveValue('GET');
});

test('custom form attributes', async ({ page }) => {
	await page.goto(
		'/form-attributes?formMethod=post&formAction=/test&formEncType=multipart/form-data',
	);

	const playground = getPlayground(page);
	const fieldset = getFieldset(playground.container);

	await playground.submit.click();
	await expect(fieldset.action).toHaveValue('/test');
	await expect(fieldset.encType).toHaveValue('multipart/form-data');
	await expect(fieldset.method).toHaveValue('POST');
});

test('unsupported form attributes', async ({ page }) => {
	await page.goto(
		'/form-attributes?formMethod=test&formAction=//example.com/test&formEncType=hello/world',
	);

	const playground = getPlayground(page);
	const fieldset = getFieldset(playground.container);

	await playground.submit.click();
	await expect(fieldset.action).toHaveValue('//example.com/test');
	await expect(fieldset.encType).toHaveValue(
		'application/x-www-form-urlencoded',
	);
	await expect(fieldset.method).toHaveValue('GET');
});

test('submitter attributes', async ({ page }) => {
	await page.goto(
		'/form-attributes?submitterMethod=put&submitterAction=/hello&submitterEncType=multipart/form-data',
	);

	const playground = getPlayground(page);
	const fieldset = getFieldset(playground.container);

	await playground.submit.click();
	await expect(fieldset.action).toHaveValue('/hello');
	await expect(fieldset.encType).toHaveValue('multipart/form-data');
	await expect(fieldset.method).toHaveValue('PUT');
});

test('unsupported submitter attributes', async ({ page }) => {
	await page.goto(
		'/form-attributes?submitterMethod=test&submitterAction=//example.com/test&submitterEncType=hello/world',
	);

	const playground = getPlayground(page);
	const fieldset = getFieldset(playground.container);

	await playground.submit.click();
	await expect(fieldset.action).toHaveValue('//example.com/test');
	await expect(fieldset.encType).toHaveValue(
		'application/x-www-form-urlencoded',
	);
	await expect(fieldset.method).toHaveValue('GET');
});

test('override behaviour', async ({ page }) => {
	await page.goto(
		'/form-attributes?formAction=/test&formMethod=delete&submitterMethod=test&formEncType=multipart/form-data&submitterEncType=hello/world',
	);

	const playground = getPlayground(page);
	const fieldset = getFieldset(playground.container);

	await playground.submit.click();
	await expect(fieldset.action).toHaveValue('/test');
	await expect(fieldset.encType).toHaveValue(
		'application/x-www-form-urlencoded',
	);
	await expect(fieldset.method).toHaveValue('GET');
});
