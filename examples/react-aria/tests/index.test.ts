import { expect, test, type Page } from '@playwright/test';

test.describe('react-aria', () => {
	async function getForm(page: Page, searchParams?: URLSearchParams) {
		await page.goto(searchParams ? `/?${searchParams}` : '/');
		const form = page.locator('form');
		const date = form.getByLabel('Publish Date').first();
		const range = form.getByLabel('Event Dates').first();
		const topics = form.getByLabel('Topics').first();
		const profileInput = form.locator('input[type="file"][name="profile"]');

		return {
			form,
			heading: page.getByRole('heading', {
				name: 'React Aria Components Example',
			}),
			email: form.getByLabel('Email', { exact: true }),
			price: form.getByLabel('Price').and(form.locator('input')),
			language: form.getByLabel('Language'),
			languageOption: (name: string) =>
				form.getByText(name, { exact: true }).getByRole('radio'),
			async selectLanguage(name: string) {
				await form.getByText(name, { exact: true }).click();
			},
			colors: form.getByLabel('Colors'),
			colorOption: (name: string) =>
				form.getByRole('checkbox', { name, exact: true }),
			async toggleColor(name: string) {
				await form.getByRole('checkbox', { name, exact: true }).press('Space');
			},
			date,
			async setDate(value: string) {
				await date.getByRole('spinbutton').first().click();
				await date.pressSequentially(value);
			},
			getDateText() {
				return date.locator('.react-aria-DateInput').innerText();
			},
			range,
			async setRange(value: string) {
				await range.getByRole('spinbutton').first().click();
				await range.pressSequentially(value);
			},
			getRangeText() {
				return range.locator('.react-aria-DateInput').allInnerTexts();
			},
			category: form.getByLabel('Category').and(form.locator('button')),
			async selectCategory(name: string) {
				await form.getByLabel('Category').and(form.locator('button')).click();
				await page.getByRole('option', { name, exact: true }).click();
			},
			author: form.getByLabel('Author').first(),
			async setAuthor(value: string) {
				await form.getByLabel('Author').first().fill(value);
				await form.getByLabel('Author').first().press('Escape');
			},
			topics,
			selectedTopics: form.locator('.selected-values'),
			async chooseTopic(name: string) {
				await topics.focus();
				await topics.press('ArrowDown');
				const option = page.getByRole('option', { name, exact: true });
				await option.waitFor();
				await option.click();
			},
			profile: form.getByLabel('Profile'),
			profileInput,
			async uploadProfile(file: {
				name: string;
				mimeType: string;
				buffer: Buffer;
			}) {
				await profileInput.setInputFiles(file);
			},
			notifications: form.getByRole('switch', {
				name: 'Email notifications',
			}),
			acceptTerms: form.getByRole('checkbox', {
				name: 'Accept Terms and Conditions',
			}),
			resetButton: form.getByRole('button', { name: 'Reset' }),
			submitButton: form.getByRole('button', { name: 'Submit' }),
			submittedValue: () =>
				form
					.getByTestId('submitted-value')
					.innerText()
					.then((value) => JSON.parse(value)),
			submittedFormData: () =>
				form
					.getByTestId('submitted-form-data')
					.innerText()
					.then((value) => JSON.parse(value)),
		};
	}

	test('validation and submission', async ({ page }) => {
		const controls = await getForm(page);

		await controls.email.focus();
		await controls.heading.click();
		await expect(controls.email).toHaveAccessibleDescription(
			'Email is required',
		);
		await controls.email.fill('hello@example.com');

		await controls.submitButton.click();
		await expect(controls.price).toBeFocused();
		await expect(controls.price).toHaveAccessibleDescription(
			'Price is required',
		);
		await controls.price.fill('12345.67');

		await controls.submitButton.click();
		await expect(controls.language.getByRole('radio').first()).toBeFocused();
		await expect(controls.language).toHaveAccessibleDescription(
			/Choose a supported language/,
		);
		await controls.selectLanguage('English');

		await controls.submitButton.click();
		await expect(controls.colorOption('Red')).toBeFocused();
		await expect(controls.colors).toHaveAccessibleDescription(
			'Choose at least one color',
		);
		await controls.toggleColor('Red');

		await controls.submitButton.click();
		await expect(controls.date.getByRole('spinbutton').first()).toBeFocused();
		await expect(
			controls.date.getByRole('spinbutton').first(),
		).toHaveAccessibleDescription('Publish date is required');
		await controls.setDate('04012025123456p');

		await controls.submitButton.click();
		await expect(controls.range.getByRole('spinbutton').first()).toBeFocused();
		await expect(
			controls.range.getByRole('spinbutton').first(),
		).toHaveAccessibleDescription('Event dates are required');
		await controls.setRange('0501202505312025');

		await controls.submitButton.click();
		await expect(controls.category).toBeFocused();
		await expect(controls.category).toHaveAccessibleDescription(
			'Category is required',
		);
		await controls.selectCategory('Announcement');

		await controls.submitButton.click();
		await expect(controls.author).toBeFocused();
		await expect(controls.author).toHaveAccessibleDescription(
			'Author is required',
		);
		await controls.setAuthor('edmundhung');

		await controls.submitButton.click();
		await expect(controls.topics).toBeFocused();
		await expect(controls.topics).toHaveAccessibleDescription(
			/Choose at least one topic/,
		);
		await controls.chooseTopic('Accessibility');
		await controls.chooseTopic('Forms');
		await controls.topics.press('Escape');

		await controls.submitButton.click();
		await expect(controls.profile).toBeFocused();
		await expect(controls.profile).toHaveAccessibleDescription(
			'Profile picture is required',
		);
		await controls.uploadProfile({
			name: 'avatar.txt',
			buffer: Buffer.from('Hello World'),
			mimeType: 'text/plain',
		});

		await controls.submitButton.click();
		await expect(controls.notifications).toBeFocused();
		await expect(controls.notifications).toHaveAccessibleDescription(
			/Choose whether to get notifications/,
		);
		await controls.notifications.press('Space');

		await controls.submitButton.click();
		await expect(controls.acceptTerms).toBeFocused();
		await expect(controls.acceptTerms).toHaveAccessibleDescription(
			/Accept the terms to continue/,
		);
		await controls.acceptTerms.press('Space');
		await controls.submitButton.click();

		await expect.poll(controls.submittedValue).toEqual({
			email: 'hello@example.com',
			price: 12345.67,
			language: 'en',
			colors: ['red'],
			date: '2025-04-01T12:34:56.000Z',
			range: {
				start: '2025-05-01',
				end: '2025-05-31',
			},
			category: 'announcement',
			author: 'edmundhung',
			topics: ['accessibility', 'forms'],
			profile: {
				name: 'avatar.txt',
				size: 11,
				type: 'text/plain',
			},
			notifications: true,
			acceptTerms: true,
		});
		await expect.poll(controls.submittedFormData).toEqual([
			['email', 'hello@example.com'],
			['price', '12345.67'],
			['language', 'en'],
			['colors', 'red'],
			['date', '2025-04-01T12:34:56'],
			['range.start', '2025-05-01'],
			['range.end', '2025-05-31'],
			['category', 'announcement'],
			['author', 'edmundhung'],
			['topics', 'accessibility'],
			['topics', 'forms'],
			['profile', 'avatar.txt'],
			['notifications', 'on'],
			['acceptTerms', 'on'],
		]);
	});

	test('handles malformed date defaults', async ({ page }) => {
		const defaults = new URLSearchParams([
			['date', 'not-a-date'],
			['range.start', '2025-13-01'],
			['range.end', '2025-02-31'],
		]);
		const controls = await getForm(page, defaults);

		await expect(controls.heading).toBeVisible();
		await expect(controls.date.getByRole('spinbutton').first()).toBeVisible();
		await expect(controls.range.getByRole('spinbutton').first()).toBeVisible();
	});

	test('updated defaults and reset', async ({ page }) => {
		const defaults = new URLSearchParams([
			['email', 'default@example.com'],
			['price', '10'],
			['language', 'en'],
			['date', '2025-04-01T12:34:56'],
			['range.start', '2025-05-01'],
			['range.end', '2025-05-31'],
			['category', 'guide'],
			['author', 'edmundhung'],
		]);
		const controls = await getForm(page, defaults);

		await controls.email.fill('submitted@example.com');
		await controls.price.fill('20');
		await controls.selectLanguage('Japanese');
		await controls.toggleColor('Blue');
		await controls.setDate('06022025010203p');
		await controls.setRange('0701202507152025');
		await controls.selectCategory('Announcement');
		await controls.setAuthor('chimame');
		await controls.chooseTopic('Forms');
		await controls.chooseTopic('Validation');
		await controls.topics.press('Escape');
		await controls.uploadProfile({
			name: 'submitted.txt',
			buffer: Buffer.from('submitted'),
			mimeType: 'text/plain',
		});
		await controls.notifications.press('Space');
		await controls.acceptTerms.press('Space');
		await controls.submitButton.click();

		await expect.poll(controls.submittedValue).toMatchObject({
			email: 'submitted@example.com',
			price: 20,
			language: 'ja',
			colors: ['blue'],
			date: '2025-06-02T13:02:03.000Z',
			range: { start: '2025-07-01', end: '2025-07-15' },
			category: 'announcement',
			author: 'chimame',
			topics: ['forms', 'validation'],
			profile: { name: 'submitted.txt', size: 9, type: 'text/plain' },
			notifications: true,
			acceptTerms: true,
		});

		await controls.email.fill('changed@example.com');
		await controls.price.fill('99');
		await controls.selectLanguage('German');
		await controls.toggleColor('Green');
		await controls.setDate('08032025040506a');
		await controls.setRange('0901202509302025');
		await controls.selectCategory('Blog');
		await controls.setAuthor('changed');
		await controls.chooseTopic('Accessibility');
		await controls.topics.press('Escape');
		await controls.uploadProfile({
			name: 'changed.txt',
			buffer: Buffer.from('changed'),
			mimeType: 'text/plain',
		});
		await controls.notifications.press('Space');
		await controls.acceptTerms.press('Space');
		await controls.resetButton.click();

		await expect(controls.email).toHaveValue('submitted@example.com');
		await expect(controls.price).toHaveValue('20');
		await expect(controls.languageOption('Japanese')).toBeChecked();
		await expect(controls.colorOption('Blue')).toBeChecked();
		await expect(controls.colorOption('Green')).not.toBeChecked();
		await expect.poll(controls.getDateText).toContain('6/2/2025');
		await expect
			.poll(controls.getRangeText)
			.toEqual([
				expect.stringContaining('7/1/2025'),
				expect.stringContaining('7/15/2025'),
			]);
		await expect(controls.category).toContainText('Announcement');
		await expect(controls.author).toHaveValue('chimame');
		await expect(controls.selectedTopics).toContainText('Forms');
		await expect(controls.selectedTopics).toContainText('Validation');
		await expect(controls.selectedTopics).not.toContainText('Accessibility');
		await expect(controls.notifications).toBeChecked();
		await expect(controls.acceptTerms).toBeChecked();
		await expect
			.poll(() =>
				controls.profileInput.evaluate(
					(input: HTMLInputElement) => input.files?.length ?? 0,
				),
			)
			.toBe(0);
		await expect(controls.form.getByText(/\.txt \(\d+ bytes\)/)).toHaveCount(0);

		await controls.uploadProfile({
			name: 'reset.txt',
			buffer: Buffer.from('reset'),
			mimeType: 'text/plain',
		});
		await controls.submitButton.click();

		await expect.poll(controls.submittedValue).toEqual({
			email: 'submitted@example.com',
			price: 20,
			language: 'ja',
			colors: ['blue'],
			date: '2025-06-02T13:02:03.000Z',
			range: { start: '2025-07-01', end: '2025-07-15' },
			category: 'announcement',
			author: 'chimame',
			topics: ['forms', 'validation'],
			profile: { name: 'reset.txt', size: 5, type: 'text/plain' },
			notifications: true,
			acceptTerms: true,
		});
	});
});
