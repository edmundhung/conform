import { test, expect, type Page } from '@playwright/test';

test.describe('shadcn-ui', () => {
	async function getForm(page: Page, searchParams?: URLSearchParams) {
		await page.goto(`/?${searchParams}`);

		return {
			container: page.locator('form'),
			heading: page.getByRole('heading', { name: 'Shadcn UI Example' }),
			submitButton: page.locator('form').getByText('Submit'),
			resetButton: page.locator('form').getByText('Reset'),
			submittedValue: () =>
				page.locator('form').locator('pre').innerText().then(JSON.parse),
			name: page.locator('form').getByLabel('Name'),
			dateOfBirth: page.locator('form').getByLabel('Date of Birth'),
			country: page.locator('form').getByLabel('Country'),
			gender: page.locator('form').getByRole('radiogroup'),
			agreeToTerms: page.locator('form').getByLabel('Agree to terms'),
			job: page.locator('form').getByLabel('Job'),
			age: page.getByRole('slider'),
			isAdult: page.locator('form').getByLabel('Is adult'),
			description: page.locator('form').getByLabel('Description'),
			accountType: page
				.locator('form')
				.getByRole('group', { name: 'Account type' }),
			categories: page
				.locator('form')
				.getByRole('group', { name: 'Categories' }),
			interests: page.locator('form').getByRole('group', { name: 'Interests' }),
			code: page.locator('form').getByLabel('Code'),
		};
	}

	test('focus', async ({ page, browserName }) => {
		// TODO: Fix focus test in WebKit
		test.fixme(browserName === 'webkit');

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
		await form.container.press('Tab');
		await form.container.press('Tab');
		await form.container.press('Tab');
		await form.container.press('Space');
		await form.container.press('Tab');
		await form.container.press('Tab');
		await form.container.press('Space');

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
			code: '123456',
		});
	});

	test('blur', async ({ page, browserName }) => {
		// TODO: Fix blur test in WebKit
		test.fixme(browserName === 'webkit');

		const form = await getForm(page);

		await form.name.click();
		await expect(form.name).toHaveAccessibleDescription('');
		await form.heading.click();
		await expect(form.name).toHaveAccessibleDescription('Required');

		await form.dateOfBirth.click();
		await expect(form.dateOfBirth).toHaveAccessibleDescription('');
		await form.heading.click();
		await expect(form.dateOfBirth).toHaveAccessibleDescription('Required');

		await form.country.click();
		await expect(form.country).toHaveAccessibleDescription('');
		await form.heading.click();
		await expect(form.country).toHaveAccessibleDescription('Required');

		await form.gender.getByRole('radio').last().click();
		await expect(
			form.gender.getByRole('radio').last(),
		).toHaveAccessibleDescription('');
		await form.heading.click();
		await expect(
			form.gender.getByRole('radio').last(),
		).toHaveAccessibleDescription(
			`Invalid enum value. Expected 'male' | 'female' | 'other', received 'invalid'`,
		);

		await form.agreeToTerms.click();
		await form.agreeToTerms.click();
		await expect(form.agreeToTerms).toHaveAccessibleDescription('');
		await form.heading.click();
		await expect(form.agreeToTerms).toHaveAccessibleDescription('Required');

		await form.job.click();
		await expect(form.job).toHaveAccessibleDescription('');
		await form.job.press('Escape');
		await form.heading.click();
		await expect(form.job).toHaveAccessibleDescription('Required');

		// await form.age.click();
		// await expect(form.age).toHaveAccessibleDescription('');
		// await form.heading.click();
		// await expect(form.age).toHaveAccessibleDescription('Required');

		await form.isAdult.click();
		await form.isAdult.click();
		await expect(form.isAdult).toHaveAccessibleDescription('');
		await form.heading.click();
		await expect(form.isAdult).toHaveAccessibleDescription('Required');

		await form.description.click();
		await expect(form.description).toHaveAccessibleDescription('');
		await form.heading.click();
		await expect(form.description).toHaveAccessibleDescription('Required');

		await form.accountType.getByRole('radio').first().click();
		await form.accountType.getByRole('radio').first().click();
		await expect(
			form.accountType.getByRole('radio').first(),
		).toHaveAccessibleDescription('');
		await form.heading.click();
		await expect(
			form.accountType.getByRole('radio').first(),
		).toHaveAccessibleDescription('Required');

		await form.categories.getByRole('button').first().click();
		await form.categories.getByRole('button').first().click();
		await expect(
			form.categories.getByRole('button').first(),
		).toHaveAccessibleDescription('');
		await form.heading.click();
		await expect(
			form.categories.getByRole('button').first(),
		).toHaveAccessibleDescription('Array must contain at least 1 element(s)');

		await form.interests.getByRole('checkbox').first().click();
		await form.interests.getByRole('checkbox').first().click();
		await expect(
			form.interests.getByRole('checkbox').first(),
		).toHaveAccessibleDescription('');
		await form.heading.click();
		await expect(
			form.interests.getByRole('checkbox').last(),
		).toHaveAccessibleDescription('Array must contain at least 3 element(s)');

		// await form.code.click();
		// await expect(form.code).toHaveAccessibleDescription('');
		// await form.heading.click();
		// await expect(form.code).toHaveAccessibleDescription('Required');
	});

	test('reset', async ({ page, browserName }) => {
		// TODO: Fix reset test in WebKit and Firefox
		test.fixme(browserName === 'webkit' || browserName === 'firefox');
		// TODO: Fix reset test in WebKit and Firefox
		return;

		const form = await getForm(page);

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
		await form.code.click();
		await form.code.press('Backspace');
		await form.code.press('Backspace');
		await form.code.press('Backspace');
		await form.code.pressSequentially('123456');

		await expect(form.name).toHaveAccessibleDescription('');
		await expect(form.dateOfBirth).toHaveAccessibleDescription('');
		await expect(form.country).toHaveAccessibleDescription('');
		await expect(
			form.gender.getByRole('radio').first(),
		).toHaveAccessibleDescription('');
		await expect(form.agreeToTerms).toHaveAccessibleDescription('');
		await expect(form.job).toHaveAccessibleDescription('');
		// await expect(form.age).toHaveAccessibleDescription('');
		await expect(form.isAdult).toHaveAccessibleDescription('');
		await expect(form.description).toHaveAccessibleDescription('');
		await expect(
			form.accountType.getByRole('radio').first(),
		).toHaveAccessibleDescription('');
		await expect(
			form.categories.getByRole('button').first(),
		).toHaveAccessibleDescription('');
		await expect(
			form.interests.getByRole('checkbox').first(),
		).toHaveAccessibleDescription('');
		await expect(form.code).toHaveAccessibleDescription('');

		await form.resetButton.click();
		await form.submitButton.click();
		await expect(form.name).toHaveAccessibleDescription('Required');
		await expect(form.dateOfBirth).toHaveAccessibleDescription('Required');
		await expect(form.country).toHaveAccessibleDescription('Required');
		await expect(
			form.gender.getByRole('radio').first(),
		).toHaveAccessibleDescription('Required');
		await expect(form.agreeToTerms).toHaveAccessibleDescription('Required');
		await expect(form.job).toHaveAccessibleDescription('Required');
		// await expect(form.age).toHaveAccessibleDescription('Required');
		await expect(form.isAdult).toHaveAccessibleDescription('Required');
		await expect(form.description).toHaveAccessibleDescription('Required');
		await expect(
			form.accountType.getByRole('radio').first(),
		).toHaveAccessibleDescription('Required');
		await expect(
			form.categories.getByRole('button').first(),
		).toHaveAccessibleDescription('Array must contain at least 1 element(s)');
		await expect(
			form.interests.getByRole('checkbox').first(),
		).toHaveAccessibleDescription('Array must contain at least 3 element(s)');
		await expect(form.code).toHaveAccessibleDescription('Required');
	});

	test('default value', async ({ page, browserName }) => {
		// TODO: Fix default value test in WebKit and Firefox
		test.fixme(browserName === 'webkit' || browserName === 'firefox');

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
			code: '543210',
		};

		await form.submitButton.click();
		await expect.poll(form.submittedValue).toEqual(submittedValue);

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
		await form.code.click();
		await form.code.press('Backspace');
		await form.code.press('Backspace');
		await form.code.press('Backspace');
		await form.code.pressSequentially('123');

		await form.resetButton.click();
		await form.submitButton.click();
		await expect.poll(form.submittedValue).toEqual(submittedValue);
	});
});
