import { expect, test, type Page } from '@playwright/test';

test.describe('base-ui', () => {
	test.describe('form', () => {
		async function getForm(page: Page, searchParams?: URLSearchParams) {
			await page.goto(`/?${searchParams?.toString() ?? ''}`);

			const form = page.locator('form');
			return {
				container: form,
				heading: page.getByRole('heading', { name: 'Base UI Example' }),
				fullName: page.getByLabel('Full name'),
				bio: page.getByLabel('Bio'),
				acceptTerms: page.getByRole('checkbox', { name: 'Accept terms' }),
				interestsGroup: page.getByRole('group', { name: 'Interests' }),
				design: page.getByRole('checkbox', { name: 'Design' }),
				engineering: page.getByRole('checkbox', { name: 'Engineering' }),
				research: page.getByRole('checkbox', { name: 'Research' }),
				starter: page.getByRole('radio', { name: 'Starter' }),
				professional: page.getByRole('radio', { name: 'Professional' }),
				planGroup: page.getByRole('radiogroup', { name: 'Plan' }),
				country: page.getByRole('combobox', { name: 'Country' }),
				framework: page.getByRole('combobox', { name: 'Framework' }),
				quantity: page.getByLabel('Quantity', { exact: true }),
				budget: page.getByRole('slider', { name: 'Budget' }),
				notifications: page.getByRole('switch', {
					name: 'Product notifications',
				}),
				resetButton: page.getByRole('button', { name: 'Reset' }),
				submitButton: page.getByRole('button', { name: 'Submit' }),
				formData: () =>
					form.evaluate((element) =>
						Array.from(new FormData(element as HTMLFormElement)).map(
							([name, value]) => [name, String(value)] as const,
						),
					),
				submittedValue: async () =>
					JSON.parse(
						await page.locator('.submitted pre').innerText(),
					) as unknown,
			};
		}

		async function chooseCountry(page: Page, name: string) {
			await page.getByRole('combobox', { name: 'Country' }).click();
			await page.getByRole('option', { name }).click();
		}

		async function chooseFramework(page: Page, name: string) {
			const input = page.getByRole('combobox', { name: 'Framework' });
			await input.fill(name.slice(0, 2));
			await page.getByRole('option', { name }).click();
		}

		async function setBudget(page: Page, value: number) {
			const slider = page.getByRole('slider', { name: 'Budget' });
			await slider.press('Home');
			for (let current = 0; current < value; current += 5) {
				await slider.press('ArrowRight');
			}
		}

		async function completeRequiredFields(page: Page) {
			const form = await getForm(page);
			await form.fullName.fill('Ada Lovelace');
			await form.bio.fill('Writes thoughtful programs.');
			await form.acceptTerms.click();
			await form.design.click();
			await form.professional.click();
			await chooseCountry(page, 'United Kingdom');
			await chooseFramework(page, 'React');
			await form.quantity.fill('');
			await form.quantity.fill('3');
			return form;
		}

		test('validates on submit and focuses each invalid control', async ({
			page,
		}) => {
			const form = await getForm(page);

			await form.submitButton.click();
			await expect(form.fullName).toBeFocused();
			await expect(form.fullName).toHaveAttribute('aria-invalid', 'true');
			await expect(form.fullName).toHaveAccessibleDescription(
				'A native Base UI Input. Enter at least 2 characters',
			);
			await form.fullName.fill('Ada Lovelace');

			await form.submitButton.click();
			await expect(form.bio).toBeFocused();
			await form.bio.fill('Writes thoughtful programs.');

			await form.submitButton.click();
			await expect(form.acceptTerms).toBeFocused();
			await form.acceptTerms.click();

			await form.submitButton.click();
			await expect(form.design).toBeFocused();
			await form.design.click();

			await form.submitButton.click();
			await expect(form.starter).toBeFocused();
			await form.starter.click();

			await form.submitButton.click();
			await expect(form.country).toBeFocused();
			await chooseCountry(page, 'Canada');

			await form.submitButton.click();
			await expect(form.framework).toBeFocused();
			await chooseFramework(page, 'React');
		});

		test('validates native controls on blur', async ({ page }) => {
			const form = await getForm(page);

			await form.fullName.fill('A');
			await form.heading.click();

			await expect(form.fullName).toHaveAttribute('aria-invalid', 'true');
			await expect(page.getByText('Enter at least 2 characters')).toBeVisible();

			await form.acceptTerms.click();
			await form.acceptTerms.click();
			await form.acceptTerms.focus();
			await form.heading.click();
			await expect(form.acceptTerms).toHaveAttribute('aria-invalid', 'true');

			await form.design.focus();
			await form.heading.click();
			await expect(form.interestsGroup).toHaveAttribute('aria-invalid', 'true');
			await expect(form.interestsGroup).toHaveAccessibleDescription(
				'Each checked item contributes the same name to FormData. Choose at least one interest',
			);

			await form.starter.focus();
			await form.heading.click();
			await expect(form.planGroup).toHaveAttribute('aria-invalid', 'true');
			await expect(form.planGroup).toHaveAccessibleDescription(
				'The group serializes one scalar value. Choose a plan',
			);

			await form.country.click();
			await form.country.press('Escape');
			await form.country.press('Tab');
			await expect(form.country).toHaveAttribute('aria-invalid', 'true');
			await expect(form.country).toHaveAccessibleDescription(
				'Select maintains a form-compatible hidden input. Choose a country',
			);
		});

		test('serializes boolean and array checkboxes through Base UI hidden inputs', async ({
			page,
		}) => {
			const form = await getForm(page);

			await form.acceptTerms.click();
			await form.design.click();
			await form.research.click();

			await expect
				.poll(() =>
					form.container.evaluate((element) => {
						const data = new FormData(element as HTMLFormElement);
						return {
							acceptTerms: data.get('acceptTerms'),
							interests: data.getAll('interests'),
						};
					}),
				)
				.toEqual({
					acceptTerms: 'on',
					interests: ['design', 'research'],
				});

			await form.acceptTerms.click();
			await expect
				.poll(() =>
					form.container.evaluate((element) =>
						new FormData(element as HTMLFormElement).has('acceptTerms'),
					),
				)
				.toBe(false);
		});

		test('selects values with Select and Combobox', async ({ page }) => {
			const form = await getForm(page);

			await chooseCountry(page, 'Canada');
			await chooseFramework(page, 'Svelte');

			await expect(form.country).toContainText('Canada');
			await expect(form.framework).toHaveValue('Svelte');
			await expect
				.poll(() =>
					form.container.evaluate((element) => {
						const data = new FormData(element as HTMLFormElement);
						return [data.get('country'), data.get('framework')];
					}),
				)
				.toEqual(['ca', 'svelte']);
		});

		test('coerces NumberField and controls Slider values', async ({ page }) => {
			const form = await getForm(page);

			await form.quantity.fill('');
			await form.quantity.fill('3');
			await page.getByRole('button', { name: 'Increase Quantity' }).click();
			await setBudget(page, 75);

			await expect(form.quantity).toHaveValue('4');
			await expect(form.budget).toHaveValue('75');
			await expect
				.poll(() =>
					form.container.evaluate((element) => {
						const data = new FormData(element as HTMLFormElement);
						return [data.get('quantity'), data.get('budget')];
					}),
				)
				.toEqual(['4', '75']);
		});

		test('resets native, hidden-input, and useControl-backed components', async ({
			page,
		}) => {
			const defaults = new URLSearchParams([
				['fullName', 'Grace Hopper'],
				['bio', 'Pioneered practical compiler technology.'],
				['acceptTerms', 'on'],
				['interests', 'engineering'],
				['interests', 'research'],
				['plan', 'enterprise'],
				['country', 'jp'],
				['framework', 'svelte'],
				['quantity', '6'],
				['budget', '70'],
				['notifications', 'on'],
			]);

			for (const reset of ['conform', 'browser']) {
				const form = await getForm(page, defaults);

				await form.fullName.fill('Changed name');
				await form.bio.fill('Changed biography text.');
				await form.acceptTerms.click();
				await form.engineering.click();
				await form.design.click();
				await form.starter.click();
				await chooseCountry(page, 'Canada');
				await chooseFramework(page, 'React');
				await form.quantity.fill('2');
				await setBudget(page, 80);
				await form.notifications.click();

				if (reset === 'conform') {
					await form.resetButton.click();
				} else {
					await form.container.evaluate((element) =>
						(element as HTMLFormElement).reset(),
					);
				}

				await expect(form.fullName).toHaveValue('Grace Hopper');
				await expect(form.acceptTerms).toBeChecked();
				await expect(form.engineering).toBeChecked();
				await expect(form.research).toBeChecked();
				await expect(form.design).not.toBeChecked();
				await expect(
					page.getByRole('radio', { name: 'Enterprise' }),
				).toBeChecked();
				await expect(form.country).toContainText('Japan');
				await expect(form.framework).toHaveValue('Svelte');
				await expect(form.quantity).toHaveValue('6');
				await expect(form.budget).toHaveValue('70');
				await expect(form.notifications).toBeChecked();
				await expect.poll(form.formData).toEqual(Array.from(defaults));
			}
		});

		test('resets to the last successful submission', async ({ page }) => {
			const form = await completeRequiredFields(page);
			await form.engineering.click();
			await setBudget(page, 65);
			await form.notifications.click();
			await form.submitButton.click();
			await expect.poll(form.submittedValue).toMatchObject({ budget: 65 });

			await form.fullName.fill('Changed name');
			await form.design.click();
			await chooseCountry(page, 'Japan');
			await chooseFramework(page, 'Vue');
			await form.quantity.fill('8');
			await setBudget(page, 80);
			await form.notifications.click();
			await form.resetButton.click();

			await expect(form.fullName).toHaveValue('Ada Lovelace');
			await expect(form.design).toBeChecked();
			await expect(form.engineering).toBeChecked();
			await expect(form.country).toContainText('United Kingdom');
			await expect(form.framework).toHaveValue('React');
			await expect(form.quantity).toHaveValue('3');
			await expect(form.budget).toHaveValue('65');
			await expect(form.notifications).toBeChecked();
		});

		test('restores every default from URL search parameters', async ({
			page,
		}) => {
			const searchParams = new URLSearchParams([
				['fullName', 'Grace Hopper'],
				['bio', 'Pioneered practical compiler technology.'],
				['acceptTerms', 'on'],
				['interests', 'engineering'],
				['interests', 'research'],
				['plan', 'enterprise'],
				['country', 'jp'],
				['framework', 'svelte'],
				['quantity', '6'],
				['budget', '70'],
				['notifications', 'on'],
			]);
			const form = await getForm(page, searchParams);

			await expect(form.fullName).toHaveValue('Grace Hopper');
			await expect(form.engineering).toBeChecked();
			await expect(form.research).toBeChecked();
			await expect(
				page.getByRole('radio', { name: 'Enterprise' }),
			).toBeChecked();
			await expect(form.country).toContainText('Japan');
			await expect(form.framework).toHaveValue('Svelte');
			await expect(form.quantity).toHaveValue('6');
			await expect(form.budget).toHaveValue('70');
			await expect(form.notifications).toBeChecked();
		});

		test('submits parsed data and updates the URL', async ({ page }) => {
			const form = await completeRequiredFields(page);
			await form.engineering.click();
			await setBudget(page, 65);
			await form.notifications.click();
			await form.submitButton.click();

			expect(
				(await page.locator('.error').allTextContents()).filter((error) =>
					error.trim(),
				),
			).toEqual([]);
			await expect.poll(form.submittedValue).toEqual({
				fullName: 'Ada Lovelace',
				bio: 'Writes thoughtful programs.',
				acceptTerms: true,
				interests: ['design', 'engineering'],
				plan: 'professional',
				country: 'gb',
				framework: 'react',
				quantity: 3,
				budget: 65,
				notifications: true,
			});

			await expect
				.poll(() => new URL(page.url()).searchParams.get('budget'))
				.toBe('65');
			await expect
				.poll(() => new URL(page.url()).searchParams.getAll('interests'))
				.toEqual(['design', 'engineering']);
		});
	});
});
