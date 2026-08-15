import { test, expect, type Page } from '@playwright/test';

test.describe('shadcn-ui', () => {
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
				name: page.locator('form').getByLabel('Name'),
				dateOfBirth: page.locator('form').getByLabel('Date of Birth'),
				country: page.locator('form').getByLabel('Country'),
				gender: page
					.locator('form')
					.getByRole('radiogroup', { name: 'Gender' }),
				agreeToTerms: page.locator('form').getByLabel('Agree to terms'),
				job: page.locator('form').getByLabel('Job'),
				age: page.getByRole('slider'),
				isAdult: page.locator('form').getByLabel('Is adult'),
				description: page.locator('form').getByLabel('Description'),
				accountType: page
					.locator('form')
					.getByRole('radiogroup', { name: 'Account type' }),
				categories: page
					.locator('form')
					.getByRole('toolbar', { name: 'Categories' }),
				interests: page
					.locator('form')
					.getByRole('group', { name: 'Interests' }),
				members: page
					.locator('form')
					.getByRole('combobox', { name: 'Team Members' }),
				code: page.locator('form').getByLabel('Code'),
			};
		}

		test('focus', async ({ page }) => {
			const form = await getForm(page);

			await form.submitButton.click();
			await expect(form.name).toBeFocused();
			await form.name.fill('Example');

			await form.submitButton.click();
			await expect(form.dateOfBirth).toBeFocused();
			await form.container.press('Space');
			await form.container.press('Enter');

			await form.submitButton.click();
			await expect(form.country).toBeFocused();
			await form.container.press('Space');
			await form.container.press('ArrowDown');
			await form.container.press('Enter');

			await form.submitButton.click();
			await expect(form.gender.getByRole('radio').first()).toBeFocused();
			await form.container.press('ArrowRight');

			await form.submitButton.click();
			await expect(form.agreeToTerms).toBeFocused();
			await form.container.press('Space');

			await form.submitButton.click();
			await expect(form.job).toBeFocused();
			await form.container.press('Space');
			await form.container.press('ArrowDown');
			await form.container.press('Enter');

			await form.submitButton.click();
			await expect(form.age).toBeFocused();
			for (let i = 0; i < 18; i++) {
				await form.age.press('ArrowRight');
			}

			await form.submitButton.click();
			await expect(form.isAdult).toBeFocused();
			await form.container.press('Space');

			await form.submitButton.click();
			await expect(form.description).toBeFocused();
			await form.description.fill(
				'Foo barLorem ipsum dolor sit amet, consectetur adipiscing elit. Donec egestas metus at consequat lobortis.',
			);

			await form.submitButton.click();
			await expect(form.accountType.getByRole('radio').first()).toBeFocused();
			await form.container.press('Space');

			await form.submitButton.click();
			await expect(form.categories.getByRole('button').first()).toBeFocused();
			await form.container.press('Space');

			await form.submitButton.click();
			await expect(form.interests.getByRole('checkbox').first()).toBeFocused();
			await form.container.press('Space');
			await form.interests.getByRole('checkbox', { name: 'Angular' }).click();
			await form.interests.getByRole('checkbox', { name: 'Next' }).click();

			// Select a team member before submitting
			await form.submitButton.click();
			await expect(form.members).toBeFocused();
			await form.members.click();
			await page.getByText('Alice Chen').click();
			await form.members.press('Escape');

			await form.submitButton.click();
			await expect(form.code).toBeFocused();
			await form.code.pressSequentially('123456');

			await form.submitButton.click();
			await expect.poll(form.submittedValue).toEqual({
				name: 'Example',
				dateOfBirth: `${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`,
				country: 'AX',
				gender: 'female',
				agreeToTerms: true,
				job: 'designer',
				age: 18,
				isAdult: true,
				description:
					'Foo barLorem ipsum dolor sit amet, consectetur adipiscing elit. Donec egestas metus at consequat lobortis.',
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
		});

		test('blur', async ({ page }) => {
			const form = await getForm(page);

			await form.name.click();
			await expect(form.name).toHaveAccessibleDescription('');
			await form.resetButton.focus();
			await expect(form.name).toHaveAccessibleDescription('Invalid input');

			await form.dateOfBirth.click();
			await expect(form.dateOfBirth).toHaveAccessibleDescription('');
			await form.resetButton.focus();
			await expect(form.dateOfBirth).toHaveAccessibleDescription(
				'Invalid input',
			);

			await form.country.click();
			await expect(form.country).toHaveAccessibleDescription('');
			await form.resetButton.focus();
			await expect(form.country).toHaveAccessibleDescription('Invalid input');

			await form.gender.getByRole('radio').last().click();
			await form.gender.getByRole('radio').last().focus();
			await expect(form.gender).toHaveAccessibleDescription('');
			await form.resetButton.focus();
			await expect(form.gender).toHaveAccessibleDescription('Invalid input');

			await form.agreeToTerms.click();
			await form.agreeToTerms.click();
			await form.agreeToTerms.focus();
			await expect(form.agreeToTerms).toHaveAccessibleDescription('');
			await form.resetButton.focus();
			await expect(form.agreeToTerms).toHaveAccessibleDescription(
				'Invalid input',
			);

			await form.job.click();
			await expect(form.job).toHaveAccessibleDescription('');
			await form.job.press('Escape');
			await form.resetButton.focus();
			await expect(form.job).toHaveAccessibleDescription('Invalid input');

			await form.age.click();
			await expect(form.age).toHaveAccessibleDescription('');
			await form.resetButton.focus();
			await expect(form.age).toHaveAccessibleDescription('Invalid input');

			await form.isAdult.click();
			await form.isAdult.click();
			await form.isAdult.focus();
			await expect(form.isAdult).toHaveAccessibleDescription('');
			await form.resetButton.focus();
			await expect(form.isAdult).toHaveAccessibleDescription('Invalid input');

			await form.description.click();
			await expect(form.description).toHaveAccessibleDescription('');
			await form.resetButton.focus();
			await expect(form.description).toHaveAccessibleDescription(
				'Invalid input',
			);

			await form.accountType.getByRole('radio').first().click();
			await form.accountType.getByRole('radio').first().click();
			await form.accountType.getByRole('radio').first().focus();
			await expect(form.accountType).toHaveAccessibleDescription('');
			await form.resetButton.focus();
			await expect(form.accountType).toHaveAccessibleDescription(
				'Invalid input',
			);

			await form.categories.getByRole('button').first().click();
			await form.categories.getByRole('button').first().click();
			await form.categories.getByRole('button').first().focus();
			await expect(form.categories).toHaveAccessibleDescription('');
			await form.resetButton.focus();
			await expect(form.categories).toHaveAccessibleDescription(
				'Invalid input',
			);

			await form.interests.getByRole('checkbox').first().click();
			await form.interests.getByRole('checkbox').first().click();
			await form.interests.getByRole('checkbox').first().focus();
			await expect(
				form.interests.getByRole('checkbox').first(),
			).toHaveAccessibleDescription('');
			await form.resetButton.focus();
			await expect(
				form.interests.getByRole('checkbox').last(),
			).toHaveAccessibleDescription('Invalid input');

			await form.members.click();
			await expect(form.members).toHaveAccessibleDescription('');
			await form.members.press('Escape');
			await form.resetButton.focus();
			await expect(form.members).toHaveAccessibleDescription('Invalid input');

			await form.code.click();
			await expect(form.code).toHaveAccessibleDescription('');
			await form.resetButton.focus();
			await expect(form.code).toHaveAccessibleDescription('Invalid input');
		});

		test('reset', async ({ page }) => {
			const form = await getForm(page);
			const defaultFormData = await form.formData();

			await form.name.fill('Example');
			await form.dateOfBirth.click();
			await page.getByText('15').click();
			await form.country.click();
			await page.getByText('Japan').click();
			await form.country.click();
			await form.gender.getByRole('radio', { name: 'female' }).click();
			await form.agreeToTerms.click();
			await form.job.click();
			await page.getByRole('option', { name: 'Designer' }).click();
			await form.age.click();
			for (let i = 0; i < 18; i++) {
				await form.age.press('ArrowRight');
			}
			await form.isAdult.click();
			await form.description.fill(
				'Foo barLorem ipsum dolor sit amet, consectetur adipiscing elit. Donec egestas metus at consequat lobortis.',
			);
			await form.accountType.getByRole('radio', { name: 'Business' }).click();
			await form.categories.getByRole('button', { name: 'Blog' }).click();
			await form.categories.getByRole('button', { name: 'Guide' }).click();
			await form.interests.getByRole('checkbox', { name: 'React' }).click();
			await form.interests.getByRole('checkbox', { name: 'Vue' }).click();
			await form.interests.getByRole('checkbox', { name: 'Angular' }).click();
			await form.members.click();
			await page.getByText('Alice Chen').click();
			await form.members.press('Escape');
			await form.code.click();
			await form.code.press('Backspace');
			await form.code.press('Backspace');
			await form.code.press('Backspace');
			await form.code.pressSequentially('123456');

			await expect(form.name).toHaveAccessibleDescription('');
			await expect(form.dateOfBirth).toHaveAccessibleDescription('');
			await expect(form.country).toHaveAccessibleDescription('');
			await expect(form.gender).toHaveAccessibleDescription('');
			await expect(form.agreeToTerms).toHaveAccessibleDescription('');
			await expect(form.job).toHaveAccessibleDescription('');
			await expect(form.age).toHaveAccessibleDescription('');
			await expect(form.isAdult).toHaveAccessibleDescription('');
			await expect(form.description).toHaveAccessibleDescription('');
			await expect(form.accountType).toHaveAccessibleDescription('');
			await expect(form.categories).toHaveAccessibleDescription('');
			await expect(
				form.interests.getByRole('checkbox').first(),
			).toHaveAccessibleDescription('');
			await expect(form.members).toHaveAccessibleDescription('');
			await expect(form.code).toHaveAccessibleDescription('');

			await form.resetButton.click();
			await expect.poll(form.formData).toEqual(defaultFormData);
			await expect(form.members).toContainText('Select team members');
			await form.container.evaluate((element) =>
				(element as HTMLFormElement).requestSubmit(),
			);
			await expect(form.name).toHaveAccessibleDescription('Invalid input');
			await expect(form.dateOfBirth).toHaveAccessibleDescription(
				'Invalid input',
			);
			await expect(form.country).toHaveAccessibleDescription('Invalid input');
			await expect(form.gender).toHaveAccessibleDescription('Invalid input');
			await expect(form.agreeToTerms).toHaveAccessibleDescription(
				'Invalid input',
			);
			await expect(form.job).toHaveAccessibleDescription('Invalid input');
			await expect(form.age).toHaveAccessibleDescription('Invalid input');
			await expect(form.isAdult).toHaveAccessibleDescription('Invalid input');
			await expect(form.description).toHaveAccessibleDescription(
				'Invalid input',
			);
			await expect(form.accountType).toHaveAccessibleDescription(
				'Invalid input',
			);
			await expect(form.categories).toHaveAccessibleDescription(
				'Invalid input',
			);
			await expect(
				form.interests.getByRole('checkbox').first(),
			).toHaveAccessibleDescription('Invalid input');
			await expect(form.members).toHaveAccessibleDescription('Invalid input');
			await expect(form.code).toHaveAccessibleDescription('Invalid input');
		});

		test('default value', async ({ page }) => {
			const searchParams = new URLSearchParams([
				['name', 'Tester'],
				['dateOfBirth', '2025-04-30T00:00:00.000Z'],
				['country', 'IT'],
				['gender', 'male'],
				['agreeToTerms', 'on'],
				['job', 'developer'],
				['age', '60'],
				['isAdult', 'on'],
				['description', 'Hello World'],
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
			const form = await getForm(page, searchParams);
			const submittedValue = {
				name: 'Tester',
				dateOfBirth: '2025-04-30T00:00:00.000Z',
				country: 'IT',
				gender: 'male',
				agreeToTerms: true,
				job: 'developer',
				age: 60,
				isAdult: true,
				description: 'Hello World',
				accountType: 'personal',
				categories: ['guide', 'tutorial'],
				interests: ['react', 'next', 'glimmer'],
				members: [
					{
						id: '2',
						name: 'Bob Smith',
						email: 'bob@example.com',
						role: 'designer',
					},
				],
				code: '543210',
			};

			await expect.poll(form.formData).toEqual(Array.from(searchParams));

			await form.submitButton.click();
			await expect.poll(form.submittedValue).toEqual(submittedValue);

			const submittedParams = new URL(page.url()).searchParams;
			for (const [name, value] of [
				['dateOfBirth', '2025-04-30T00:00:00.000Z'],
				['country', 'IT'],
				['gender', 'male'],
				['agreeToTerms', 'on'],
				['job', 'developer'],
				['age', '60'],
				['isAdult', 'on'],
				['accountType', 'personal'],
				['code', '543210'],
			] as const) {
				expect(submittedParams.getAll(name)).toEqual([value]);
			}
			expect(submittedParams.getAll('categories')).toEqual([
				'guide',
				'tutorial',
			]);
			expect(submittedParams.getAll('interests')).toEqual([
				'react',
				'next',
				'glimmer',
			]);
			expect(
				Array.from(submittedParams).filter(([name]) =>
					name.startsWith('members'),
				),
			).toEqual([
				['members[0].id', '2'],
				['members[0].name', 'Bob Smith'],
				['members[0].email', 'bob@example.com'],
				['members[0].role', 'designer'],
			]);

			await form.name.fill('Example');
			await form.dateOfBirth.click();
			await page.getByText('15').click();
			await form.country.click();
			await page.getByText('Japan').click();
			await form.country.click();
			await form.gender.getByRole('radio', { name: 'female' }).click();
			await form.agreeToTerms.click();
			await form.job.click();
			await page.getByRole('option', { name: 'Designer' }).click();
			await form.age.dragTo(page.getByText('60'));
			await form.isAdult.click();
			await form.description.fill(
				'Foo barLorem ipsum dolor sit amet, consectetur adipiscing elit. Donec egestas metus at consequat lobortis.',
			);
			await form.accountType.getByRole('radio', { name: 'Business' }).click();
			await form.categories.getByRole('button', { name: 'Blog' }).click();
			await form.categories.getByRole('button', { name: 'Guide' }).click();
			await form.interests.getByRole('checkbox', { name: 'React' }).click();
			await form.interests.getByRole('checkbox', { name: 'Vue' }).click();
			await form.interests.getByRole('checkbox', { name: 'Angular' }).click();
			await form.members.click();
			await page.getByText('Alice Chen').click();
			await form.members.press('Escape');
			await form.code.click();
			await form.code.press('Backspace');
			await form.code.press('Backspace');
			await form.code.press('Backspace');
			await form.code.pressSequentially('123');

			await form.resetButton.click();
			await expect.poll(form.formData).toEqual(Array.from(searchParams));
			await form.submitButton.click();
			await expect.poll(form.submittedValue).toEqual(submittedValue);

			await form.name.fill('Example');
			await form.dateOfBirth.click();
			await page.getByText('15').click();
			await form.country.click();
			await page.getByText('Japan').click();
			await form.gender.getByRole('radio', { name: 'female' }).click();
			await form.agreeToTerms.click();
			await form.job.click();
			await page.getByRole('option', { name: 'Designer' }).click();
			await form.age.press('Home');
			await form.isAdult.click();
			await form.description.fill('Changed description');
			await form.accountType.getByRole('radio', { name: 'Business' }).click();
			await form.categories.getByRole('button', { name: 'Blog' }).click();
			await form.categories.getByRole('button', { name: 'Guide' }).click();
			await form.members.click();
			await page.getByText('Alice Chen').click();
			await form.members.press('Escape');
			await form.code.fill('123456');

			await form.container.evaluate((element) =>
				(element as HTMLFormElement).reset(),
			);

			await expect.poll(form.formData).toEqual(Array.from(searchParams));
			await expect(form.name).toHaveValue('Tester');
			await expect(form.dateOfBirth).toContainText('April 30th, 2025');
			await expect(form.country).toContainText('Italy');
			await expect(
				form.gender.getByRole('radio', { name: 'male', exact: true }),
			).toBeChecked();
			await expect(form.agreeToTerms).toBeChecked();
			await expect(form.job).toContainText('Developer');
			await expect(form.age).toHaveAttribute('aria-valuenow', '60');
			await expect(form.isAdult).toBeChecked();
			await expect(form.description).toHaveValue('Hello World');
			await expect(
				form.accountType.getByRole('radio', { name: 'Personal' }),
			).toBeChecked();
			await expect(
				form.categories.getByRole('button', { name: 'Guide' }),
			).toHaveAttribute('data-state', 'on');
			await expect(
				form.categories.getByRole('button', { name: 'Tutorial' }),
			).toHaveAttribute('data-state', 'on');
			await expect(form.members).toContainText('Bob Smith');
			await expect(form.code).toHaveValue('543210');

			await form.submitButton.click();
			await expect.poll(form.submittedValue).toEqual(submittedValue);
		});
	});
});
