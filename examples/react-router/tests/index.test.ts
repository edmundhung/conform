import { test, expect, type Page } from '@playwright/test';

test.describe('react-router', () => {
	for (const { name, path } of [
		{ name: 'login', path: '/login' },
		{ name: 'login-fetcher', path: '/login-fetcher' },
	]) {
		test.describe(name, () => {
			async function getForm(page: Page) {
				await page.goto(path);

				return {
					submitButton: page.getByRole('button', { name: 'Login' }),
					submittedValue: () =>
						page.locator('pre').innerText().then(JSON.parse),
					email: page.getByLabel('Email'),
					password: page.getByLabel('Password'),
					remember: page.getByLabel('Remember me'),
				};
			}

			test('submit', async ({ page }) => {
				const form = await getForm(page);

				// Submit empty form and verify focus on the first invalid field
				await form.submitButton.click();
				await expect(form.email).toHaveAccessibleDescription(
					'Email is required',
				);
				await expect(form.password).toHaveAccessibleDescription(
					'Password is required',
				);
				// Fill all fields and submit
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

			if (name === 'login-fetcher') {
				test('server validation', async ({ page }) => {
					const form = await getForm(page);

					await form.email.fill('test@example.com');
					await form.password.fill('wrong-password');
					await form.submitButton.click();

					await expect(form.password).toHaveAccessibleDescription(
						'Password is incorrect',
					);

					await form.password.fill('password123');
					await expect(form.password).toHaveAccessibleDescription('');
					await form.submitButton.click();

					await expect.poll(form.submittedValue).toMatchObject({
						email: 'test@example.com',
						password: 'password123',
					});
				});
			}

			if (name === 'login') {
				test('server validation without JavaScript', async ({ browser }) => {
					const page = await browser.newPage({ javaScriptEnabled: false });
					const form = await getForm(page);

					await form.submitButton.click();
					await expect(form.email).toHaveAccessibleDescription(
						'Email is required',
					);
					await expect(form.password).toHaveAccessibleDescription(
						'Password is required',
					);

					await form.email.fill('progressive@example.com');
					await form.password.fill('password123');
					await form.submitButton.click();

					await expect.poll(form.submittedValue).toMatchObject({
						email: 'progressive@example.com',
						password: 'password123',
					});
					await page.close();
				});
			}
		});
	}

	for (const { name, path } of [
		{ name: 'signup', path: '/signup' },
		{ name: 'signup-async-schema', path: '/signup-async-schema' },
		{ name: 'signup-server-validation', path: '/signup-server-validation' },
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

			test('submit', async ({ page }) => {
				const form = await getForm(page);

				// Submit empty form and verify validation errors
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

				// Fill all fields and submit (shouldRevalidate: 'onInput')
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

			if (name === 'signup-server-validation') {
				test('server validation', async ({ page }) => {
					const form = await getForm(page);

					await form.username.fill('taken');
					await form.password.fill('secret');
					await form.confirmPassword.fill('secret');
					await form.submitButton.click();

					await expect(form.username).toHaveAccessibleDescription(
						'Username is already used. How about "example"?',
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
				container: page.locator('form'),
				saveButton: page.getByRole('button', { name: 'Save' }),
				addTaskButton: page.getByRole('button', { name: 'Add task' }),
				title: page.getByLabel('Title'),
			};
		}

		test('submit', async ({ page }) => {
			const form = await getForm(page);

			// Insert 3 tasks
			await form.addTaskButton.click();
			await form.addTaskButton.click();
			await form.addTaskButton.click();

			await form.title.fill('My Todo List');
			await page.getByLabel('Task #1').fill('Task A');
			await page.getByLabel('Task #2').fill('Task B');
			await page.getByLabel('Task #3').fill('Task C');

			// Reorder: move Task C to top
			await page
				.locator('fieldset')
				.nth(2)
				.getByRole('button', { name: 'Move to top' })
				.click();
			await expect(page.getByLabel('Task #1')).toHaveValue('Task C');
			await expect(page.getByLabel('Task #2')).toHaveValue('Task A');
			await expect(page.getByLabel('Task #3')).toHaveValue('Task B');

			// Clear: clear Task #2 (was Task A)
			await page
				.locator('fieldset')
				.nth(1)
				.getByRole('button', { name: 'Clear' })
				.click();
			await expect(page.getByLabel('Task #2')).toHaveValue('');

			// Delete: remove Task #2
			await page
				.locator('fieldset')
				.nth(1)
				.getByRole('button', { name: 'Delete' })
				.click();
			await expect(page.locator('fieldset')).toHaveCount(2);
			await expect(page.getByLabel('Task #1')).toHaveValue('Task C');
			await expect(page.getByLabel('Task #2')).toHaveValue('Task B');

			// Submit and wait for server action to complete
			await form.saveButton.click();
			await expect(form.saveButton).toBeDisabled({ timeout: 10000 });

			await expect(form.title).toHaveValue('My Todo List');
			await expect(page.getByLabel('Task #1')).toHaveValue('Task C');
			await expect(page.getByLabel('Task #2')).toHaveValue('Task B');

			// After successful submission, the data should persist on reload
			await page.reload();
			await expect(form.title).toHaveValue('My Todo List');
			await expect(page.getByLabel('Task #1')).toHaveValue('Task C');
			await expect(page.getByLabel('Task #2')).toHaveValue('Task B');
		});
	});

	test.describe('file-upload', () => {
		async function getForm(page: Page) {
			await page.goto('/file-upload');

			return {
				submitButton: page.getByRole('button', { name: 'Submit' }),
				submittedValue: () => page.locator('pre').innerText().then(JSON.parse),
				title: page.getByLabel('Title'),
				file: page.getByLabel('File'),
			};
		}

		test('submit', async ({ page }) => {
			const form = await getForm(page);

			await form.title.fill('Attachment & notes #1');
			await form.file.setInputFiles({
				name: 'example & #1.txt',
				mimeType: 'text/plain',
				buffer: Buffer.from('React Router v8 upload'),
			});
			await form.submitButton.click();

			await expect.poll(form.submittedValue).toEqual({
				title: 'Attachment & notes #1',
				file: {
					name: 'example & #1.txt',
					size: 22,
					type: 'text/plain',
				},
			});
		});
	});
});
