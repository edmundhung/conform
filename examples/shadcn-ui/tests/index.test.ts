import { expect, test, type Page } from '@playwright/test';

test.describe('shadcn-ui', () => {
	async function getForm(page: Page, searchParams?: URLSearchParams) {
		await page.goto(searchParams ? `/?${searchParams}` : '/');
		const form = page.locator('form');
		const dateOfBirth = form.getByLabel('Date of Birth');
		const country = form.getByLabel('Country');
		const job = form.getByLabel('Job');
		const members = form.getByRole('combobox', { name: 'Team Members' });
		const code = form.getByLabel('Code');

		return {
			form,
			heading: page.getByRole('heading', { name: 'shadcn/ui with Radix' }),
			name: form.getByLabel('Name'),
			dateOfBirth,
			async selectDate(day: number) {
				await dateOfBirth.click();
				await page
					.getByRole('gridcell')
					.getByText(String(day), { exact: true })
					.click();
			},
			country,
			async selectCountry(name: string) {
				await country.click();
				await page
					.locator('[data-slot="popover-content"]')
					.getByRole('option', { name, exact: true })
					.click();
			},
			gender: form.getByRole('radiogroup', { name: 'Gender' }),
			agreeToTerms: form.getByLabel('Agree to terms'),
			job,
			async selectJob(name: string) {
				await job.click();
				await page.getByRole('option', { name, exact: true }).click();
			},
			age: form.getByRole('slider', { name: 'Age' }),
			isAdult: form.getByLabel('Is adult'),
			description: form.getByLabel('Description'),
			accountType: form.getByRole('radiogroup', { name: 'Account type' }),
			categories: form.getByRole('toolbar', { name: 'Categories' }),
			interests: form.getByRole('group', { name: 'Interests' }),
			members,
			async selectMember(name: string) {
				await members.click();
				await page
					.locator('[data-slot="popover-content"]')
					.getByRole('option')
					.filter({ has: page.getByText(name, { exact: true }) })
					.click();
				await members.press('Escape');
			},
			async removeMember(name: string) {
				await form.getByRole('button', { name: `Remove ${name}` }).click();
			},
			code,
			async setCode(value: string) {
				await code.press('ControlOrMeta+A');
				await code.pressSequentially(value);
			},
			resetButton: form.getByRole('button', { name: 'Reset' }),
			submitButton: form.getByRole('button', { name: 'Submit' }),
			submittedValue: () =>
				form
					.locator('pre')
					.innerText()
					.then((value) => JSON.parse(value)),
		};
	}

	function dateInCurrentMonth(day: number) {
		const now = new Date();
		return new Date(
			Date.UTC(now.getFullYear(), now.getMonth(), day),
		).toISOString();
	}

	test('validation and submission', async ({ page }) => {
		const malformedControls = await getForm(
			page,
			new URLSearchParams([
				['dateOfBirth', 'invalid'],
				['members[0].role', 'invalid'],
			]),
		);
		await expect(malformedControls.dateOfBirth).toHaveText('Pick a date');
		await expect(malformedControls.members).toContainText(
			'Select team members',
		);

		const controls = await getForm(page);
		const genderItems = controls.gender.getByRole('radio');

		// Moving within a compound control must not trigger blur validation.
		await genderItems.first().focus();
		await genderItems.nth(1).focus();
		await expect(controls.gender).toHaveAccessibleDescription(
			'A scalar BaseControl stores the selected radio value.',
		);
		await controls.heading.click();
		await expect(controls.gender).toHaveAccessibleDescription(
			'A scalar BaseControl stores the selected radio value. Invalid input',
		);

		await controls.submitButton.click();
		await expect(controls.name).toBeFocused();
		await expect(controls.name).toHaveAttribute('aria-invalid', 'true');
		await controls.name.fill('Example');

		await controls.submitButton.click();
		await expect(controls.dateOfBirth).toBeFocused();
		await expect(controls.dateOfBirth).toHaveAccessibleDescription(
			'A scalar BaseControl stores the selected date as an ISO string. Invalid input',
		);
		await controls.selectDate(15);

		await controls.submitButton.click();
		await expect(controls.country).toBeFocused();
		await controls.selectCountry('Japan');

		await controls.submitButton.click();
		await expect(genderItems.first()).toBeFocused();
		await expect(controls.gender).toHaveAttribute('aria-invalid', 'true');
		await controls.gender.getByRole('radio', { name: 'female' }).click();

		await controls.submitButton.click();
		await expect(controls.agreeToTerms).toBeFocused();
		await controls.agreeToTerms.click();

		await controls.submitButton.click();
		await expect(controls.job).toBeFocused();
		await controls.selectJob('Designer');

		await controls.submitButton.click();
		await expect(controls.age).toBeFocused();
		for (let value = 0; value < 18; value += 1) {
			await controls.age.press('ArrowRight');
		}

		await controls.submitButton.click();
		await expect(controls.isAdult).toBeFocused();
		await controls.isAdult.click();

		await controls.submitButton.click();
		await expect(controls.description).toBeFocused();
		await controls.description.fill('A sufficiently long description');

		await controls.submitButton.click();
		await expect(controls.accountType.getByRole('radio').first()).toBeFocused();
		await controls.accountType.getByRole('radio', { name: 'Personal' }).click();

		await controls.submitButton.click();
		await expect(controls.categories.getByRole('button').first()).toBeFocused();
		await controls.categories.getByRole('button', { name: 'Blog' }).click();

		await controls.submitButton.click();
		await expect(
			controls.interests.getByRole('checkbox').first(),
		).toBeFocused();
		await expect(
			controls.interests.getByRole('checkbox').first(),
		).toHaveAttribute('aria-invalid', 'true');
		for (const interest of ['React', 'Angular', 'Next']) {
			await controls.interests
				.getByRole('checkbox', { name: interest })
				.click();
		}

		await controls.submitButton.click();
		await expect(controls.members).toBeFocused();
		await expect(controls.members).toHaveAccessibleDescription(
			'A fieldset BaseControl serializes the selected members as a structured array. Invalid input',
		);
		await controls.members.press('Enter');
		await expect(page.locator('[data-slot="popover-content"]')).toBeVisible();
		await controls.members.press('Escape');
		await expect(page.locator('[data-slot="popover-content"]')).toBeHidden();
		await controls.selectMember('Alice Chen');

		await controls.submitButton.click();
		await expect(controls.code).toBeFocused();
		await controls.setCode('123456');

		await controls.submitButton.click();
		await expect.poll(controls.submittedValue).toEqual({
			name: 'Example',
			dateOfBirth: dateInCurrentMonth(15),
			country: 'JP',
			gender: 'female',
			agreeToTerms: true,
			job: 'designer',
			age: 18,
			isAdult: true,
			description: 'A sufficiently long description',
			accountType: 'personal',
			categories: ['blog'],
			interests: ['react', 'angular', 'next'],
			members: [
				{
					id: '1',
					name: 'Alice Chen',
					email: 'alice@example.com',
					role: 'developer',
				},
			],
			code: '123456',
		});

		await expect
			.poll(() => new URL(page.url()).searchParams.getAll('country'))
			.toEqual(['JP']);
		await expect
			.poll(() => new URL(page.url()).searchParams.getAll('categories'))
			.toEqual(['blog']);
		await expect
			.poll(() => new URL(page.url()).searchParams.getAll('interests'))
			.toEqual(['react', 'angular', 'next']);
		await expect
			.poll(() =>
				Array.from(new URL(page.url()).searchParams).filter(([name]) =>
					name.startsWith('members'),
				),
			)
			.toEqual([
				['members[0].id', '1'],
				['members[0].name', 'Alice Chen'],
				['members[0].email', 'alice@example.com'],
				['members[0].role', 'developer'],
			]);
	});

	test('updated defaults and reset', async ({ page }) => {
		const defaults = new URLSearchParams([
			['name', 'Tester'],
			['dateOfBirth', '2025-04-30T00:00:00.000Z'],
			['country', 'IT'],
			['gender', 'male'],
			['agreeToTerms', 'on'],
			['job', 'developer'],
			['age', '60'],
			['isAdult', 'on'],
			['description', 'Initial description'],
			['accountType', 'personal'],
			['categories', 'guide'],
			['categories', 'tutorial'],
			['interests', 'react'],
			['interests', 'next'],
			['interests', 'glimmer'],
			['members[0].id', '2'],
			['members[0].name', 'Bob Smith'],
			['members[0].email', 'bob@example.com'],
			['members[0].role', 'designer'],
			['code', '543210'],
		]);
		const controls = await getForm(page, defaults);
		const submittedDate = dateInCurrentMonth(15);

		await controls.name.fill('Submitted');
		await controls.selectDate(15);
		await controls.selectCountry('Japan');
		await controls.gender.getByRole('radio', { name: 'female' }).click();
		await controls.selectJob('Designer');
		await controls.age.press('Home');
		for (let value = 0; value < 25; value += 1) {
			await controls.age.press('ArrowRight');
		}
		await controls.description.fill('Submitted description');
		await controls.accountType.getByRole('radio', { name: 'Business' }).click();
		for (const category of ['Guide', 'Tutorial', 'Blog']) {
			await controls.categories.getByRole('button', { name: category }).click();
		}
		for (const interest of [
			'React',
			'Next',
			'Glimmer',
			'Vue',
			'Svelte',
			'Angular',
		]) {
			await controls.interests
				.getByRole('checkbox', { name: interest })
				.click();
		}
		await controls.removeMember('Bob Smith');
		await controls.selectMember('Alice Chen');
		await controls.setCode('654321');
		await controls.submitButton.click();

		const submittedValue = {
			name: 'Submitted',
			dateOfBirth: submittedDate,
			country: 'JP',
			gender: 'female',
			agreeToTerms: true,
			job: 'designer',
			age: 25,
			isAdult: true,
			description: 'Submitted description',
			accountType: 'business',
			categories: ['blog'],
			interests: ['vue', 'svelte', 'angular'],
			members: [
				{
					id: '1',
					name: 'Alice Chen',
					email: 'alice@example.com',
					role: 'developer',
				},
			],
			code: '654321',
		};
		await expect.poll(controls.submittedValue).toEqual(submittedValue);
		const submittedDateLabel = await controls.dateOfBirth.innerText();

		await controls.name.fill('Changed');
		await controls.selectDate(20);
		await controls.selectCountry('Italy');
		await controls.gender.getByRole('radio', { name: 'other' }).click();
		await controls.agreeToTerms.click();
		await controls.selectJob('Manager');
		await controls.age.press('End');
		await controls.isAdult.click();
		await controls.description.fill('Changed description');
		await controls.accountType.getByRole('radio', { name: 'Personal' }).click();
		await controls.categories.getByRole('button', { name: 'Blog' }).click();
		await controls.categories.getByRole('button', { name: 'Guide' }).click();
		await controls.interests.getByRole('checkbox', { name: 'Vue' }).click();
		await controls.interests.getByRole('checkbox', { name: 'Next' }).click();
		await controls.removeMember('Alice Chen');
		await controls.selectMember('Carol Davis');
		await controls.setCode('111111');

		await controls.resetButton.click();

		await expect(controls.name).toHaveValue('Submitted');
		await expect(controls.dateOfBirth).toHaveText(submittedDateLabel);
		await expect(controls.country).toContainText('Japan');
		await expect(
			controls.gender.getByRole('radio', { name: 'female' }),
		).toBeChecked();
		await expect(controls.agreeToTerms).toBeChecked();
		await expect(controls.job).toContainText('Designer');
		await expect(controls.age).toHaveAttribute('aria-valuenow', '25');
		await expect(controls.isAdult).toBeChecked();
		await expect(controls.description).toHaveValue('Submitted description');
		await expect(
			controls.accountType.getByRole('radio', { name: 'Business' }),
		).toBeChecked();
		await expect(
			controls.categories.getByRole('button', { name: 'Blog' }),
		).toHaveAttribute('data-state', 'on');
		await expect(
			controls.categories.getByRole('button', { name: 'Guide' }),
		).toHaveAttribute('data-state', 'off');
		for (const interest of ['Vue', 'Svelte', 'Angular']) {
			await expect(
				controls.interests.getByRole('checkbox', { name: interest }),
			).toBeChecked();
		}
		await expect(controls.members).toContainText('Alice Chen');
		await expect(controls.members).not.toContainText('Carol Davis');
		await expect(controls.code).toHaveValue('654321');

		await controls.submitButton.click();
		await expect.poll(controls.submittedValue).toEqual(submittedValue);
	});
});
