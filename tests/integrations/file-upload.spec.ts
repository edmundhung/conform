import { type Page, type Locator, test, expect } from '@playwright/test';
import { getPlayground } from '../helpers';

function getFieldset(form: Locator) {
	return {
		file: form.locator('[name="file"]'),
		files: form.locator('[name="files"]'),
	};
}

interface TestFile {
	name: string;
	mimeType: string;
	buffer: Buffer;
}

const testFiles: TestFile[] = [
	{
		name: 'zero.txt',
		mimeType: 'plain/text',
		buffer: Buffer.from(Array(5000).fill(0)),
	},
	{
		name: 'test.json',
		mimeType: 'application/json',
		buffer: Buffer.from('{}'),
	},
	{
		name: 'huge.json',
		mimeType: 'application/json',
		buffer: Buffer.from(`{ data: ${Array(5109).fill(1).join('')} }`), // 5109 + 10 < 5120
	},
];

async function runValidationScenario(page: Page) {
	const playground = getPlayground(page);
	const fieldset = getFieldset(playground.container);

	// Trigger form validation
	await playground.submit.click();
	await expect(playground.error).toHaveText([
		'',
		'File is required',
		'At least 1 file is required',
	]);
	await fieldset.file.setInputFiles(testFiles[0]);
	// Trigger revalidation
	await playground.submit.click();
	await expect(playground.error).toHaveText([
		'',
		'Only JSON file is accepted',
		'At least 1 file is required',
	]);

	await fieldset.file.setInputFiles(testFiles[1]);

	// Trigger revalidation
	await playground.submit.click();
	await expect(playground.error).toHaveText([
		'',
		'',
		'At least 1 file is required',
	]);

	await fieldset.file.setInputFiles(testFiles[1]);
	await fieldset.files.setInputFiles([testFiles[1], testFiles[2]]);

	// Trigger revalidation
	await playground.submit.click();
	await expect(playground.error).toHaveText([
		'',
		'',
		'Total file size must be less than 5kb',
	]);

	await fieldset.file.setInputFiles(testFiles[1]);
	await fieldset.files.setInputFiles(testFiles[2]);

	// Trigger revalidation
	await playground.submit.click();
	await expect(playground.error).toHaveText(['', '', '']);

	expect(JSON.parse(await playground.submission.innerText())).toMatchObject({
		type: 'submit',
		value: {
			file: {
				_name: 'test.json',
				_lastModified: expect.anything(),
			},
			files: {
				_name: 'huge.json',
				_lastModified: expect.anything(),
			},
		},
		error: [],
	});
}

test.describe('With JS', () => {
	test('Client Validation', async ({ page }) => {
		await page.goto('/file-upload');
		await runValidationScenario(page);
	});

	test('Server Validation', async ({ page }) => {
		await page.goto('/file-upload?noClientValidate=yes');
		await runValidationScenario(page);
	});

	test('Form reset', async ({ page }) => {
		await page.goto('/file-upload');

		const playground = getPlayground(page);

		await playground.submit.click();
		await expect(playground.error).toHaveText([
			'',
			'File is required',
			'At least 1 file is required',
		]);

		await playground.reset.click();
		await expect(playground.error).toHaveText(['', '', '']);
	});
});

test.describe('No JS', () => {
	test.use({ javaScriptEnabled: false });

	test('Validation', async ({ page }) => {
		await page.goto('/file-upload');
		await runValidationScenario(page);
	});
});
