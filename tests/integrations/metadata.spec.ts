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
	};
}

async function validateMetadata(page: Page, noJS?: boolean) {
	const playground = getPlayground(page);
	const fieldset = getFieldset(playground.container);

	await expect.poll(playground.result).toEqual({
		form: {
			initialValue: {
				bookmarks: [null, null],
			},
			value: {
				bookmarks: [null, null],
			},
			dirty: false,
			valid: true,
			allValid: true,
			allErrors: {},
		},
		title: {
			dirty: false,
			valid: true,
			allValid: true,
			allErrors: {},
		},
		bookmarks: {
			initialValue: [null, null],
			value: [null, null],
			dirty: false,
			valid: true,
			allValid: true,
			allErrors: {},
		},
		'bookmarks[0]': {
			dirty: false,
			valid: true,
			allValid: true,
			allErrors: {},
		},
		'bookmarks[1]': {
			dirty: false,
			valid: true,
			allValid: true,
			allErrors: {},
		},
	});

	await playground.submit.click();
	await expect.poll(playground.result).toEqual({
		form: {
			status: 'error',
			initialValue: {
				bookmarks: [null, null],
			},
			value: {
				bookmarks: [null, null],
			},
			dirty: false,
			valid: true,
			allValid: false,
			allErrors: {
				title: ['Title is required'],
				'bookmarks[0].name': ['Name is required'],
				'bookmarks[0].url': ['Url is required'],
				'bookmarks[1].name': ['Name is required'],
				'bookmarks[1].url': ['Url is required'],
			},
		},
		title: {
			dirty: false,
			valid: false,
			errors: ['Title is required'],
			allValid: false,
			allErrors: {
				title: ['Title is required'],
			},
		},
		bookmarks: {
			initialValue: [null, null],
			value: [null, null],
			dirty: false,
			valid: true,
			allValid: false,
			allErrors: {
				'bookmarks[0].name': ['Name is required'],
				'bookmarks[0].url': ['Url is required'],
				'bookmarks[1].name': ['Name is required'],
				'bookmarks[1].url': ['Url is required'],
			},
		},
		'bookmarks[0]': {
			dirty: false,
			valid: true,
			allValid: false,
			allErrors: {
				'bookmarks[0].name': ['Name is required'],
				'bookmarks[0].url': ['Url is required'],
			},
		},
		'bookmarks[1]': {
			dirty: false,
			valid: true,
			allValid: false,
			allErrors: {
				'bookmarks[1].name': ['Name is required'],
				'bookmarks[1].url': ['Url is required'],
			},
		},
	});

	await fieldset.title.fill('Projects');
	if (!noJS) {
		await expect.poll(playground.result).toEqual({
			form: {
				status: 'error',
				initialValue: {
					bookmarks: [null, null],
				},
				value: {
					title: 'Projects',
					bookmarks: [null, null],
				},
				dirty: true,
				valid: true,
				allValid: false,
				allErrors: {
					title: ['Title is required'],
					'bookmarks[0].name': ['Name is required'],
					'bookmarks[0].url': ['Url is required'],
					'bookmarks[1].name': ['Name is required'],
					'bookmarks[1].url': ['Url is required'],
				},
			},
			title: {
				value: 'Projects',
				dirty: true,
				valid: false,
				errors: ['Title is required'],
				allValid: false,
				allErrors: {
					title: ['Title is required'],
				},
			},
			bookmarks: {
				initialValue: [null, null],
				value: [null, null],
				dirty: false,
				valid: true,
				allValid: false,
				allErrors: {
					'bookmarks[0].name': ['Name is required'],
					'bookmarks[0].url': ['Url is required'],
					'bookmarks[1].name': ['Name is required'],
					'bookmarks[1].url': ['Url is required'],
				},
			},
			'bookmarks[0]': {
				dirty: false,
				valid: true,
				allValid: false,
				allErrors: {
					'bookmarks[0].name': ['Name is required'],
					'bookmarks[0].url': ['Url is required'],
				},
			},
			'bookmarks[1]': {
				dirty: false,
				valid: true,
				allValid: false,
				allErrors: {
					'bookmarks[1].name': ['Name is required'],
					'bookmarks[1].url': ['Url is required'],
				},
			},
		});
	}

	await playground.submit.click();
	await expect.poll(playground.result).toEqual({
		form: {
			status: 'error',
			initialValue: {
				title: noJS ? 'Projects' : undefined,
				bookmarks: [null, null],
			},
			value: {
				title: 'Projects',
				bookmarks: [null, null],
			},
			dirty: true,
			valid: true,
			allValid: false,
			allErrors: {
				'bookmarks[0].name': ['Name is required'],
				'bookmarks[0].url': ['Url is required'],
				'bookmarks[1].name': ['Name is required'],
				'bookmarks[1].url': ['Url is required'],
			},
		},
		title: {
			initialValue: noJS ? 'Projects' : undefined,
			value: 'Projects',
			dirty: true,
			valid: true,
			allValid: true,
			allErrors: {},
		},
		bookmarks: {
			initialValue: [null, null],
			value: [null, null],
			dirty: false,
			valid: true,
			allValid: false,
			allErrors: {
				'bookmarks[0].name': ['Name is required'],
				'bookmarks[0].url': ['Url is required'],
				'bookmarks[1].name': ['Name is required'],
				'bookmarks[1].url': ['Url is required'],
			},
		},
		'bookmarks[0]': {
			dirty: false,
			valid: true,
			allValid: false,
			allErrors: {
				'bookmarks[0].name': ['Name is required'],
				'bookmarks[0].url': ['Url is required'],
			},
		},
		'bookmarks[1]': {
			dirty: false,
			valid: true,
			allValid: false,
			allErrors: {
				'bookmarks[1].name': ['Name is required'],
				'bookmarks[1].url': ['Url is required'],
			},
		},
	});

	await fieldset.bookmarks[0].name.fill('Conform');
	await playground.submit.click();
	await expect.poll(playground.result).toEqual({
		form: {
			status: 'error',
			initialValue: noJS
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
			valid: true,
			allValid: false,
			allErrors: {
				'bookmarks[0].url': ['Url is required'],
				'bookmarks[1].name': ['Name is required'],
				'bookmarks[1].url': ['Url is required'],
			},
		},
		title: {
			initialValue: noJS ? 'Projects' : undefined,
			value: 'Projects',
			dirty: true,
			valid: true,
			allValid: true,
			allErrors: {},
		},
		bookmarks: {
			initialValue: noJS
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
			valid: true,
			allValid: false,
			allErrors: {
				'bookmarks[0].url': ['Url is required'],
				'bookmarks[1].name': ['Name is required'],
				'bookmarks[1].url': ['Url is required'],
			},
		},
		'bookmarks[0]': {
			initialValue: noJS ? { name: 'Conform' } : undefined,
			value: {
				name: 'Conform',
			},
			dirty: true,
			valid: true,
			allValid: false,
			allErrors: {
				'bookmarks[0].url': ['Url is required'],
			},
		},
		'bookmarks[1]': {
			dirty: false,
			valid: true,
			allValid: false,
			allErrors: {
				'bookmarks[1].name': ['Name is required'],
				'bookmarks[1].url': ['Url is required'],
			},
		},
	});

	await fieldset.bookmarks[0].url.fill('https://conform.guide');
	await playground.submit.click();
	await expect.poll(playground.result).toEqual({
		form: {
			status: 'error',
			initialValue: noJS
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
			valid: true,
			allValid: false,
			allErrors: {
				'bookmarks[1].name': ['Name is required'],
				'bookmarks[1].url': ['Url is required'],
			},
		},
		title: {
			initialValue: noJS ? 'Projects' : undefined,
			value: 'Projects',
			dirty: true,
			valid: true,
			allValid: true,
			allErrors: {},
		},
		bookmarks: {
			initialValue: noJS
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
			valid: true,
			allValid: false,
			allErrors: {
				'bookmarks[1].name': ['Name is required'],
				'bookmarks[1].url': ['Url is required'],
			},
		},
		'bookmarks[0]': {
			initialValue: noJS
				? { name: 'Conform', url: 'https://conform.guide' }
				: undefined,
			value: {
				name: 'Conform',
				url: 'https://conform.guide',
			},
			dirty: true,
			valid: true,
			allValid: true,
			allErrors: {},
		},
		'bookmarks[1]': {
			dirty: false,
			valid: true,
			allValid: false,
			allErrors: {
				'bookmarks[1].name': ['Name is required'],
				'bookmarks[1].url': ['Url is required'],
			},
		},
	});

	await fieldset.bookmarks[1].name.fill('Super cool website');
	await fieldset.bookmarks[1].url.fill('https://conform.guide');
	await playground.submit.click();
	await expect.poll(playground.result).toEqual({
		form: {
			status: 'error',
			initialValue: noJS
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
			valid: true,
			allValid: false,
			allErrors: {
				bookmarks: ['Bookmark URLs are repeated'],
			},
		},
		title: {
			initialValue: noJS ? 'Projects' : undefined,
			value: 'Projects',
			dirty: true,
			valid: true,
			allValid: true,
			allErrors: {},
		},
		bookmarks: {
			initialValue: noJS
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
			allValid: false,
			allErrors: {
				bookmarks: ['Bookmark URLs are repeated'],
			},
		},
		'bookmarks[0]': {
			initialValue: noJS
				? { name: 'Conform', url: 'https://conform.guide' }
				: undefined,
			value: {
				name: 'Conform',
				url: 'https://conform.guide',
			},
			dirty: true,
			valid: true,
			allValid: true,
			allErrors: {},
		},
		'bookmarks[1]': {
			initialValue: noJS
				? { name: 'Super cool website', url: 'https://conform.guide' }
				: undefined,
			value: {
				name: 'Super cool website',
				url: 'https://conform.guide',
			},
			dirty: true,
			valid: true,
			allValid: true,
			allErrors: {},
		},
	});

	await fieldset.bookmarks[1].url.fill('https://remix.guide');
	await playground.submit.click();
	await expect.poll(playground.result).toEqual({
		form: {
			status: 'success',
			initialValue: noJS
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
			valid: true,
			allValid: true,
			allErrors: {},
		},
		title: {
			initialValue: noJS ? 'Projects' : undefined,
			value: 'Projects',
			dirty: true,
			valid: true,
			allValid: true,
			allErrors: {},
		},
		bookmarks: {
			initialValue: noJS
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
			allValid: true,
			allErrors: {},
		},
		'bookmarks[0]': {
			initialValue: noJS
				? { name: 'Conform', url: 'https://conform.guide' }
				: undefined,
			value: {
				name: 'Conform',
				url: 'https://conform.guide',
			},
			dirty: true,
			valid: true,
			allValid: true,
			allErrors: {},
		},
		'bookmarks[1]': {
			initialValue: noJS
				? { name: 'Super cool website', url: 'https://remix.guide' }
				: undefined,
			value: {
				name: 'Super cool website',
				url: 'https://remix.guide',
			},
			dirty: true,
			valid: true,
			allValid: true,
			allErrors: {},
		},
	});
}

test.describe('With JS', () => {
	test('Client Validation', async ({ page }) => {
		await page.goto('/metadata');
		await validateMetadata(page);
	});

	test('Server Validation', async ({ page }) => {
		await page.goto('/metadata?noClientValidate=yes');
		await validateMetadata(page);
	});
});

test.describe('No JS', () => {
	test.use({ javaScriptEnabled: false });

	test('Validation', async ({ page }) => {
		await page.goto('/metadata');
		await validateMetadata(page, true);
	});
});
