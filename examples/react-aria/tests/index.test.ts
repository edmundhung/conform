import { test, expect, Page } from '@playwright/test';

test.describe('react-aria', () => {
	async function getForm(page: Page, searchParams?: URLSearchParams) {
		await page.goto(`/?${searchParams}`);

		return {
			container: page.locator('form'),
			heading: page.getByText('React Aria Example'),
			submitButton: page.locator('form').getByText('Submit'),
			resetButton: page.locator('form').getByText('Reset'),
			submittedValue: () =>
				page.locator('form').locator('pre').innerText().then(JSON.parse),
			email: page.locator('form').getByLabel('Email'),
			price: page
				.locator('form')
				.getByLabel('Price')
				.and(page.locator('form').locator('input')),
			language: page.locator('form').getByLabel('Language'),
			colors: page.locator('form').getByLabel('Colors'),
			date: page.locator('form').getByLabel('Publish Date').first(),
			range: page.locator('form').getByLabel('Event Dates').first(),
			category: page
				.locator('form')
				.getByLabel('Category')
				.and(page.locator('button')),
			author: page.locator('form').getByLabel('Author').first(),
			profile: page.locator('form').getByLabel('Profile'),
			acceptTerms: page
				.locator('form')
				.getByLabel('Accept Terms and Conditions'),
		};
	}

	test('focus', async ({ page }) => {
		const form = await getForm(page);

		await form.submitButton.click();
		await expect(form.email).toBeFocused();
		await form.email.fill('hello@example.com');
		await form.submitButton.click();
		await expect(form.price).toBeFocused();
		await form.price.fill('12345.67');
		await form.submitButton.click();
		await expect(form.language.getByRole('radio').first()).toBeFocused();
		await form.container.press('Enter');
		await form.submitButton.click();
		await expect(form.colors.getByRole('checkbox').first()).toBeFocused();
		await form.container.press('Enter');
		await form.submitButton.click();
		await expect(form.date.getByRole('spinbutton').first()).toBeFocused();
		await form.date.pressSequentially('04012025123456p');
		await form.submitButton.click();
		await expect(form.range.getByRole('spinbutton').first()).toBeFocused();
		await form.range.pressSequentially('0501202505312025');
		await form.submitButton.click();
		await expect(form.category).toBeFocused();
		await form.container.press('Enter');
		await form.container.press('Enter');
		await form.submitButton.click();
		await expect(form.author).toBeFocused();
		await form.container.press('ArrowDown');
		await form.container.press('Enter');
		await form.submitButton.click();
		await expect(form.profile).toBeFocused();
		await form.container.locator('input[name="profile"]').setInputFiles({
			name: 'example.txt',
			buffer: Buffer.from('Hello World'),
			mimeType: 'text/plain',
		});
		await form.submitButton.click();
		await expect(form.acceptTerms).toBeFocused();
		await form.container.getByText('Accept Terms and Conditions').click();
		await form.submitButton.click();

		await expect.poll(form.submittedValue).toEqual({
			email: 'hello@example.com',
			price: 12345.67,
			language: 'en',
			colors: ['red'],
			date: '2025-04-01T12:34:56.000Z',
			range: {
				end: '2025-05-31',
				start: '2025-05-01',
			},
			category: 'announcement',
			author: 'edmundhung',
			profile: {},
			acceptTerms: true,
		});
	});

	test('blur', async ({ page }) => {
		const form = await getForm(page);

		await form.email.click();
		await expect(form.email).toHaveAccessibleDescription('');
		await form.heading.click();
		await expect(form.email).toHaveAccessibleDescription('Required');

		await form.price.click();
		await expect(form.price).toHaveAccessibleDescription('');
		await form.heading.click();
		await expect(form.price).toHaveAccessibleDescription('Required');

		await form.container.getByText('Invalid').click();
		await expect(form.language).toHaveAccessibleDescription('');
		await form.heading.click();
		await expect(form.language).toHaveAccessibleDescription(
			`Invalid enum value. Expected 'en' | 'de' | 'ja', received 'invalid'`,
		);

		await form.container.getByText('Green').click();
		await expect(form.colors).toHaveAccessibleDescription('');
		await form.container.getByText('Green').click();
		await expect(form.colors).toHaveAccessibleDescription(
			'Array must contain at least 1 element(s)',
		);

		await form.date.click();
		await expect(form.date).toHaveAccessibleDescription('');
		await form.heading.click();
		await expect(form.date).toHaveAccessibleDescription('Required');

		await form.range.click();
		await expect(form.range).toHaveAccessibleDescription('');
		await form.heading.click();
		await expect(form.range).toHaveAccessibleDescription('Required');

		await form.category.click();
		await expect(form.category).toHaveAccessibleDescription('');
		await form.category.press('Escape');
		await form.heading.click();
		await expect(form.category).toHaveAccessibleDescription('Required');

		await form.author.click();
		await expect(form.author).toHaveAccessibleDescription('');
		await form.heading.click();
		await expect(form.author).toHaveAccessibleDescription('Required');

		await form.profile.click();
		await expect(form.profile).toHaveAccessibleDescription('');
		await form.heading.click();
		await expect(form.profile).toHaveAccessibleDescription('Required');

		await form.container.getByText('Accept Terms and Conditions').click();
		await expect(form.acceptTerms).not.toHaveAttribute('aria-invalid', 'true');
		await form.container.getByText('Accept Terms and Conditions').click();
		await expect(form.acceptTerms).toHaveAttribute('aria-invalid', 'true');
	});

	test('reset', async ({ page }) => {
		const form = await getForm(page);

		await form.email.fill('hello@example.com');
		await form.price.fill('12345.67');
		await form.container.getByText('Japanese').click();
		await form.container.getByText('Blue').click();
		await form.container.getByText('Red').click();
		await form.date.pressSequentially('01012025123456');
		await form.range.pressSequentially('0101202501022025');
		await form.category.click();
		await page.getByRole('option', { name: 'Blog' }).click();
		await form.author.fill('test');
		await form.container.locator('input[name="profile"]').setInputFiles({
			name: 'example.txt',
			buffer: Buffer.from('Hello World'),
			mimeType: 'text/plain',
		});
		await form.container.getByText('Accept Terms and Conditions').click();

		await expect(form.email).toHaveAccessibleDescription('');
		await expect(form.price).toHaveAccessibleDescription('');
		await expect(form.language).toHaveAccessibleDescription('');
		await expect(form.colors).toHaveAccessibleDescription('');
		await expect(form.date).toHaveAccessibleDescription('');
		await expect(form.range).toHaveAccessibleDescription('');
		await expect(form.category).toHaveAccessibleDescription('');
		await expect(form.author).toHaveAccessibleDescription('');
		await expect(form.profile).toHaveAccessibleDescription('');
		await expect(form.acceptTerms).not.toHaveAttribute('aria-invalid', 'true');

		await form.resetButton.click();
		await form.submitButton.click();

		await expect(form.email).toHaveAccessibleDescription('Required');
		await expect(form.price).toHaveAccessibleDescription('Required');
		await expect(form.language).toHaveAccessibleDescription('Required');
		await expect(form.colors).toHaveAccessibleDescription(
			'Array must contain at least 1 element(s)',
		);
		await expect(form.date).toHaveAccessibleDescription('Required');
		await expect(form.range).toHaveAccessibleDescription('Required');
		await expect(form.category).toHaveAccessibleDescription('Required');
		await expect(form.author).toHaveAccessibleDescription('Required');
		await expect(form.profile).toHaveAccessibleDescription('Required');
		await expect(form.acceptTerms).toHaveAttribute('aria-invalid', 'true');
	});

	test('default value', async ({ page }) => {
		const searchParams = new URLSearchParams([
			['email', 'hello@example.com'],
			['price', '12345.67'],
			['language', 'en'],
			['colors', 'red'],
			['colors', 'blue'],
			['date', '2025-04-01T00:00:00'],
			['range.start', '2025-05-01'],
			['range.end', '2025-05-31'],
			['category', 'guide'],
			['author', 'edmund'],
			['acceptTerms', 'on'],
		]);
		const form = await getForm(page, searchParams);

		await form.submitButton.click();
		await expect(form.profile).toHaveAccessibleDescription('Required');
		await form.container.locator('input[name="profile"]').setInputFiles({
			name: 'example.txt',
			buffer: Buffer.from('Hello World'),
			mimeType: 'text/plain',
		});
		await expect(form.profile).toHaveAccessibleDescription('');

		await form.submitButton.click();
		await expect.poll(form.submittedValue).toEqual({
			email: 'hello@example.com',
			price: 12345.67,
			language: 'en',
			colors: ['red', 'blue'],
			date: '2025-04-01T00:00:00.000Z',
			range: {
				start: '2025-05-01',
				end: '2025-05-31',
			},
			category: 'guide',
			author: 'edmund',
			profile: {},
			acceptTerms: true,
		});

		await form.email.fill('test@example.com');
		await form.price.fill('9.87');
		await form.container.getByText('Japanese').click();
		await form.container.getByText('Red').click(); // Uncheck red
		await form.date.pressSequentially('01012025123456');
		await form.range.pressSequentially('0101202501022025');
		await form.category.click();
		await page.getByRole('option', { name: 'Announcement' }).click();
		await form.author.fill('test');
		await form.container.getByText('Accept Terms and Conditions').click();

		await form.resetButton.click();

		// We do not persist the file input value, so it will be empty
		await form.container.locator('input[name="profile"]').setInputFiles({
			name: 'example.txt',
			buffer: Buffer.from('Hello World'),
			mimeType: 'text/plain',
		});

		await form.submitButton.click();
		await expect.poll(form.submittedValue).toEqual({
			email: 'hello@example.com',
			price: 12345.67,
			language: 'en',
			colors: ['red', 'blue'],
			date: '2025-04-01T00:00:00.000Z',
			range: {
				start: '2025-05-01',
				end: '2025-05-31',
			},
			category: 'guide',
			author: 'edmund',
			profile: {},
			acceptTerms: true,
		});
	});
});
