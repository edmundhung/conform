import { expect, test, type Locator, type Page } from '@playwright/test';

test.describe('shadcn-base-ui', () => {
	test.describe('comparison form', () => {
		function getValidDefaults() {
			return new URLSearchParams([
				['name', 'Tester'],
				['description', 'Hello World'],
				['accountType', 'business'],
				['gender', 'male'],
				['agreeToTerms', 'on'],
				['job', 'developer'],
				['country', 'IT'],
				['age', '42'],
				['isAdult', 'on'],
				['dateOfBirth', '2025-04-30T00:00:00.000Z'],
				['interests', 'react'],
				['interests', 'angular'],
				['interests', 'next'],
				['code', '543210'],
			]);
		}

		async function getForm(page: Page, searchParams = new URLSearchParams()) {
			await page.goto(`/?${searchParams}`);

			const form = page.locator('form');
			return {
				form,
				heading: page.getByRole('heading', {
					name: 'shadcn/ui with Base UI',
				}),
				submit: form.getByRole('button', { name: 'Submit' }),
				reset: form.getByRole('button', { name: 'Reset' }),
				name: form.getByLabel('Name'),
				description: form.getByLabel('Description'),
				accountType: form.getByLabel('Account type'),
				gender: form.getByRole('radiogroup', { name: 'Gender' }),
				agreeToTerms: form.getByRole('checkbox', { name: 'Agree to terms' }),
				job: form.getByRole('combobox', { name: 'Job' }),
				country: form.getByRole('combobox', { name: 'Country' }),
				age: form.getByRole('slider', { name: 'Age' }),
				isAdult: form.getByRole('switch', { name: 'Is adult' }),
				dateOfBirth: form.getByRole('button', { name: 'Date of Birth' }),
				interests: form.getByRole('combobox', { name: 'Interests' }),
				code: form.getByRole('textbox', { name: 'Code' }),
				submittedValue: async () =>
					JSON.parse(await form.locator('pre').innerText()) as Record<
						string,
						unknown
					>,
				formData: () =>
					form.evaluate((element) =>
						Array.from(new FormData(element as HTMLFormElement)).map(
							([name, value]) => [name, value.toString()] as [string, string],
						),
					),
			};
		}

		async function selectComboboxItem(
			page: Page,
			input: Locator,
			query: string,
			option: string,
		) {
			await input.click();
			await input.fill('');
			await input.fill(query);
			const optionElement = page.getByRole('option', {
				name: option,
				exact: true,
			});
			await optionElement.click();
			await optionElement.waitFor({ state: 'hidden' });
		}

		async function completeForm(page: Page) {
			const form = await getForm(page);
			await form.name.fill('Example');
			await form.description.fill('A sufficiently long description');
			await form.accountType.selectOption('personal');
			await form.gender.getByRole('radio', { name: 'Female' }).click();
			await form.agreeToTerms.click();

			await form.job.click();
			await page.getByRole('option', { name: 'Designer' }).click();

			await selectComboboxItem(page, form.country, 'Jap', 'Japan');

			await form.age.focus();
			for (let index = 0; index < 18; index += 1) {
				await form.age.press('ArrowRight');
			}
			await form.isAdult.click();

			await form.dateOfBirth.click();
			await page.getByRole('gridcell').getByText('15', { exact: true }).click();

			for (const interest of ['React', 'Angular', 'Next']) {
				await selectComboboxItem(page, form.interests, interest, interest);
			}

			await form.code.pressSequentially('123456');
			return form;
		}

		test('focuses the first invalid visible control', async ({ page }) => {
			const form = await getForm(page);

			await form.submit.click();

			await expect(form.name).toBeFocused();
			await expect(form.name).toHaveAttribute('aria-invalid', 'true');
			await expect(form.name).toHaveAccessibleDescription(/three characters/i);
		});

		test('forwards validation focus from hidden inputs', async ({ page }) => {
			type Form = Awaited<ReturnType<typeof getForm>>;
			async function expectMissingFieldToFocus(
				name: string,
				getTarget: (form: Form) => Locator,
			) {
				const defaults = getValidDefaults();
				defaults.delete(name);
				const form = await getForm(page, defaults);

				await form.submit.click();
				await expect(getTarget(form)).toBeFocused();
			}

			await expectMissingFieldToFocus('gender', (form) =>
				form.gender.getByRole('radio').first(),
			);
			await expectMissingFieldToFocus(
				'agreeToTerms',
				(form) => form.agreeToTerms,
			);
			await expectMissingFieldToFocus('job', (form) => form.job);
			await expectMissingFieldToFocus('country', (form) => form.country);
			await expectMissingFieldToFocus('age', (form) => form.age);
			await expectMissingFieldToFocus('isAdult', (form) => form.isAdult);
			await expectMissingFieldToFocus(
				'dateOfBirth',
				(form) => form.dateOfBirth,
			);
			await expectMissingFieldToFocus('interests', (form) => form.interests);
			await expectMissingFieldToFocus('code', (form) => form.code);
		});

		test('validates on blur and revalidates on input', async ({ page }) => {
			const form = await getForm(page);
			async function expectBlurValidation(target: Locator) {
				await target.focus();
				await form.heading.click();
				await expect(target).toHaveAttribute('aria-invalid', 'true');
			}

			await expectBlurValidation(form.name);
			await expect(form.name).toHaveAccessibleDescription(/Invalid input/);
			await form.name.fill('Example');
			await expect(form.name).not.toHaveAccessibleDescription(/Invalid input/);

			await expectBlurValidation(form.gender.getByRole('radio').first());
			await expectBlurValidation(form.agreeToTerms);
			await expectBlurValidation(form.job);
			await expect(form.job).toHaveAccessibleDescription(/Invalid input/);
			await form.job.click();
			await page.getByRole('option', { name: 'Developer' }).click();
			await expect(form.job).not.toHaveAccessibleDescription(/Invalid input/);

			await expectBlurValidation(form.country);
			await form.age.focus();
			await form.heading.click();
			await expect(form.age).toHaveAccessibleDescription(/18/);
			await expectBlurValidation(form.isAdult);
			await expectBlurValidation(form.dateOfBirth);
			await expectBlurValidation(form.interests);
			await expectBlurValidation(form.code);
		});

		test('treats popup interaction as part of the field', async ({ page }) => {
			const form = await getForm(page);

			await form.job.click();
			await expect(page.getByRole('listbox')).toBeVisible();
			await expect(form.job).not.toHaveAttribute('aria-invalid', 'true');

			await form.job.press('Escape');
			await expect(form.job).toHaveAttribute('aria-invalid', 'true');

			await form.job.click();
			await page.getByRole('option', { name: 'Developer' }).click();
			await expect(form.job).not.toHaveAttribute('aria-invalid', 'true');

			await form.dateOfBirth.click();
			await expect(page.getByRole('grid')).toBeVisible();
			await expect(form.dateOfBirth).not.toHaveAttribute(
				'aria-invalid',
				'true',
			);
			await page.getByRole('gridcell').getByText('15', { exact: true }).click();
			await expect(form.dateOfBirth).not.toHaveAttribute(
				'aria-invalid',
				'true',
			);
			await form.dateOfBirth.focus();
			await form.heading.click();
			await expect(form.dateOfBirth).not.toHaveAttribute(
				'aria-invalid',
				'true',
			);
		});

		test('submits parsed values and repeated FormData entries', async ({
			page,
		}) => {
			const form = await completeForm(page);
			await form.submit.click();

			const dateOfBirth = (await form.formData()).find(
				([name]) => name === 'dateOfBirth',
			)?.[1];
			expect(dateOfBirth).toBeDefined();

			await expect.poll(form.submittedValue).toEqual({
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

			const submittedSearchParams = new URL(page.url()).searchParams;
			expect(submittedSearchParams.getAll('interests')).toEqual([
				'react',
				'angular',
				'next',
			]);
			expect(submittedSearchParams.get('country')).toBe('JP');
			expect(submittedSearchParams.get('agreeToTerms')).toBe('on');
		});

		test('complex controls expose native form values', async ({ page }) => {
			const defaults = getValidDefaults();
			const form = await getForm(page, defaults);

			await expect.poll(form.formData).toEqual(Array.from(defaults));

			await selectComboboxItem(page, form.country, 'Jap', 'Japan');
			await selectComboboxItem(page, form.interests, 'Vue', 'Vue');
			await form.code.press('ControlOrMeta+A');
			await form.code.pressSequentially('654321');

			const values = await form.form.evaluate((element) => {
				const data = new FormData(element as HTMLFormElement);
				return {
					country: data.get('country'),
					interests: data.getAll('interests'),
					code: data.get('code'),
				};
			});
			expect(values).toEqual({
				country: 'JP',
				interests: ['react', 'vue', 'angular', 'next'],
				code: '654321',
			});

			const invalidDefaults = getValidDefaults();
			invalidDefaults.set('country', 'invalid');
			const invalidForm = await getForm(page, invalidDefaults);
			await expect(invalidForm.country).toHaveValue('');
			await expect.poll(invalidForm.formData).toContainEqual(['country', '']);
		});

		test('resets uncontrolled defaults, Base UI hidden inputs, and adapters', async ({
			page,
		}) => {
			for (const reset of ['button', 'browser']) {
				const defaults = getValidDefaults();
				const form = await getForm(page, defaults);

				await form.name.fill('Changed');
				await form.description.fill('A different valid description');
				await form.accountType.selectOption('personal');
				await form.gender.getByRole('radio', { name: 'Female' }).click();
				await form.agreeToTerms.click();
				await form.job.click();
				await page.getByRole('option', { name: 'Manager' }).click();
				await selectComboboxItem(page, form.country, 'Jap', 'Japan');
				await form.age.press('Home');
				await form.isAdult.click();
				await form.dateOfBirth.click();
				await page
					.getByRole('gridcell')
					.getByText('15', { exact: true })
					.click();
				await selectComboboxItem(page, form.interests, 'Vue', 'Vue');
				await form.code.fill('111111');

				if (reset === 'button') {
					await form.reset.click();
				} else {
					await form.form.evaluate((element) =>
						(element as HTMLFormElement).reset(),
					);
				}

				await expect.poll(form.formData).toEqual(Array.from(defaults));
				await expect(form.name).toHaveValue('Tester');
				await expect(form.description).toHaveValue('Hello World');
				await expect(form.accountType).toHaveValue('business');
				await expect(
					form.gender.getByRole('radio', { name: 'Male', exact: true }),
				).toBeChecked();
				await expect(form.agreeToTerms).toBeChecked();
				await expect(form.job).toContainText('Developer');
				await expect(form.country).toHaveValue('Italy');
				await expect(form.age).toHaveValue('42');
				await expect(form.isAdult).toBeChecked();
				await expect(form.dateOfBirth).toContainText('April 30th, 2025');
				await expect(form.interests).toHaveValue('');
				await expect(form.code).toHaveValue('543210');
			}
		});
	});
});
