import { expect, test, type Page } from '@playwright/test';

test.describe('tanstack-start', () => {
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

			await form.submitButton.click();
			await expect(form.email).toHaveAccessibleDescription('Email is required');
			await expect(form.password).toHaveAccessibleDescription(
				'Password is required',
			);

			await form.email.fill('test@example.com');
			await form.email.blur();
			await expect(form.email).toHaveAccessibleDescription('');
			await form.remember.check();
			await form.password.fill('password123');
			await form.password.blur();
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
				await page.goto(path);

				return {
					container: page.locator('form'),
					submitButton: page.getByRole('button', { name: 'Signup' }),
					submittedValue: () =>
						page.locator('pre').innerText().then(JSON.parse),
					username: page.getByLabel('Username'),
					password: page.getByLabel('Password', { exact: true }),
					confirmPassword: page.getByLabel('Confirm Password'),
				};
			}

			test('submit', async ({ page, browserName }) => {
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

				if (browserName !== 'firefox') {
					await expect.poll(form.submittedValue).toMatchObject({
						username: 'example',
						password: 'secret',
						confirmPassword: 'secret',
					});
				}
			});

			if (name === 'signup') {
				test('server validation', async ({ page }) => {
					const form = await getForm(page);

					await form.username.fill('example');
					await form.password.fill('not-secret');
					await form.confirmPassword.fill('not-secret');
					await form.submitButton.click();

					await expect(form.container.locator('.form-error')).toHaveText(
						'Server error: Please try again later',
					);
				});
			}
		});
	}

	test.describe('todos', () => {
		let testId = 0;

		async function getForm(page: Page) {
			await page.goto(`/todos?id=test-${++testId}-${Date.now()}`);

			return {
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
			await page
				.locator('fieldset')
				.nth(1)
				.getByRole('button', { name: 'Delete' })
				.click();

			await form.saveButton.click();
			await expect(form.saveButton).toBeDisabled({ timeout: 10000 });
			await expect(form.title).toHaveValue('My Todo List');
			await expect(page.getByLabel('Task #1')).toHaveValue('Task C');
			await expect(page.getByLabel('Task #2')).toHaveValue('Task B');

			await page.reload({ waitUntil: 'networkidle' });
			await expect(form.title).toHaveValue('My Todo List');
			await expect(page.getByLabel('Task #1')).toHaveValue('Task C');
			await expect(page.getByLabel('Task #2')).toHaveValue('Task B');
		});
	});

	test.describe('file-upload', () => {
		test('submit', async ({ page }) => {
			await page.goto('/file-upload');

			await page.getByLabel('Title').fill('Attachment & notes #1');
			await page.getByLabel('File').setInputFiles({
				name: 'example & #1.txt',
				mimeType: 'text/plain',
				buffer: Buffer.from('TanStack Start upload'),
			});
			await page.getByRole('button', { name: 'Submit' }).click();

			await expect
				.poll(() => page.locator('pre').innerText().then(JSON.parse))
				.toEqual({
					title: 'Attachment & notes #1',
					file: {
						name: 'example & #1.txt',
						size: 21,
						type: 'text/plain',
					},
				});
		});
	});
});
