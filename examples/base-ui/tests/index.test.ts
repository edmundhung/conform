import { expect, test, type Page } from '@playwright/test';

test.describe('base-ui', () => {
	async function getForm(page: Page, searchParams?: URLSearchParams) {
		await page.goto(searchParams ? `/?${searchParams}` : '/');

		const form = page.locator('form');
		const country = form.getByRole('combobox', { name: 'Country' });
		const framework = form.getByRole('combobox', { name: 'Framework' });
		const quantity = form.getByLabel('Quantity', { exact: true });
		const budget = form.getByRole('slider', { name: 'Budget' });

		return {
			form,
			heading: page.getByRole('heading', { name: 'Base UI Example' }),
			fullName: form.getByLabel('Full name'),
			bio: form.getByLabel('Bio'),
			acceptTerms: form.getByRole('checkbox', { name: 'Accept terms' }),
			interestsGroup: form.getByRole('group', { name: 'Interests' }),
			design: form.getByRole('checkbox', { name: 'Design' }),
			engineering: form.getByRole('checkbox', { name: 'Engineering' }),
			research: form.getByRole('checkbox', { name: 'Research' }),
			planGroup: form.getByRole('radiogroup', { name: 'Plan' }),
			starter: form.getByRole('radio', { name: 'Starter' }),
			professional: form.getByRole('radio', { name: 'Professional' }),
			enterprise: form.getByRole('radio', { name: 'Enterprise' }),
			country,
			async chooseCountry(name: string) {
				await country.click();
				await page.getByRole('option', { name }).click();
			},
			framework,
			async chooseFramework(name: string) {
				await framework.fill(name.slice(0, 2));
				await page.getByRole('option', { name }).click();
			},
			quantity,
			async setQuantity(value: string) {
				await quantity.fill('');
				await quantity.fill(value);
			},
			increaseQuantity: form.getByRole('button', {
				name: 'Increase Quantity',
			}),
			budget,
			async setBudget(value: number) {
				await budget.press('Home');
				for (let current = 0; current < value; current += 5) {
					await budget.press('ArrowRight');
				}
			},
			notifications: form.getByRole('switch', {
				name: 'Product notifications',
			}),
			resetButton: form.getByRole('button', { name: 'Reset' }),
			submitButton: form.getByRole('button', { name: 'Submit' }),
			submittedValue: () =>
				form
					.locator('.submitted pre')
					.innerText()
					.then((value) => JSON.parse(value)),
		};
	}

	test('validation and submission', async ({ page }) => {
		const controls = await getForm(page, new URLSearchParams({ budget: '' }));

		// An empty URL default falls back to the slider's presentation default.
		await expect(controls.budget).toHaveValue('50');

		await controls.fullName.fill('A');
		await controls.heading.click();
		await expect(controls.fullName).toHaveAccessibleDescription(
			'A native Base UI Input. Enter at least 2 characters',
		);

		await controls.design.focus();
		await controls.heading.click();
		await expect(controls.interestsGroup).toHaveAccessibleDescription(
			'A multiple BaseControl serializes the selected values. Choose at least one interest',
		);

		await controls.fullName.fill('Ada Lovelace');
		await controls.bio.fill('Writes thoughtful programs.');
		await controls.setBudget(0);

		await controls.submitButton.click();
		await expect(controls.acceptTerms).toBeFocused();
		await expect(controls.acceptTerms).toHaveAccessibleDescription(
			'The visible checkbox is synchronized with a BaseControl. Accept the terms to continue',
		);
		await controls.acceptTerms.click();

		await controls.submitButton.click();
		await expect(controls.design).toBeFocused();
		await expect(controls.design).toHaveAccessibleDescription(
			'A multiple BaseControl serializes the selected values. Choose at least one interest',
		);
		await controls.design.click();
		await controls.engineering.click();

		await controls.submitButton.click();
		await expect(controls.starter).toBeFocused();
		await expect(controls.planGroup).toHaveAccessibleDescription(
			'The BaseControl serializes one scalar value. Choose a plan',
		);
		await expect(controls.starter).toHaveAccessibleDescription(
			'The BaseControl serializes one scalar value. Choose a plan',
		);
		await controls.professional.click();

		await controls.submitButton.click();
		await expect(controls.country).toBeFocused();
		await expect(controls.country).toHaveAccessibleDescription(
			'Select is synchronized with a scalar BaseControl. Choose a country',
		);
		await controls.chooseCountry('Canada');

		await controls.submitButton.click();
		await expect(controls.framework).toBeFocused();
		await expect(controls.framework).toHaveAccessibleDescription(
			'Filtering is transient; BaseControl stores the selection. Choose a framework',
		);
		await controls.chooseFramework('Svelte');

		await controls.submitButton.click();
		await expect(controls.quantity).toBeFocused();
		await expect(controls.quantity).toHaveAccessibleDescription(
			'BaseControl stores the raw value before Zod coercion. Use at least 2',
		);
		await controls.setQuantity('3');
		await controls.increaseQuantity.click();

		await controls.submitButton.click();
		await expect(controls.budget).toBeFocused();
		await expect(controls.budget).toHaveAccessibleDescription(
			'The range input is controlled through useControl. Use a budget of at least 10',
		);
		await controls.setBudget(65);

		await controls.submitButton.click();
		await expect(controls.notifications).toBeFocused();
		await expect(controls.notifications).toHaveAccessibleDescription(
			'A checkbox BaseControl submits “on” while enabled. Enable product notifications',
		);
		await controls.notifications.click();

		await controls.submitButton.click();

		await expect.poll(controls.submittedValue).toEqual({
			fullName: 'Ada Lovelace',
			bio: 'Writes thoughtful programs.',
			acceptTerms: true,
			interests: ['design', 'engineering'],
			plan: 'professional',
			country: 'ca',
			framework: 'svelte',
			quantity: 4,
			budget: 65,
			notifications: true,
		});
		await expect
			.poll(() => new URL(page.url()).searchParams.getAll('interests'))
			.toEqual(['design', 'engineering']);
	});

	test('updated defaults and reset', async ({ page }) => {
		const defaults = new URLSearchParams([
			['fullName', 'Grace Hopper'],
			['bio', 'Pioneered practical compiler technology.'],
			['interests', 'research'],
			['plan', 'enterprise'],
			['country', 'jp'],
			['framework', 'svelte'],
			['quantity', '6'],
			['budget', '70'],
		]);
		const controls = await getForm(page, defaults);

		await expect(controls.fullName).toHaveValue('Grace Hopper');
		await expect(controls.research).toBeChecked();
		await expect(controls.enterprise).toBeChecked();
		await expect(controls.country).toContainText('Japan');
		await expect(controls.framework).toHaveValue('Svelte');

		await controls.fullName.fill('Ada Lovelace');
		await controls.bio.fill('Writes thoughtful programs.');
		await controls.acceptTerms.click();
		await controls.research.click();
		await controls.design.click();
		await controls.engineering.click();
		await controls.professional.click();
		await controls.chooseCountry('United Kingdom');
		await controls.chooseFramework('React');
		await controls.setQuantity('4');
		await controls.setBudget(65);
		await controls.notifications.click();
		await controls.submitButton.click();

		const submittedValue = {
			fullName: 'Ada Lovelace',
			bio: 'Writes thoughtful programs.',
			acceptTerms: true,
			interests: ['design', 'engineering'],
			plan: 'professional',
			country: 'gb',
			framework: 'react',
			quantity: 4,
			budget: 65,
			notifications: true,
		};
		await expect.poll(controls.submittedValue).toEqual(submittedValue);

		await controls.fullName.fill('Changed name');
		await controls.bio.fill('Changed biography text.');
		await controls.acceptTerms.click();
		await controls.design.click();
		await controls.research.click();
		await controls.starter.click();
		await controls.chooseCountry('Canada');
		await controls.chooseFramework('Vue');
		await controls.setQuantity('9');
		await controls.setBudget(80);
		await controls.notifications.click();

		await controls.resetButton.click();

		await expect(controls.fullName).toHaveValue('Ada Lovelace');
		await expect(controls.bio).toHaveValue('Writes thoughtful programs.');
		await expect(controls.acceptTerms).toBeChecked();
		await expect(controls.design).toBeChecked();
		await expect(controls.engineering).toBeChecked();
		await expect(controls.research).not.toBeChecked();
		await expect(controls.professional).toBeChecked();
		await expect(controls.country).toContainText('United Kingdom');
		await expect(controls.framework).toHaveValue('React');
		await expect(controls.quantity).toHaveValue('4');
		await expect(controls.budget).toHaveValue('65');
		await expect(controls.notifications).toBeChecked();

		await controls.submitButton.click();
		await expect.poll(controls.submittedValue).toEqual(submittedValue);
	});
});
