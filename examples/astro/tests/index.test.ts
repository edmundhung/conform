import { test, expect, type Page } from '@playwright/test';

test.describe('astro', () => {
	test.describe('login', () => {
		async function getForm(page: Page) {
			await page.goto('/login', { waitUntil: 'networkidle' });

			return {
				container: page.locator('form'),
				submitButton: page.getByRole('button', { name: 'Login' }),
				submittedValue: () =>
					page.locator('main > div > pre').innerText().then(JSON.parse),
				email: page.getByLabel('Email'),
				password: page.getByLabel('Password'),
				remember: page.getByLabel('Remember me'),
			};
		}

		test('submit', async ({ page }) => {
			const form = await getForm(page);

			await form.submitButton.click();
			await expect(form.email).toHaveAccessibleDescription('Email is required');
			await expect(form.password).toHaveAccessibleDescription(
				'Password is required',
			);

			await form.email.fill('test@example.com');
			await form.password.focus();
			await expect(form.email).toHaveAccessibleDescription('');

			await form.remember.check();

			await form.password.fill('password123');
			await form.submitButton.focus();
			await expect(form.password).toHaveAccessibleDescription('');

			await form.submitButton.click();

			await expect.poll(form.submittedValue).toMatchObject({
				email: 'test@example.com',
				password: 'password123',
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
				await page.goto(path, { waitUntil: 'networkidle' });

				return {
					container: page.locator('form'),
					submitButton: page.getByRole('button', { name: 'Signup' }),
					submittedValue: () =>
						page.locator('main > div > pre').innerText().then(JSON.parse),
					username: page.getByLabel('Username'),
					password: page.getByLabel('Password', { exact: true }),
					confirmPassword: page.getByLabel('Confirm Password'),
				};
			}

			test('submit', async ({ page }) => {
				const form = await getForm(page);

				await form.submitButton.click();
				await expect(form.username).toHaveAccessibleDescription(
					'Username is required',
				);
				await expect(form.password).toHaveAccessibleDescription(
					'Password is required',
				);
				await expect(form.confirmPassword).toHaveAccessibleDescription(
					'Confirm password is required',
				);

				await form.username.fill('example');
				await expect(form.username).toHaveAccessibleDescription('');

				await form.password.fill('secret');
				await expect(form.password).toHaveAccessibleDescription('');

				await form.confirmPassword.fill('secret');
				await expect(form.confirmPassword).toHaveAccessibleDescription('');

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
		let testId = 0;

		async function getForm(page: Page) {
			await page.goto(`/todos?id=test-${++testId}-${Date.now()}`, {
				waitUntil: 'networkidle',
			});

			return {
				container: page.locator('form'),
				saveButton: page.getByRole('button', { name: 'Save' }),
				addTaskButton: page.getByRole('button', { name: 'Add task' }),
				title: page.getByLabel('Title'),
			};
		}

		test('submit', async ({ page }) => {
			const form = await getForm(page);

			await form.addTaskButton.click();
			await form.addTaskButton.click();
			await form.addTaskButton.click();

			await form.title.fill('My Todo List');
			await page.getByLabel('Task #1').fill('Task A');
			await page.getByLabel('Task #2').fill('Task B');
			await page.getByLabel('Task #3').fill('Task C');

			await page
				.locator('fieldset')
				.nth(2)
				.getByRole('button', { name: 'Move to top' })
				.click();
			await expect(page.getByLabel('Task #1')).toHaveValue('Task C');
			await expect(page.getByLabel('Task #2')).toHaveValue('Task A');
			await expect(page.getByLabel('Task #3')).toHaveValue('Task B');

			await page
				.locator('fieldset')
				.nth(1)
				.getByRole('button', { name: 'Clear' })
				.click();
			await expect(page.getByLabel('Task #2')).toHaveValue('');

			await page
				.locator('fieldset')
				.nth(1)
				.getByRole('button', { name: 'Delete' })
				.click();
			await expect(page.locator('fieldset')).toHaveCount(2);
			await expect(page.getByLabel('Task #1')).toHaveValue('Task C');
			await expect(page.getByLabel('Task #2')).toHaveValue('Task B');

			await form.saveButton.click();
			await expect(form.saveButton).toBeDisabled({ timeout: 5000 });

			await expect(form.title).toHaveValue('My Todo List');
			await expect(page.getByLabel('Task #1')).toHaveValue('Task C');
			await expect(page.getByLabel('Task #2')).toHaveValue('Task B');

			await page.reload({ waitUntil: 'networkidle' });
			await expect(form.title).toHaveValue('My Todo List');
			await expect(page.getByLabel('Task #1')).toHaveValue('Task C');
			await expect(page.getByLabel('Task #2')).toHaveValue('Task B');
		});
	});
});
