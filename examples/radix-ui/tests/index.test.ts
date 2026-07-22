import { test, expect, type Page } from '@playwright/test';

test.describe('radix-ui', () => {
	test.describe('form', () => {
		async function getForm(page: Page, searchParams?: URLSearchParams) {
			await page.goto(searchParams ? `/?${searchParams}` : '/');

			const container = page.locator('form');

			return {
				container,
				submitButton: container.getByRole('button', { name: 'Submit' }),
				resetButton: container.getByRole('button', { name: 'Reset' }),
				submittedValue: () =>
					container.locator('pre').innerText().then(JSON.parse),
				formData: () =>
					container.evaluate((form) =>
						Array.from(new FormData(form as HTMLFormElement)),
					),
				terms: container.getByRole('checkbox', {
					name: 'Accept terms and conditions',
				}),
				carType: container.getByRole('radiogroup', { name: 'Car type' }),
				country: container.getByRole('combobox', { name: 'Country' }),
				distance: container.getByRole('slider', {
					name: 'Estimated kilometers per year',
				}),
				insurance: container.getByRole('switch', { name: 'Insurance' }),
				contractType: container.getByRole('radiogroup', {
					name: 'Desired contract type',
				}),
			};
		}

		const defaults = new URLSearchParams({
			isTermsAgreed: 'on',
			carType: 'sedan',
			userCountry: 'usa',
			estimatedKilometersPerYear: '5000',
			insurance: 'on',
			desiredContractType: 'full',
		});
		const defaultValue = {
			isTermsAgreed: true,
			carType: 'sedan',
			userCountry: 'usa',
			estimatedKilometersPerYear: 5000,
			insurance: true,
			desiredContractType: 'full',
		};

		test('focus', async ({ page }) => {
			const form = await getForm(page);

			await form.submitButton.click();
			await expect(form.terms).toBeFocused();
			await form.terms.click();

			await form.submitButton.click();
			const sedan = form.carType.getByRole('radio', { name: 'Sedan' });
			await expect(sedan).toBeFocused();
			await sedan.click();

			await form.submitButton.click();
			await expect(form.country).toBeFocused();
			await form.country.click();
			await page.getByRole('option', { name: 'USA' }).click();

			await form.submitButton.click();
			await expect(form.distance).toBeFocused();
			await form.distance.press('ArrowRight');

			await form.submitButton.click();
			await expect(form.insurance).toBeFocused();
			await form.insurance.click();

			await form.submitButton.click();
			const full = form.contractType.getByRole('radio', { name: 'Full' });
			await expect(full).toBeFocused();
			await full.click();

			await form.submitButton.click();
			await expect.poll(form.submittedValue).toEqual({
				isTermsAgreed: true,
				carType: 'sedan',
				userCountry: 'usa',
				estimatedKilometersPerYear: 1,
				insurance: true,
				desiredContractType: 'full',
			});
		});

		test('blur', async ({ page }) => {
			const form = await getForm(page);

			await form.terms.click();
			await form.terms.click();
			await form.terms.focus();
			await expect(form.terms).toHaveAccessibleDescription('');
			await form.country.focus();
			await expect(form.terms).toHaveAccessibleDescription(/.+/);

			const invalidCarType = form.carType.getByRole('radio', {
				name: 'Other (not valid choice)',
			});
			await invalidCarType.click();
			await invalidCarType.focus();
			await expect(form.carType).toHaveAccessibleDescription('');
			await form.country.focus();
			await expect(form.carType).toHaveAccessibleDescription(/.+/);

			await expect(form.country).toHaveAccessibleDescription('');
			await form.country.click();
			await page.keyboard.press('Escape');
			await expect(form.country).toHaveAccessibleDescription(/.+/);

			await form.distance.focus();
			await expect(form.distance).toHaveAccessibleDescription('');
			await form.country.focus();
			await expect(form.distance).toHaveAccessibleDescription(/.+/);

			await form.insurance.click();
			await form.insurance.click();
			await form.insurance.focus();
			await expect(form.insurance).toHaveAccessibleDescription('');
			await form.country.focus();
			await expect(form.insurance).toHaveAccessibleDescription(/.+/);

			const invalidContractType = form.contractType.getByRole('radio', {
				name: 'not Valid',
			});
			await invalidContractType.click();
			await invalidContractType.focus();
			await expect(form.contractType).toHaveAccessibleDescription('');
			await form.country.focus();
			await expect(form.contractType).toHaveAccessibleDescription(/.+/);
		});

		test('reset', async ({ page }) => {
			for (const reset of ['conform', 'browser']) {
				const form = await getForm(page, defaults);

				await form.terms.click();
				await form.carType.getByRole('radio', { name: 'SUV' }).click();
				await form.country.click();
				await page.getByRole('option', { name: 'Mexico' }).click();
				await form.distance.press('Home');
				await form.insurance.click();
				await form.contractType
					.getByRole('radio', { name: 'Part time' })
					.click();

				if (reset === 'conform') {
					await form.resetButton.click();
				} else {
					await form.container.evaluate((element) =>
						(element as HTMLFormElement).reset(),
					);
				}

				await expect.poll(form.formData).toEqual(Array.from(defaults));
				await expect(form.terms).toBeChecked();
				await expect(
					form.carType.getByRole('radio', { name: 'Sedan' }),
				).toBeChecked();
				await expect(form.country).toHaveText('USA');
				await expect(form.distance).toHaveAttribute('aria-valuenow', '5000');
				await expect(form.insurance).toBeChecked();
				await expect(
					form.contractType.getByRole('radio', { name: 'Full' }),
				).toBeChecked();
			}
		});

		test('default value', async ({ page }) => {
			const form = await getForm(page, defaults);

			await expect(form.container.locator('input[name]')).toHaveCount(6);
			await expect.poll(form.formData).toEqual(Array.from(defaults));

			await form.submitButton.click();
			await expect.poll(form.submittedValue).toEqual(defaultValue);
		});

		test('interaction', async ({ page }) => {
			const form = await getForm(page, defaults);
			const hatchback = form.carType.getByRole('radio', { name: 'Hatchback' });
			const partTime = form.contractType.getByRole('radio', {
				name: 'Part time',
			});

			// Each click moves focus from an invalid field whose blur error renders
			// above the click target. Reserved error space keeps that target from
			// moving before pointer activation completes.
			await form.terms.click();
			await hatchback.click();
			await expect(hatchback).toBeChecked();

			await form.distance.press('Home');
			await form.insurance.click();
			await expect(form.insurance).not.toBeChecked();

			await partTime.click();
			await expect(partTime).toBeChecked();
			await partTime.click();
			await expect(partTime).not.toBeChecked();

			await form.resetButton.click();
			await expect.poll(form.formData).toEqual(Array.from(defaults));
		});
	});
});
