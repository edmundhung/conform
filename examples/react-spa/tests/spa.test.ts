import { expect, test, type Page } from '@playwright/test';

test.describe('react-spa', () => {
	test.describe('login', () => {
		async function getForm(page: Page) {
			await page.goto('/login');

			return {
				submitButton: page.getByRole('button', { name: 'Login' }),
				submittedValue: () => page.locator('pre').innerText().then(JSON.parse),
				email: page.getByLabel('Email'),
				password: page.getByLabel('Password'),
				remember: page.getByLabel('Remember me'),
			};
		}

		test('submit', async ({ page }) => {
			const form = await getForm(page);

			await form.email.fill('person@example.com');
			await form.password.fill('secret');
			await form.remember.check();
			await form.submitButton.click();

			await expect.poll(form.submittedValue).toMatchObject({
				email: 'person@example.com',
				password: 'secret',
				remember: 'on',
			});
		});
	});

	for (const { name, path } of [
		{ name: 'signup', path: '/signup' },
		{ name: 'signup-async-schema', path: '/signup-async-schema' },
	]) {
		test.describe(name, () => {
			async function getForm(page: Page) {
				await page.goto(path);

				return {
					submitButton: page.getByRole('button', { name: 'Signup' }),
					submittedValue: () =>
						page.locator('pre').innerText().then(JSON.parse),
					username: page.getByLabel('Username'),
					password: page.getByLabel('Password', { exact: true }),
					confirmPassword: page.getByLabel('Confirm Password'),
				};
			}

			test('submit', async ({ page }) => {
				const form = await getForm(page);

				await form.username.fill('example');
				await form.password.fill('secret');
				await form.confirmPassword.fill('secret');
				await form.submitButton.click();

				await expect.poll(form.submittedValue).toMatchObject({
					username: 'example',
					password: 'secret',
					confirmPassword: 'secret',
				});
			});
		});
	}

	test.describe('todos', () => {
		async function getForm(page: Page) {
			await page.goto('/todos');

			return {
				saveButton: page.getByRole('button', { name: 'Save' }),
				resetButton: page.getByRole('button', { name: 'Reset' }),
				addTaskButton: page.getByRole('button', { name: 'Add task' }),
				title: page.getByLabel('Title'),
			};
		}

		test('dirty state and reset', async ({ page }) => {
			const form = await getForm(page);

			await expect(form.saveButton).toBeDisabled();
			await form.addTaskButton.click();
			await form.title.fill('Release checklist');
			await page.getByLabel('Task #1').fill('Run browser tests');
			await expect(form.saveButton).toBeEnabled();

			await form.saveButton.click();
			await expect(form.saveButton).toBeDisabled({ timeout: 5_000 });
			await expect(form.title).toHaveValue('Release checklist');
			await expect(page.getByLabel('Task #1')).toHaveValue('Run browser tests');

			await form.title.fill('Temporary edit');
			await page.getByLabel('Task #1').fill('Temporary task');
			await expect(form.saveButton).toBeEnabled();
			await form.resetButton.click();

			await expect(form.title).toHaveValue('Release checklist');
			await expect(page.getByLabel('Task #1')).toHaveValue('Run browser tests');
			await expect(form.saveButton).toBeDisabled();
		});
	});
});
