import { type Page, type Locator, test, expect } from '@playwright/test';
import { getPlayground } from '../helpers';

function getFieldset(form: Locator) {
	const list = form.locator('fieldset');

	return {
		title: form.locator('[name="title"]'),
		bookmarks: [
			{
				name: list.nth(0).locator('[name="bookmarks[0].name"]'),
				url: list.nth(0).locator('[name="bookmarks[0].url"]'),
			},
			{
				name: list.nth(1).locator('[name="bookmarks[1].name"]'),
				url: list.nth(1).locator('[name="bookmarks[1].url"]'),
			},
		],
		file: form.locator('[name="file"]'),
		files: form.locator('[name="files"]'),
	};
}

const textFile = {
	name: 'example.txt',
	mimeType: 'text/plain',
	buffer: Buffer.from('hello world'),
};

const jsonFile = {
	name: 'example.json',
	mimeType: 'application/json',
	buffer: Buffer.from(JSON.stringify({ a: 'foo', b: 123, c: false })),
};

const yamlFile = {
	name: 'example.yaml',
	mimeType: 'application/x-yaml',
	buffer: Buffer.from(['a: foo', 'b: 123', 'c: false'].join('\n')),
};

async function validateMetadata(
	page: Page,
	options: {
		noJS?: boolean;
		clientValidate?: boolean;
	} = {},
) {
	const playground = getPlayground(page);
	const fieldset = getFieldset(playground.container);

	await expect.poll(playground.result).toEqual({
		form: {
			initialValue: {
				title: 'Test',
				bookmarks: [null, null],
			},
			value: {
				title: 'Test',
				bookmarks: [null, null],
			},
			dirty: false,
			valid: true,
			allErrors: {},
		},
		title: {
			initialValue: 'Test',
			dirty: false,
			valid: true,
			value: 'Test',
			allErrors: {},
		},
		bookmarks: {
			initialValue: [null, null],
			value: [null, null],
			dirty: false,
			valid: true,
			allErrors: {},
		},
		'bookmarks[0]': {
			dirty: false,
			valid: true,
			allErrors: {},
		},
		'bookmarks[1]': {
			dirty: false,
			valid: true,
			allErrors: {},
		},
		file: {
			allErrors: {},
			dirty: false,
			valid: true,
		},
		files: {
			allErrors: {},
			dirty: false,
			valid: true,
		},
	});

	await playground.submit.click();
	await expect.poll(playground.result).toEqual({
		form: {
			status: 'error',
			initialValue: {
				title: 'Test',
				bookmarks: [null, null],
			},
			value: {
				title: 'Test',
				bookmarks: [null, null],
			},
			dirty: false,
			valid: false,
			allErrors: {
				'bookmarks[0].name': ['Name is required'],
				'bookmarks[0].url': ['Url is required'],
				'bookmarks[1].name': ['Name is required'],
				'bookmarks[1].url': ['Url is required'],
				file: ['File is required'],
				files: ['At least 1 file is required'],
			},
		},
		title: {
			initialValue: 'Test',
			value: 'Test',
			dirty: false,
			valid: true,
			allErrors: {},
		},
		bookmarks: {
			initialValue: [null, null],
			value: [null, null],
			dirty: false,
			valid: false,
			allErrors: {
				'bookmarks[0].name': ['Name is required'],
				'bookmarks[0].url': ['Url is required'],
				'bookmarks[1].name': ['Name is required'],
				'bookmarks[1].url': ['Url is required'],
			},
		},
		'bookmarks[0]': {
			dirty: false,
			valid: false,
			allErrors: {
				'bookmarks[0].name': ['Name is required'],
				'bookmarks[0].url': ['Url is required'],
			},
		},
		'bookmarks[1]': {
			dirty: false,
			valid: false,
			allErrors: {
				'bookmarks[1].name': ['Name is required'],
				'bookmarks[1].url': ['Url is required'],
			},
		},
		file: {
			errors: ['File is required'],
			allErrors: {
				file: ['File is required'],
			},
			dirty: false,
			valid: false,
		},
		files: {
			errors: ['At least 1 file is required'],
			allErrors: {
				files: ['At least 1 file is required'],
			},
			dirty: false,
			valid: false,
		},
	});

	// To confirm if dirty check works correctly
	await fieldset.title.fill('');
	await fieldset.title.fill('Test');
	if (!options.noJS) {
		await expect.poll(playground.result).toEqual({
			form: {
				status: 'error',
				initialValue: {
					title: 'Test',
					bookmarks: [null, null],
				},
				value: {
					title: 'Test',
					bookmarks: [null, null],
				},
				dirty: false,
				valid: false,
				allErrors: {
					'bookmarks[0].name': ['Name is required'],
					'bookmarks[0].url': ['Url is required'],
					'bookmarks[1].name': ['Name is required'],
					'bookmarks[1].url': ['Url is required'],
					file: ['File is required'],
					files: ['At least 1 file is required'],
				},
			},
			title: {
				initialValue: 'Test',
				value: 'Test',
				dirty: false,
				valid: true,
				allErrors: {},
			},
			bookmarks: {
				initialValue: [null, null],
				value: [null, null],
				dirty: false,
				valid: false,
				allErrors: {
					'bookmarks[0].name': ['Name is required'],
					'bookmarks[0].url': ['Url is required'],
					'bookmarks[1].name': ['Name is required'],
					'bookmarks[1].url': ['Url is required'],
				},
			},
			'bookmarks[0]': {
				dirty: false,
				valid: false,
				allErrors: {
					'bookmarks[0].name': ['Name is required'],
					'bookmarks[0].url': ['Url is required'],
				},
			},
			'bookmarks[1]': {
				dirty: false,
				valid: false,
				allErrors: {
					'bookmarks[1].name': ['Name is required'],
					'bookmarks[1].url': ['Url is required'],
				},
			},
			file: {
				errors: ['File is required'],
				allErrors: {
					file: ['File is required'],
				},
				dirty: false,
				valid: false,
			},
			files: {
				errors: ['At least 1 file is required'],
				allErrors: {
					files: ['At least 1 file is required'],
				},
				dirty: false,
				valid: false,
			},
		});
	}

	await fieldset.title.fill('Projects');
	if (!options.noJS) {
		await expect.poll(playground.result).toEqual({
			form: {
				status: 'error',
				initialValue: {
					title: 'Test',
					bookmarks: [null, null],
				},
				value: {
					title: 'Projects',
					bookmarks: [null, null],
				},
				dirty: true,
				valid: false,
				allErrors: {
					'bookmarks[0].name': ['Name is required'],
					'bookmarks[0].url': ['Url is required'],
					'bookmarks[1].name': ['Name is required'],
					'bookmarks[1].url': ['Url is required'],
					file: ['File is required'],
					files: ['At least 1 file is required'],
				},
			},
			title: {
				initialValue: 'Test',
				value: 'Projects',
				dirty: true,
				valid: true,
				allErrors: {},
			},
			bookmarks: {
				initialValue: [null, null],
				value: [null, null],
				dirty: false,
				valid: false,
				allErrors: {
					'bookmarks[0].name': ['Name is required'],
					'bookmarks[0].url': ['Url is required'],
					'bookmarks[1].name': ['Name is required'],
					'bookmarks[1].url': ['Url is required'],
				},
			},
			'bookmarks[0]': {
				dirty: false,
				valid: false,
				allErrors: {
					'bookmarks[0].name': ['Name is required'],
					'bookmarks[0].url': ['Url is required'],
				},
			},
			'bookmarks[1]': {
				dirty: false,
				valid: false,
				allErrors: {
					'bookmarks[1].name': ['Name is required'],
					'bookmarks[1].url': ['Url is required'],
				},
			},
			file: {
				errors: ['File is required'],
				allErrors: {
					file: ['File is required'],
				},
				dirty: false,
				valid: false,
			},
			files: {
				errors: ['At least 1 file is required'],
				allErrors: {
					files: ['At least 1 file is required'],
				},
				dirty: false,
				valid: false,
			},
		});
	}

	await playground.submit.click();
	await expect.poll(playground.result).toEqual({
		form: {
			status: 'error',
			initialValue: {
				title: options.noJS ? 'Projects' : 'Test',
				bookmarks: [null, null],
			},
			value: {
				title: 'Projects',
				bookmarks: [null, null],
			},
			dirty: true,
			valid: false,
			allErrors: {
				'bookmarks[0].name': ['Name is required'],
				'bookmarks[0].url': ['Url is required'],
				'bookmarks[1].name': ['Name is required'],
				'bookmarks[1].url': ['Url is required'],
				file: ['File is required'],
				files: ['At least 1 file is required'],
			},
		},
		title: {
			initialValue: options.noJS ? 'Projects' : 'Test',
			value: 'Projects',
			dirty: true,
			valid: true,
			allErrors: {},
		},
		bookmarks: {
			initialValue: [null, null],
			value: [null, null],
			dirty: false,
			valid: false,
			allErrors: {
				'bookmarks[0].name': ['Name is required'],
				'bookmarks[0].url': ['Url is required'],
				'bookmarks[1].name': ['Name is required'],
				'bookmarks[1].url': ['Url is required'],
			},
		},
		'bookmarks[0]': {
			dirty: false,
			valid: false,
			allErrors: {
				'bookmarks[0].name': ['Name is required'],
				'bookmarks[0].url': ['Url is required'],
			},
		},
		'bookmarks[1]': {
			dirty: false,
			valid: false,
			allErrors: {
				'bookmarks[1].name': ['Name is required'],
				'bookmarks[1].url': ['Url is required'],
			},
		},
		file: {
			errors: ['File is required'],
			allErrors: {
				file: ['File is required'],
			},
			dirty: false,
			valid: false,
		},
		files: {
			errors: ['At least 1 file is required'],
			allErrors: {
				files: ['At least 1 file is required'],
			},
			dirty: false,
			valid: false,
		},
	});

	await fieldset.bookmarks[0].name.fill('Conform');
	await playground.submit.click();
	await expect.poll(playground.result).toEqual({
		form: {
			status: 'error',
			initialValue: options.noJS
				? {
						title: 'Projects',
						bookmarks: [
							{
								name: 'Conform',
							},
							null,
						],
					}
				: {
						title: 'Test',
						bookmarks: [null, null],
					},
			value: {
				title: 'Projects',
				bookmarks: [
					{
						name: 'Conform',
					},
					null,
				],
			},
			dirty: true,
			valid: false,
			allErrors: {
				'bookmarks[0].url': ['Url is required'],
				'bookmarks[1].name': ['Name is required'],
				'bookmarks[1].url': ['Url is required'],
				file: ['File is required'],
				files: ['At least 1 file is required'],
			},
		},
		title: {
			initialValue: options.noJS ? 'Projects' : 'Test',
			value: 'Projects',
			dirty: true,
			valid: true,
			allErrors: {},
		},
		bookmarks: {
			initialValue: options.noJS
				? [
						{
							name: 'Conform',
						},
						null,
					]
				: [null, null],
			value: [
				{
					name: 'Conform',
				},
				null,
			],
			dirty: true,
			valid: false,
			allErrors: {
				'bookmarks[0].url': ['Url is required'],
				'bookmarks[1].name': ['Name is required'],
				'bookmarks[1].url': ['Url is required'],
			},
		},
		'bookmarks[0]': {
			initialValue: options.noJS ? { name: 'Conform' } : undefined,
			value: {
				name: 'Conform',
			},
			dirty: true,
			valid: false,
			allErrors: {
				'bookmarks[0].url': ['Url is required'],
			},
		},
		'bookmarks[1]': {
			dirty: false,
			valid: false,
			allErrors: {
				'bookmarks[1].name': ['Name is required'],
				'bookmarks[1].url': ['Url is required'],
			},
		},
		file: {
			errors: ['File is required'],
			allErrors: {
				file: ['File is required'],
			},
			dirty: false,
			valid: false,
		},
		files: {
			errors: ['At least 1 file is required'],
			allErrors: {
				files: ['At least 1 file is required'],
			},
			dirty: false,
			valid: false,
		},
	});

	await fieldset.bookmarks[0].url.fill('https://conform.guide');
	await playground.submit.click();
	await expect.poll(playground.result).toEqual({
		form: {
			status: 'error',
			initialValue: options.noJS
				? {
						title: 'Projects',
						bookmarks: [
							{
								name: 'Conform',
								url: 'https://conform.guide',
							},
							null,
						],
					}
				: {
						title: 'Test',
						bookmarks: [null, null],
					},
			value: {
				title: 'Projects',
				bookmarks: [
					{
						name: 'Conform',
						url: 'https://conform.guide',
					},
					null,
				],
			},
			dirty: true,
			valid: false,
			allErrors: {
				'bookmarks[1].name': ['Name is required'],
				'bookmarks[1].url': ['Url is required'],
				file: ['File is required'],
				files: ['At least 1 file is required'],
			},
		},
		title: {
			initialValue: options.noJS ? 'Projects' : 'Test',
			value: 'Projects',
			dirty: true,
			valid: true,
			allErrors: {},
		},
		bookmarks: {
			initialValue: options.noJS
				? [
						{
							name: 'Conform',
							url: 'https://conform.guide',
						},
						null,
					]
				: [null, null],
			value: [
				{
					name: 'Conform',
					url: 'https://conform.guide',
				},
				null,
			],
			dirty: true,
			valid: false,
			allErrors: {
				'bookmarks[1].name': ['Name is required'],
				'bookmarks[1].url': ['Url is required'],
			},
		},
		'bookmarks[0]': {
			initialValue: options.noJS
				? { name: 'Conform', url: 'https://conform.guide' }
				: undefined,
			value: {
				name: 'Conform',
				url: 'https://conform.guide',
			},
			dirty: true,
			valid: true,
			allErrors: {},
		},
		'bookmarks[1]': {
			dirty: false,
			valid: false,
			allErrors: {
				'bookmarks[1].name': ['Name is required'],
				'bookmarks[1].url': ['Url is required'],
			},
		},
		file: {
			errors: ['File is required'],
			allErrors: {
				file: ['File is required'],
			},
			dirty: false,
			valid: false,
		},
		files: {
			errors: ['At least 1 file is required'],
			allErrors: {
				files: ['At least 1 file is required'],
			},
			dirty: false,
			valid: false,
		},
	});

	await fieldset.bookmarks[1].name.fill('Super cool website');
	await fieldset.bookmarks[1].url.fill('https://conform.guide');
	await playground.submit.click();
	await expect.poll(playground.result).toEqual({
		form: {
			status: 'error',
			initialValue: options.noJS
				? {
						title: 'Projects',
						bookmarks: [
							{
								name: 'Conform',
								url: 'https://conform.guide',
							},
							{
								name: 'Super cool website',
								url: 'https://conform.guide',
							},
						],
					}
				: {
						title: 'Test',
						bookmarks: [null, null],
					},
			value: {
				title: 'Projects',
				bookmarks: [
					{
						name: 'Conform',
						url: 'https://conform.guide',
					},
					{
						name: 'Super cool website',
						url: 'https://conform.guide',
					},
				],
			},
			dirty: true,
			valid: false,
			allErrors: {
				bookmarks: ['Bookmark URLs are repeated'],
				file: ['File is required'],
				files: ['At least 1 file is required'],
			},
		},
		title: {
			initialValue: options.noJS ? 'Projects' : 'Test',
			value: 'Projects',
			dirty: true,
			valid: true,
			allErrors: {},
		},
		bookmarks: {
			initialValue: options.noJS
				? [
						{
							name: 'Conform',
							url: 'https://conform.guide',
						},
						{
							name: 'Super cool website',
							url: 'https://conform.guide',
						},
					]
				: [null, null],
			value: [
				{
					name: 'Conform',
					url: 'https://conform.guide',
				},
				{
					name: 'Super cool website',
					url: 'https://conform.guide',
				},
			],
			dirty: true,
			valid: false,
			errors: ['Bookmark URLs are repeated'],
			allErrors: {
				bookmarks: ['Bookmark URLs are repeated'],
			},
		},
		'bookmarks[0]': {
			initialValue: options.noJS
				? { name: 'Conform', url: 'https://conform.guide' }
				: undefined,
			value: {
				name: 'Conform',
				url: 'https://conform.guide',
			},
			dirty: true,
			valid: true,
			allErrors: {},
		},
		'bookmarks[1]': {
			initialValue: options.noJS
				? { name: 'Super cool website', url: 'https://conform.guide' }
				: undefined,
			value: {
				name: 'Super cool website',
				url: 'https://conform.guide',
			},
			dirty: true,
			valid: true,
			allErrors: {},
		},
		file: {
			errors: ['File is required'],
			allErrors: {
				file: ['File is required'],
			},
			dirty: false,
			valid: false,
		},
		files: {
			errors: ['At least 1 file is required'],
			allErrors: {
				files: ['At least 1 file is required'],
			},
			dirty: false,
			valid: false,
		},
	});

	await fieldset.bookmarks[1].url.fill('https://remix.guide');
	await playground.submit.click();
	await expect.poll(playground.result).toEqual({
		form: {
			status: 'error',
			initialValue: options.noJS
				? {
						title: 'Projects',
						bookmarks: [
							{
								name: 'Conform',
								url: 'https://conform.guide',
							},
							{
								name: 'Super cool website',
								url: 'https://remix.guide',
							},
						],
					}
				: {
						title: 'Test',
						bookmarks: [null, null],
					},
			value: {
				title: 'Projects',
				bookmarks: [
					{
						name: 'Conform',
						url: 'https://conform.guide',
					},
					{
						name: 'Super cool website',
						url: 'https://remix.guide',
					},
				],
			},
			dirty: true,
			valid: false,
			allErrors: {
				file: ['File is required'],
				files: ['At least 1 file is required'],
			},
		},
		title: {
			initialValue: options.noJS ? 'Projects' : 'Test',
			value: 'Projects',
			dirty: true,
			valid: true,
			allErrors: {},
		},
		bookmarks: {
			initialValue: options.noJS
				? [
						{
							name: 'Conform',
							url: 'https://conform.guide',
						},
						{
							name: 'Super cool website',
							url: 'https://remix.guide',
						},
					]
				: [null, null],
			value: [
				{
					name: 'Conform',
					url: 'https://conform.guide',
				},
				{
					name: 'Super cool website',
					url: 'https://remix.guide',
				},
			],
			dirty: true,
			valid: true,
			allErrors: {},
		},
		'bookmarks[0]': {
			initialValue: options.noJS
				? { name: 'Conform', url: 'https://conform.guide' }
				: undefined,
			value: {
				name: 'Conform',
				url: 'https://conform.guide',
			},
			dirty: true,
			valid: true,
			allErrors: {},
		},
		'bookmarks[1]': {
			initialValue: options.noJS
				? { name: 'Super cool website', url: 'https://remix.guide' }
				: undefined,
			value: {
				name: 'Super cool website',
				url: 'https://remix.guide',
			},
			dirty: true,
			valid: true,
			allErrors: {},
		},
		file: {
			errors: ['File is required'],
			allErrors: {
				file: ['File is required'],
			},
			dirty: false,
			valid: false,
		},
		files: {
			errors: ['At least 1 file is required'],
			allErrors: {
				files: ['At least 1 file is required'],
			},
			dirty: false,
			valid: false,
		},
	});

	// This is only tested with client validation because only it will returns the file after parsing the submission
	// TODO: handle this with server validation as well as long as JS is enabled?
	if (!options.clientValidate) {
		return;
	}

	await fieldset.file.setInputFiles(textFile);
	await playground.submit.click();
	await expect.poll(playground.result).toEqual({
		form: {
			status: 'error',
			initialValue: options.noJS
				? {
						title: 'Projects',
						bookmarks: [
							{
								name: 'Conform',
								url: 'https://conform.guide',
							},
							{
								name: 'Super cool website',
								url: 'https://remix.guide',
							},
						],
					}
				: {
						title: 'Test',
						bookmarks: [null, null],
					},
			value: {
				title: 'Projects',
				bookmarks: [
					{
						name: 'Conform',
						url: 'https://conform.guide',
					},
					{
						name: 'Super cool website',
						url: 'https://remix.guide',
					},
				],
				file: 'example.txt (11 bytes)',
			},
			dirty: true,
			valid: false,
			allErrors: {
				files: ['At least 1 file is required'],
			},
		},
		title: {
			initialValue: options.noJS ? 'Projects' : 'Test',
			value: 'Projects',
			dirty: true,
			valid: true,
			allErrors: {},
		},
		bookmarks: {
			initialValue: options.noJS
				? [
						{
							name: 'Conform',
							url: 'https://conform.guide',
						},
						{
							name: 'Super cool website',
							url: 'https://remix.guide',
						},
					]
				: [null, null],
			value: [
				{
					name: 'Conform',
					url: 'https://conform.guide',
				},
				{
					name: 'Super cool website',
					url: 'https://remix.guide',
				},
			],
			dirty: true,
			valid: true,
			allErrors: {},
		},
		'bookmarks[0]': {
			initialValue: options.noJS
				? { name: 'Conform', url: 'https://conform.guide' }
				: undefined,
			value: {
				name: 'Conform',
				url: 'https://conform.guide',
			},
			dirty: true,
			valid: true,
			allErrors: {},
		},
		'bookmarks[1]': {
			initialValue: options.noJS
				? { name: 'Super cool website', url: 'https://remix.guide' }
				: undefined,
			value: {
				name: 'Super cool website',
				url: 'https://remix.guide',
			},
			dirty: true,
			valid: true,
			allErrors: {},
		},
		file: {
			value: 'example.txt (11 bytes)',
			dirty: true,
			valid: true,
			allErrors: {},
		},
		files: {
			errors: ['At least 1 file is required'],
			allErrors: {
				files: ['At least 1 file is required'],
			},
			dirty: false,
			valid: false,
		},
	});

	await fieldset.files.setInputFiles([jsonFile, yamlFile]);
	await playground.submit.click();
	await expect.poll(playground.result).toEqual({
		form: {
			status: 'error',
			initialValue: options.noJS
				? {
						title: 'Projects',
						bookmarks: [
							{
								name: 'Conform',
								url: 'https://conform.guide',
							},
							{
								name: 'Super cool website',
								url: 'https://remix.guide',
							},
						],
					}
				: {
						title: 'Test',
						bookmarks: [null, null],
					},
			value: {
				title: 'Projects',
				bookmarks: [
					{
						name: 'Conform',
						url: 'https://conform.guide',
					},
					{
						name: 'Super cool website',
						url: 'https://remix.guide',
					},
				],
				file: 'example.txt (11 bytes)',
				files: ['example.json (29 bytes)', 'example.yaml (22 bytes)'],
			},
			dirty: true,
			valid: false,
			allErrors: {
				files: ['Only JSON file is accepted'],
			},
		},
		title: {
			initialValue: options.noJS ? 'Projects' : 'Test',
			value: 'Projects',
			dirty: true,
			valid: true,
			allErrors: {},
		},
		bookmarks: {
			initialValue: options.noJS
				? [
						{
							name: 'Conform',
							url: 'https://conform.guide',
						},
						{
							name: 'Super cool website',
							url: 'https://remix.guide',
						},
					]
				: [null, null],
			value: [
				{
					name: 'Conform',
					url: 'https://conform.guide',
				},
				{
					name: 'Super cool website',
					url: 'https://remix.guide',
				},
			],
			dirty: true,
			valid: true,
			allErrors: {},
		},
		'bookmarks[0]': {
			initialValue: options.noJS
				? { name: 'Conform', url: 'https://conform.guide' }
				: undefined,
			value: {
				name: 'Conform',
				url: 'https://conform.guide',
			},
			dirty: true,
			valid: true,
			allErrors: {},
		},
		'bookmarks[1]': {
			initialValue: options.noJS
				? { name: 'Super cool website', url: 'https://remix.guide' }
				: undefined,
			value: {
				name: 'Super cool website',
				url: 'https://remix.guide',
			},
			dirty: true,
			valid: true,
			allErrors: {},
		},
		file: {
			value: 'example.txt (11 bytes)',
			dirty: true,
			valid: true,
			allErrors: {},
		},
		files: {
			value: ['example.json (29 bytes)', 'example.yaml (22 bytes)'],
			dirty: true,
			valid: false,
			errors: ['Only JSON file is accepted'],
			allErrors: {
				files: ['Only JSON file is accepted'],
			},
		},
	});
}

test.describe('With JS', () => {
	test('Client Validation', async ({ page }) => {
		await page.goto('/metadata');
		await validateMetadata(page, {
			clientValidate: true,
		});
	});

	test('Server Validation', async ({ page }) => {
		await page.goto('/metadata?noClientValidate=yes');
		await validateMetadata(page, {
			clientValidate: false,
		});
	});
});

test.describe('No JS', () => {
	test.use({ javaScriptEnabled: false });

	test('Validation', async ({ page }) => {
		await page.goto('/metadata');
		await validateMetadata(page, {
			noJS: true,
		});
	});
});
