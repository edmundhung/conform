import { test, expect, type Page } from '@playwright/test';

test.describe('react-aria', () => {
	test.describe('form', () => {
		async function getForm(page: Page, searchParams = new URLSearchParams()) {
			await page.goto(`/?${searchParams}`);

			const container = page.locator('form');

			return {
				container,
				heading: page.getByText('React Aria Example'),
				submitButton: container.getByRole('button', { name: 'Submit' }),
				resetButton: container.getByRole('button', { name: 'Reset' }),
				submittedValue: () =>
					container.getByTestId('submitted-value').innerText().then(JSON.parse),
				submittedFormData: () =>
					container
						.getByTestId('submitted-form-data')
						.innerText()
						.then(JSON.parse),
				email: container.getByLabel('Email', { exact: true }),
				price: container.getByLabel('Price').and(container.locator('input')),
				language: container.getByLabel('Language'),
				colors: container.getByLabel('Colors'),
				date: container.getByLabel('Publish Date').first(),
				range: container.getByLabel('Event Dates').first(),
				category: container
					.getByLabel('Category')
					.and(container.locator('button')),
				author: container.getByLabel('Author').first(),
				topics: container.getByLabel('Topics').first(),
				topicOption: (name: string) => page.getByRole('option', { name }),
				topicsControl: container.locator('select[name="topics"]'),
				selectedTopics: container.locator('.selected-values'),
				profile: container.getByLabel('Profile'),
				profileInput: container.locator('input[name="profile"]'),
				notifications: container.getByRole('switch', {
					name: 'Email notifications',
				}),
				acceptTerms: container.getByRole('checkbox', {
					name: 'Accept Terms and Conditions',
				}),
			};
		}

		async function chooseTopic(
			form: Awaited<ReturnType<typeof getForm>>,
			name: string,
			isSelected = true,
		) {
			await expect
				.poll(async () => {
					if ((await form.topics.getAttribute('aria-expanded')) !== 'true') {
						await form.topics.press('ArrowDown');
					}

					return form.topics.getAttribute('aria-expanded');
				})
				.toBe('true');
			const option = form.topicOption(name);

			await expect(option).toBeVisible();
			await option.click();
			if (isSelected) {
				await expect(form.selectedTopics).toContainText(name);
			} else {
				await expect(form.selectedTopics).not.toContainText(name);
			}
		}

		async function fillRequiredFields(
			page: Page,
			form: Awaited<ReturnType<typeof getForm>>,
		) {
			await form.email.fill('hello@example.com');
			await form.price.fill('12345.67');
			await form.container.getByText('English', { exact: true }).click();
			await form.colors.getByRole('checkbox').first().press('Space');
			await form.date.getByRole('spinbutton').first().click();
			await form.date.pressSequentially('04012025123456p');
			await form.range.getByRole('spinbutton').first().click();
			await form.range.pressSequentially('0501202505312025');
			await form.category.click();
			await page.getByRole('option', { name: 'Announcement' }).click();
			await form.author.fill('edmundhung');
			await form.author.press('Escape');
			await chooseTopic(form, 'Accessibility');
			await chooseTopic(form, 'Forms');
			await form.topics.press('Escape');
			await form.profileInput.setInputFiles({
				name: 'avatar.txt',
				buffer: Buffer.from('Hello World'),
				mimeType: 'text/plain',
			});
			await form.notifications.press('Space');
			await form.acceptTerms.press('Space');
		}

		test('focuses each invalid integration and submits', async ({ page }) => {
			const form = await getForm(page);

			await form.submitButton.click();
			await expect(form.email).toBeFocused();
			await form.email.fill('hello@example.com');
			await form.submitButton.click();
			await expect(form.price).toBeFocused();
			await form.price.fill('12345.67');
			await form.submitButton.click();
			await expect(form.language.getByRole('radio').first()).toBeFocused();
			await form.container.getByText('English', { exact: true }).click();
			await form.submitButton.click();
			await expect(form.colors.getByRole('checkbox').first()).toBeFocused();
			await form.colors.getByRole('checkbox').first().press('Space');
			await form.submitButton.click();
			await expect(form.date.getByRole('spinbutton').first()).toBeFocused();
			await form.date.pressSequentially('04012025123456p');
			await form.submitButton.click();
			await expect(form.range.getByRole('spinbutton').first()).toBeFocused();
			await form.range.pressSequentially('0501202505312025');
			await form.submitButton.click();
			await expect(form.category).toBeFocused();
			await form.category.press('Enter');
			await page.getByRole('option', { name: 'Announcement' }).press('Enter');
			await form.submitButton.click();
			await expect(form.author).toBeFocused();
			await form.author.fill('edmundhung');
			await form.author.press('Escape');
			await form.submitButton.click();
			await expect(form.topics).toBeFocused();
			await chooseTopic(form, 'Accessibility');
			await form.topics.press('Escape');
			await form.submitButton.click();
			await expect(form.profile).toBeFocused();
			await form.profileInput.setInputFiles({
				name: 'avatar.txt',
				buffer: Buffer.from('Hello World'),
				mimeType: 'text/plain',
			});
			await form.submitButton.click();
			await expect(form.notifications).toBeFocused();
			await form.notifications.press('Space');
			await form.submitButton.click();
			await expect(form.acceptTerms).toBeFocused();
			await form.acceptTerms.press('Space');
			await form.submitButton.click();

			await expect.poll(form.submittedValue).toEqual({
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
				topics: ['accessibility'],
				profile: {},
				notifications: true,
				acceptTerms: true,
			});
		});

		test('exposes accessible descriptions and errors', async ({ page }) => {
			const form = await getForm(page);

			await form.submitButton.click();
			await form.email.click();
			await form.heading.click();
			await expect(form.email).toHaveAccessibleDescription('Email is required');

			await form.container.getByText('Invalid', { exact: true }).click();
			await form.heading.click();
			await expect(form.language).toHaveAccessibleDescription(
				/Choose a supported language/,
			);

			await form.topics.click();
			await form.heading.click();
			await expect(form.topics).toHaveAccessibleDescription(
				/Choose at least one topic/,
			);

			await expect(form.notifications).toHaveAccessibleDescription(
				/Choose whether to get notifications|Required/,
			);

			await expect(form.acceptTerms).toHaveAccessibleDescription(
				/Accept the terms to continue|Required/,
			);
		});

		test('serializes and resets a multi-select ComboBox', async ({ page }) => {
			for (const reset of ['conform', 'browser']) {
				const form = await getForm(page);

				await expect(form.selectedTopics).toHaveText('None');
				await chooseTopic(form, 'Accessibility');
				await chooseTopic(form, 'Forms');
				await form.topics.press('Escape');

				await expect
					.poll(() =>
						form.topicsControl.evaluate((select: HTMLSelectElement) =>
							Array.from(
								new FormData(select.form ?? undefined).getAll('topics'),
							),
						),
					)
					.toEqual(['accessibility', 'forms']);

				if (reset === 'conform') {
					await form.resetButton.click();
				} else {
					await form.container.evaluate((element: HTMLFormElement) =>
						element.reset(),
					);
				}

				await expect(form.selectedTopics).toHaveText('None');
				await expect
					.poll(() =>
						form.topicsControl.evaluate((select: HTMLSelectElement) =>
							Array.from(
								new FormData(select.form ?? undefined).getAll('topics'),
							),
						),
					)
					.toEqual([]);
			}
		});

		test('resets Switch and file input state', async ({ page }) => {
			for (const reset of ['conform', 'browser']) {
				const form = await getForm(page);

				await form.notifications.press('Space');
				await form.profileInput.setInputFiles({
					name: 'avatar.txt',
					buffer: Buffer.from('Hello World'),
					mimeType: 'text/plain',
				});
				await expect(form.notifications).toBeChecked();
				await expect(
					form.container.getByText('avatar.txt (11 bytes)'),
				).toBeVisible();

				if (reset === 'conform') {
					await form.resetButton.click();
				} else {
					await form.container.evaluate((element: HTMLFormElement) =>
						element.reset(),
					);
				}

				await expect(form.notifications).not.toBeChecked();
				await expect
					.poll(() =>
						form.profileInput.evaluate(
							(input: HTMLInputElement) => input.files?.length ?? 0,
						),
					)
					.toBe(0);
				await expect(
					form.container.getByText('avatar.txt (11 bytes)'),
				).not.toBeVisible();
			}
		});

		test('restores default values, including multi-select and Switch', async ({
			page,
		}) => {
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
				['author', 'edmundhung'],
				['topics', 'accessibility'],
				['topics', 'forms'],
				['notifications', 'on'],
				['acceptTerms', 'on'],
			]);
			const form = await getForm(page, searchParams);

			await expect(form.selectedTopics).toContainText('Accessibility');
			await expect(form.selectedTopics).toContainText('Forms');
			await expect(form.notifications).toBeChecked();

			await chooseTopic(form, 'Accessibility', false);
			await form.topics.press('Escape');
			await form.notifications.press('Space');
			await form.email.fill('changed@example.com');
			await form.resetButton.click();

			await expect(form.email).toHaveValue('hello@example.com');
			await expect(form.selectedTopics).toContainText('Accessibility');
			await expect(form.selectedTopics).toContainText('Forms');
			await expect(form.selectedTopics).not.toContainText('Validation');
			await expect(form.notifications).toBeChecked();
		});

		test('submits native FormData including arrays and files', async ({
			page,
		}) => {
			const form = await getForm(page);
			await fillRequiredFields(page, form);

			const expectedFormData = [
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
			];

			await expect
				.poll(() =>
					form.container.evaluate((element: HTMLFormElement) =>
						Array.from(new FormData(element), ([name, value]) => [
							name,
							typeof value === 'string' ? value : value.name,
						]),
					),
				)
				.toEqual(expectedFormData);

			await form.submitButton.click();
			await expect.poll(form.submittedFormData).toEqual(expectedFormData);
		});
	});
});
