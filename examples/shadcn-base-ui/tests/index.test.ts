import { expect, test, type Page } from '@playwright/test';

test.describe('shadcn-base-ui', () => {
	async function getForm(page: Page, searchParams?: URLSearchParams) {
		await page.goto(searchParams ? `/?${searchParams}` : '/');

		const form = page.locator('form');
		const job = form.getByRole('combobox', { name: 'Job' });
		const country = form.getByRole('combobox', { name: 'Country' });
		const interests = form.getByRole('combobox', { name: 'Interests' });
		const interestChips = form.locator('[data-slot="combobox-chip"]');
		const age = form.getByRole('slider', { name: 'Age' });

		return {
			form,
			heading: page.getByRole('heading', {
				name: 'shadcn/ui with Base UI',
			}),
			submitButton: form.getByRole('button', { name: 'Submit' }),
			resetButton: form.getByRole('button', { name: 'Reset' }),
			name: form.getByLabel('Name'),
			description: form.getByLabel('Description'),
			accountType: form.getByLabel('Account type'),
			gender: form.getByRole('radiogroup', { name: 'Gender' }),
			agreeToTerms: form.getByRole('checkbox', { name: 'Agree to terms' }),
			job,
			async selectJob(option: string) {
				await job.click();
				await page.getByRole('option', { name: option, exact: true }).click();
			},
			country,
			async selectCountry(option: string) {
				await country.click();
				await country.fill(option.slice(0, 3));
				await page.getByRole('option', { name: option, exact: true }).click();
			},
			age,
			async increaseAge(steps: number) {
				for (let current = 0; current < steps; current += 1) {
					await age.press('ArrowRight');
				}
			},
			isAdult: form.getByRole('switch', { name: 'Is adult' }),
			dateOfBirth: form.getByRole('button', { name: 'Date of Birth' }),
			async selectDate(day: string) {
				await form.getByRole('button', { name: 'Date of Birth' }).click();
				await page
					.locator('[data-slot="calendar"] button[data-day]')
					.filter({ hasText: new RegExp(`^${day}$`) })
					.first()
					.click();
			},
			interests,
			async selectInterest(option: string) {
				await interests.click();
				await interests.fill(option);
				const optionElement = page.getByRole('option', {
					name: option,
					exact: true,
				});
				await optionElement.click();
				await optionElement.waitFor({ state: 'hidden' });
			},
			interestChips,
			code: form.getByRole('textbox', { name: 'Code' }),
			submittedValue: () =>
				form
					.locator('.submitted pre')
					.innerText()
					.then((value) => JSON.parse(value) as Record<string, unknown>),
		};
	}

	test('validation and submission', async ({ page }) => {
		const controls = await getForm(page);

		await controls.name.fill('A');
		await controls.heading.click();
		await expect(controls.name).toHaveAccessibleDescription(
			'A native input receives Conform props directly. Use at least three characters. Invalid input',
		);
		await expect(controls.name).toHaveAttribute('aria-invalid', 'true');

		await controls.name.fill('Example');
		await controls.description.fill('A sufficiently long description');
		await controls.accountType.selectOption('personal');

		await controls.submitButton.click();
		const female = controls.gender.getByRole('radio', { name: 'Female' });
		await expect(controls.gender.getByRole('radio').first()).toBeFocused();
		await expect(controls.gender).toHaveAttribute('aria-invalid', 'true');
		await female.click();

		await controls.submitButton.click();
		await expect(controls.agreeToTerms).toBeFocused();
		await expect(controls.agreeToTerms).toHaveAttribute('aria-invalid', 'true');
		await controls.agreeToTerms.click();

		await controls.submitButton.click();
		await expect(controls.job).toBeFocused();
		await expect(controls.job).toHaveAccessibleDescription(
			'The compound select is synchronized with a scalar BaseControl. Invalid input',
		);
		await controls.selectJob('Designer');

		await controls.submitButton.click();
		await expect(controls.country).toBeFocused();
		await expect(controls.country).toHaveAttribute('aria-invalid', 'true');
		await controls.selectCountry('Japan');

		await controls.submitButton.click();
		await expect(controls.age).toBeFocused();
		await expect(controls.age).toHaveAccessibleDescription(/18/);
		await controls.increaseAge(18);

		await controls.submitButton.click();
		await expect(controls.isAdult).toBeFocused();
		await expect(controls.isAdult).toHaveAttribute('aria-invalid', 'true');
		await controls.isAdult.click();

		await controls.submitButton.click();
		await expect(controls.dateOfBirth).toBeFocused();
		await expect(controls.dateOfBirth).toHaveAttribute('aria-invalid', 'true');
		await controls.selectDate('15');
		const dateOfBirth = await controls.form.evaluate((element) =>
			new FormData(element as HTMLFormElement).get('dateOfBirth')?.toString(),
		);
		expect(dateOfBirth).toBeDefined();

		await controls.submitButton.click();
		await expect(controls.interests).toBeFocused();
		await expect(controls.interests).toHaveAttribute('aria-invalid', 'true');
		for (const interest of ['React', 'Angular', 'Next']) {
			await controls.selectInterest(interest);
		}

		await controls.submitButton.click();
		await expect(controls.code).toBeFocused();
		await expect(controls.code).toHaveAttribute('aria-invalid', 'true');
		await controls.code.pressSequentially('123456');

		await controls.submitButton.click();
		await expect.poll(controls.submittedValue).toEqual({
			name: 'Example',
			dateOfBirth,
			country: 'JP',
			gender: 'female',
			agreeToTerms: true,
			job: 'designer',
			age: 18,
			isAdult: true,
			description: 'A sufficiently long description',
			accountType: 'personal',
			interests: ['react', 'angular', 'next'],
			code: '123456',
		});

		await expect
			.poll(() => new URL(page.url()).searchParams.getAll('interests'))
			.toEqual(['react', 'angular', 'next']);
	});

	test('updated defaults and reset', async ({ page }) => {
		const defaults = new URLSearchParams([
			['name', 'Default'],
			['description', 'Default description'],
			['accountType', 'business'],
			['gender', 'male'],
			['job', 'developer'],
			['country', 'IT'],
			['age', '42'],
			['dateOfBirth', '2025-04-30T00:00:00.000Z'],
			['interests', 'react'],
			['interests', 'angular'],
			['interests', 'next'],
			['code', '543210'],
		]);
		const controls = await getForm(page, defaults);

		await expect(controls.name).toHaveValue('Default');
		await expect(
			controls.gender.getByRole('radio', { name: 'Male', exact: true }),
		).toBeChecked();
		await expect(controls.job).toContainText('Developer');
		await expect(controls.country).toHaveValue('Italy');
		await expect(controls.age).toHaveValue('42');
		await expect(controls.code).toHaveValue('543210');

		await controls.selectDate('15');
		const submittedDate = await controls.form.evaluate((element) =>
			new FormData(element as HTMLFormElement).get('dateOfBirth')?.toString(),
		);
		const submittedDateLabel = await controls.dateOfBirth.textContent();
		await controls.name.fill('Submitted');
		await controls.description.fill('Submitted description');
		await controls.accountType.selectOption('personal');
		await controls.gender.getByRole('radio', { name: 'Female' }).click();
		await controls.agreeToTerms.click();
		await controls.selectJob('Manager');
		await controls.selectCountry('Japan');
		await controls.increaseAge(8);
		await controls.isAdult.click();
		await controls.selectInterest('Vue');
		await controls.code.press('ControlOrMeta+A');
		await controls.code.pressSequentially('654321');
		await controls.submitButton.click();

		const submittedValue = {
			name: 'Submitted',
			dateOfBirth: submittedDate,
			country: 'JP',
			gender: 'female',
			agreeToTerms: true,
			job: 'manager',
			age: 50,
			isAdult: true,
			description: 'Submitted description',
			accountType: 'personal',
			interests: ['react', 'angular', 'next', 'vue'],
			code: '654321',
		};
		await expect.poll(controls.submittedValue).toEqual(submittedValue);

		await controls.name.fill('Changed');
		await controls.description.fill('Changed description');
		await controls.accountType.selectOption('business');
		await controls.gender
			.getByRole('radio', { name: 'Male', exact: true })
			.click();
		await controls.agreeToTerms.click();
		await controls.selectJob('Developer');
		await controls.selectCountry('Italy');
		await controls.increaseAge(10);
		await controls.isAdult.click();
		await controls.selectDate('20');
		await controls.selectInterest('Svelte');
		await controls.code.press('ControlOrMeta+A');
		await controls.code.pressSequentially('111111');

		await controls.resetButton.click();

		await expect(controls.name).toHaveValue('Submitted');
		await expect(controls.description).toHaveValue('Submitted description');
		await expect(controls.accountType).toHaveValue('personal');
		await expect(
			controls.gender.getByRole('radio', { name: 'Female' }),
		).toBeChecked();
		await expect(controls.agreeToTerms).toBeChecked();
		await expect(controls.job).toContainText('Manager');
		await expect(controls.country).toHaveValue('Japan');
		await expect(controls.age).toHaveValue('50');
		await expect(controls.isAdult).toBeChecked();
		await expect(controls.dateOfBirth).toHaveText(submittedDateLabel ?? '');
		await expect
			.poll(async () => (await controls.interestChips.allTextContents()).sort())
			.toEqual(['Angular', 'Next', 'React', 'Vue']);
		await expect(controls.code).toHaveValue('654321');

		await controls.submitButton.click();
		await expect.poll(controls.submittedValue).toEqual(submittedValue);
	});
});
