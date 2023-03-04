import { test, expect } from '@playwright/test';
import {
	clickSubmitButton,
	getErrorMessages,
	getValidationMessage,
	getSubmission,
	isTouched,
	clickResetButton,
	getMovieFieldset,
	getPaymentFieldset,
	gotoForm,
	getLoginFieldset,
	expectNonEmptyString,
	getSignupFieldset,
	hasFocus,
	getTaskFieldset,
	waitForDataResponse,
	getTodosFieldset,
	getEmployeeFieldset,
} from './helpers';

test.describe('Client Validation', () => {
	test('Browser validation', async ({ page }) => {
		const form = await gotoForm(page, '/movie', { validate: false });
		const { title, description, genre, rating } = getMovieFieldset(form);

		async function expectErrorMessagesEqualsToValidationMessages() {
			const expectedMessages = await Promise.all([
				getValidationMessage(title),
				getValidationMessage(description),
				getValidationMessage(genre),
				getValidationMessage(rating),
			]);

			await expect(form.locator('main p')).toHaveText(expectedMessages);
		}

		await clickSubmitButton(form);
		await expectErrorMessagesEqualsToValidationMessages();
		await title.type('The Dark Knight');
		await expectErrorMessagesEqualsToValidationMessages();
		await description.type(
			'When the menace known as the Joker wreaks havoc...',
		);
		await expectErrorMessagesEqualsToValidationMessages();
		await genre.selectOption({ label: 'Action' });
		await expectErrorMessagesEqualsToValidationMessages();
		await rating.type('4.5');
		await clickSubmitButton(form);

		expect(await getSubmission(form)).toEqual({
			intent: 'submit',
			payload: {
				title: 'The Dark Knight',
				description: 'When the menace known as the Joker wreaks havoc...',
				genre: 'action',
				rating: '4.5',
			},
			error: {},
		});
	});

	test('Custom Validation', async ({ page }) => {
		const form = await gotoForm(page, '/movie');
		const { title, description, genre, rating } = getMovieFieldset(form);

		await clickSubmitButton(form);

		await expect(form.locator('main p')).toHaveText([
			'Title is required',
			'',
			'Genre is required',
			'',
		]);

		await title.type('What?');
		await expect(form.locator('main p')).toHaveText([
			'Please enter a valid title',
			'',
			'Genre is required',
			'',
		]);

		await title.fill('');
		await title.type('The Matrix');
		await expect(form.locator('main p')).toHaveText([
			'',
			'',
			'Genre is required',
			'',
		]);

		await description.type('When a beautiful stranger...');
		await expect(form.locator('main p')).toHaveText([
			'',
			'Please provides more details',
			'Genre is required',
			'',
		]);

		await description.fill('');
		await description.type(
			'When a beautiful stranger leads computer hacker Neo to...',
		);
		await expect(form.locator('main p')).toHaveText([
			'',
			'',
			'Genre is required',
			'',
		]);

		await genre.selectOption({ label: 'Science Fiction' });
		await expect(form.locator('main p')).toHaveText(['', '', '', '']);

		await rating.type('3.9');
		await expect(form.locator('main p')).toHaveText([
			'',
			'',
			'',
			'The provided rating is invalid',
		]);

		await rating.fill('');
		await rating.type('4.0');
		await expect(form.locator('main p')).toHaveText(['', '', '', '']);

		await clickSubmitButton(form);
		expect(await getSubmission(form)).toEqual({
			intent: 'submit',
			payload: {
				title: 'The Matrix',
				description:
					'When a beautiful stranger leads computer hacker Neo to...',
				genre: 'sci-fi',
				rating: '4.0',
			},
			error: {},
		});
	});

	test('Associating input', async ({ page }) => {
		const playground = await gotoForm(page, '/signup');
		const { email, password, confirmPassword } = getSignupFieldset(playground);

		await email.type('Invalid email');
		await password.type('1234');
		await clickSubmitButton(playground);

		await expect(playground.locator('main p')).toHaveText([
			expectNonEmptyString,
			expectNonEmptyString,
			expectNonEmptyString,
		]);

		await email.press('Control+a');
		await email.type('me@edmund.dev');
		await password.press('Control+a');
		await password.type('secretpassword');
		await confirmPassword.type('secretpassword');

		await expect(playground.locator('main p')).toHaveText(['', '', '']);

		await clickSubmitButton(playground);

		expect(await getSubmission(playground)).toEqual({
			intent: 'submit',
			payload: {
				email: 'me@edmund.dev',
			},
			error: {},
		});
	});

	test('Zod integration', async ({ page }) => {
		const form = await gotoForm(page, '/payment');
		const fieldset = getPaymentFieldset(form);
		const timestamp = new Date().toISOString();

		await clickSubmitButton(form);

		await expect(form.locator('main p')).toHaveText([
			'IBAN is required',
			'Please select a currency',
			'Value is required',
			'Timestamp is required',
			'Please verify',
		]);

		await fieldset.iban.type('DE89 3704 0044 0532 0130 00');

		await expect(form.locator('main p')).toHaveText([
			'',
			'Please select a currency',
			'Value is required',
			'Timestamp is required',
			'Please verify',
		]);

		await fieldset.currency.selectOption('EUR');

		await expect(form.locator('main p')).toHaveText([
			'',
			'',
			'Value is required',
			'Timestamp is required',
			'Please verify',
		]);

		await fieldset.value.type('1');

		await expect(form.locator('main p')).toHaveText([
			'',
			'',
			'',
			'Timestamp is required',
			'Please verify',
		]);

		await fieldset.timestamp.type(timestamp);

		await expect(form.locator('main p')).toHaveText([
			'',
			'',
			'',
			'',
			'Please verify',
		]);

		await fieldset.verified.check();

		await expect(form.locator('main p')).toHaveText(['', '', '', '', '']);

		await clickSubmitButton(form);

		expect(await getSubmission(form)).toEqual({
			intent: 'submit',
			payload: {
				iban: 'DE89 3704 0044 0532 0130 00',
				amount: {
					currency: 'EUR',
					value: '1',
				},
				timestamp,
				verified: 'Yes',
			},
			error: {},
		});
	});

	test('Form reset', async ({ page }) => {
		const form = await gotoForm(page, '/movie');
		const { title, description, genre, rating } = getMovieFieldset(form);
		const initialValidationMessages = await Promise.all([
			getValidationMessage(title),
			getValidationMessage(description),
			getValidationMessage(genre),
			getValidationMessage(rating),
		]);

		await clickSubmitButton(form);

		const currentValidationMessages = await getErrorMessages(form);

		expect(currentValidationMessages).not.toEqual(initialValidationMessages);
		await expect(title).toHaveAttribute('data-conform-touched', 'true');
		await expect(description).toHaveAttribute('data-conform-touched', 'true');
		await expect(genre).toHaveAttribute('data-conform-touched', 'true');
		await expect(rating).toHaveAttribute('data-conform-touched', 'true');

		await title.type('Up');
		await expect(form.locator('main p')).toHaveText([
			'',
			...currentValidationMessages.slice(1),
		]);

		await clickResetButton(form);

		await expect(form.locator('main p')).toHaveText(['', '', '', '']);
		expect(
			await Promise.all([
				getValidationMessage(title),
				getValidationMessage(description),
				getValidationMessage(genre),
				getValidationMessage(rating),
			]),
		).toEqual(initialValidationMessages);
		expect(
			await Promise.all([
				isTouched(title),
				isTouched(description),
				isTouched(genre),
				isTouched(rating),
			]),
		).not.toContain(true);
	});

	test('Submission with `noValidate: true`', async ({ page }) => {
		const form = await gotoForm(page, '/login', { noValidate: true });
		const { email } = getLoginFieldset(form);

		await clickSubmitButton(form);

		expect(await getSubmission(form)).toEqual({
			intent: 'submit',
			payload: {
				email: '',
			},
			error: {
				email: 'Email is required',
				password: 'Password is required',
			},
		});

		await email.type('invalid email');

		await clickSubmitButton(form);

		expect(await getSubmission(form)).toEqual({
			intent: 'submit',
			payload: {
				email: 'invalid email',
			},
			error: {
				password: 'Password is required',
			},
		});
	});

	test('Autofocus invalid field', async ({ page }) => {
		const form = await gotoForm(page, '/login');
		const { email, password } = getLoginFieldset(form);

		await clickSubmitButton(form);

		expect(await hasFocus(email)).toBe(true);

		await email.type('me@edmund.dev');
		await clickSubmitButton(form);

		expect(await hasFocus(password)).toBe(true);
	});
});

test.describe('Server Validation', () => {
	test('Error reporting', async ({ page }) => {
		const form = await gotoForm(page, '/login', {
			validate: false,
			noValidate: true,
		});
		const { email, password } = getLoginFieldset(form);

		await clickSubmitButton(form);

		await expect(form.locator('main p')).toHaveText([
			'',
			'Email is required',
			'Password is required',
		]);

		await email.type('me@edmund.dev');
		await clickSubmitButton(form);

		await expect(form.locator('main p')).toHaveText([
			'',
			'',
			'Password is required',
		]);

		await password.type('SecretPassword');
		await clickSubmitButton(form);
		await expect(form.locator('main p')).toHaveText([
			'The provided email or password is not valid',
			'',
			'',
		]);

		await password.press('Control+a');
		await password.type('$eCreTP@ssWord');
		await clickSubmitButton(form);
		await expect(form.locator('main p')).toHaveText(['', '', '']);
	});

	test('Async validation', async ({ page }) => {
		const form = await gotoForm(page, '/employee');
		const { name, email, title } = getEmployeeFieldset(form);

		await page.route('**', (route) => {
			const request = route.request();
			const url = new URL(request.url());
			const body = request.postData();
			const headers = request.headers();

			if (
				request.method() !== 'POST' ||
				!url.searchParams.has('_data') ||
				!body ||
				headers['content-type'] !== 'application/x-www-form-urlencoded'
			) {
				return route.continue();
			}

			const value = Object.fromEntries(new URLSearchParams(body));

			// When validting the email field
			if (
				value['conform/validate'] === 'email' &&
				[
					'hey@conform.gu',
					'hey@conform.gui',
					'hey@conform.guid',
					'hey@conform.guide',
				].includes(value.email)
			) {
				return route.continue();
			}

			// When clicking on the submit button
			if (typeof value['conform/validate'] === 'undefined') {
				return route.continue();
			}

			return route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					payload: {},
					error: [['', 'Request forbidden']],
				}),
			});
		});

		await clickSubmitButton(form);

		await expect(form.locator('main p')).toHaveText([
			'',
			'Name is required',
			'Email is required',
			'Title is required',
		]);

		await name.type('Edmund Hung');

		await expect(form.locator('main p')).toHaveText([
			'',
			'',
			'Email is required',
			'Title is required',
		]);

		await email.type('hey@conform.g');

		await expect(form.locator('main p')).toHaveText([
			'',
			'',
			'Email is invalid',
			'Title is required',
		]);

		await email.type('u');

		await expect(form.locator('main p')).toHaveText([
			'',
			'',
			'Email is already used',
			'Title is required',
		]);

		await email.type('i');

		await expect(form.locator('main p')).toHaveText([
			'',
			'',
			'Email is already used',
			'Title is required',
		]);

		await email.type('d');

		await expect(form.locator('main p')).toHaveText([
			'',
			'',
			'Email is already used',
			'Title is required',
		]);

		await title.type('Software Developer');

		await expect(form.locator('main p')).toHaveText([
			'',
			'',
			'Email is already used',
			'',
		]);

		await email.type('e');

		await expect(form.locator('main p')).toHaveText(['', '', '', '']);

		await Promise.all([waitForDataResponse(page), clickSubmitButton(form)]);

		await expect(form.locator('main p')).toHaveText(['', '', '', '']);
	});

	test('Autofocus invalid field', async ({ page }) => {
		const form = await gotoForm(page, '/login', {
			validate: false,
			noValidate: true,
		});
		const { email, password } = getLoginFieldset(form);

		await clickSubmitButton(form);

		await expect.poll(() => hasFocus(email)).toBe(true);

		await email.type('me@edmund.dev');
		await clickSubmitButton(form);

		await expect.poll(() => hasFocus(password)).toBe(true);
	});
});

test.describe('Error Reporting', () => {
	test('initialReport: onSubmit', async ({ page }) => {
		const form = await gotoForm(page, '/signup', { initialReport: 'onSubmit' });
		const { email, password, confirmPassword } = getSignupFieldset(form);

		await email.type('Invalid email');
		await password.type('1234');
		await confirmPassword.type('5678');

		// To ensure it leaves the last field
		await form.press('Tab');

		await expect(form.locator('main p')).toHaveText(['', '', '']);

		await clickSubmitButton(form);

		await expect(form.locator('main p')).toHaveText([
			expectNonEmptyString,
			expectNonEmptyString,
			expectNonEmptyString,
		]);
	});

	test('initialReport: onChange', async ({ page }) => {
		const form = await gotoForm(page, '/signup', { initialReport: 'onChange' });
		const { email, password, confirmPassword } = getSignupFieldset(form);

		await email.type('Invalid email');
		await expect(form.locator('main p')).toHaveText([
			expectNonEmptyString,
			'',
			'',
		]);

		await password.type('1234');
		await expect(form.locator('main p')).toHaveText([
			expectNonEmptyString,
			expectNonEmptyString,
			'',
		]);

		await confirmPassword.type('5678');
		await expect(form.locator('main p')).toHaveText([
			expectNonEmptyString,
			expectNonEmptyString,
			expectNonEmptyString,
		]);
	});

	test('initialReport: onBlur', async ({ page }) => {
		const form = await gotoForm(page, '/signup', { initialReport: 'onBlur' });
		const { email, password, confirmPassword } = getSignupFieldset(form);

		await email.type('Invalid email');
		await expect(form.locator('main p')).toHaveText(['', '', '']);

		await form.press('Tab');
		await expect(form.locator('main p')).toHaveText([
			expectNonEmptyString,
			'',
			'',
		]);

		await password.type('1234');
		await expect(form.locator('main p')).toHaveText([
			expectNonEmptyString,
			'',
			'',
		]);

		await form.press('Tab');
		await expect(form.locator('main p')).toHaveText([
			expectNonEmptyString,
			expectNonEmptyString,
			'',
		]);

		await confirmPassword.type('5678');
		await expect(form.locator('main p')).toHaveText([
			expectNonEmptyString,
			expectNonEmptyString,
			'',
		]);

		await form.press('Tab');
		await expect(form.locator('main p')).toHaveText([
			expectNonEmptyString,
			expectNonEmptyString,
			expectNonEmptyString,
		]);
	});
});

test.describe('Field list', () => {
	test('Client Validation', async ({ page }) => {
		const form = await gotoForm(page, '/todos');
		const tasks = form.locator('ol > li');

		await clickSubmitButton(form);

		await expect(form.locator('main p')).toHaveText([
			expectNonEmptyString,
			expectNonEmptyString,
			'',
		]);

		await form.locator('button:text("Insert top")').click();
		await clickSubmitButton(form);

		await expect(form.locator('main p')).toHaveText([
			expectNonEmptyString,
			expectNonEmptyString,
			'',
			expectNonEmptyString,
			'',
		]);

		await form.locator('button:text("Insert bottom")').click();
		await clickSubmitButton(form);

		await expect(form.locator('main p')).toHaveText([
			expectNonEmptyString,
			expectNonEmptyString,
			'',
			expectNonEmptyString,
			'',
			expectNonEmptyString,
			'',
		]);

		const task0 = getTaskFieldset(tasks, 'tasks', 0);
		const task1 = getTaskFieldset(tasks, 'tasks', 1);
		const task2 = getTaskFieldset(tasks, 'tasks', 2);

		await form.locator('[name="title"]').type('My schedule');
		await task0.content.type('Urgent task');
		await task1.content.type('Daily task');
		await task2.content.type('Ad hoc task');

		expect(await getErrorMessages(form)).not.toContain(expectNonEmptyString);

		await clickSubmitButton(form);

		expect(await getSubmission(form)).toEqual({
			intent: 'submit',
			payload: {
				title: 'My schedule',
				tasks: [
					{ content: 'Urgent task' },
					{ content: 'Daily task' },
					{ content: 'Ad hoc task' },
				],
			},
			error: {},
		});
	});

	test('Command buttons', async ({ page }) => {
		const form = await gotoForm(page, '/todos');
		const tasks = form.locator('ol > li');

		await expect(tasks).toHaveCount(1);

		const task0 = getTaskFieldset(tasks, 'tasks', 0);
		const task1 = getTaskFieldset(tasks, 'tasks', 1);

		await task0.content.type('Write tests for nested list');
		await task0.completed.check();

		await form.locator('button:text("Insert top")').click();

		expect(await task0.content.inputValue()).toBe('');
		expect(await task0.completed.isChecked()).toBe(false);
		expect(await task1.content.inputValue()).toBe(
			'Write tests for nested list',
		);
		expect(await task1.completed.isChecked()).toBe(true);

		await tasks.nth(0).locator('button:text("Delete")').click();

		expect(await task0.content.inputValue()).toBe(
			'Write tests for nested list',
		);
		expect(await task0.completed.isChecked()).toBe(true);

		await form.locator('button:text("Insert bottom")').click();
		await task1.content.type('Write more tests');
		await task1.completed.check();
		await tasks.nth(1).locator('button:text("Move to top")').click();

		expect(await task0.content.inputValue()).toBe('Write more tests');
		expect(await task0.completed.isChecked()).toBe(true);
		expect(await task1.content.inputValue()).toBe(
			'Write tests for nested list',
		);
		expect(await task1.completed.isChecked()).toBe(true);

		await tasks.nth(0).locator('button:text("Clear")').click();

		expect(await task0.content.inputValue()).toBe('');
		expect(await task0.completed.isChecked()).toBe(false);
		expect(await task1.content.inputValue()).toBe(
			'Write tests for nested list',
		);
		expect(await task1.completed.isChecked()).toBe(true);

		await task0.content.type('Write even more tests');
		await form.locator('[name="title"]').type('Testing plan');
		await clickSubmitButton(form);

		expect(await getSubmission(form)).toEqual({
			intent: 'submit',
			payload: {
				title: 'Testing plan',
				tasks: [
					{ content: 'Write even more tests' },
					{ content: 'Write tests for nested list', completed: 'on' },
				],
			},
			error: {},
		});
	});

	test('Form reset', async ({ page }) => {
		const form = await gotoForm(page, '/todos');
		const tasks = form.locator('ol > li');

		await expect(tasks).toHaveCount(1);

		await form.locator('button:text("Insert bottom")').click();

		await expect(tasks).toHaveCount(2);

		await clickResetButton(form);

		await expect(tasks).toHaveCount(1);
	});
});

test.describe('No JS', () => {
	test.use({ javaScriptEnabled: false });

	test('Basic form', async ({ page }) => {
		const form = await gotoForm(page, '/login');
		const { email, password } = getLoginFieldset(form);

		await Promise.all([page.waitForNavigation(), clickSubmitButton(form)]);

		await expect(form.locator('main p')).toHaveText([
			'',
			'Email is required',
			'Password is required',
		]);

		await email.type('me@edmund.dev');
		await password.type('SecretPassword');

		await expect(form.locator('main p')).toHaveText([
			'',
			'Email is required',
			'Password is required',
		]);

		await Promise.all([page.waitForNavigation(), clickSubmitButton(form)]);

		await expect(form.locator('main p')).toHaveText([
			'The provided email or password is not valid',
			'',
			'',
		]);

		await password.type('$eCreTP@ssWord');
		await Promise.all([page.waitForNavigation(), clickSubmitButton(form)]);

		await expect(form.locator('main p')).toHaveText(['', '', '']);
	});

	test('List Command', async ({ page }) => {
		const form = await gotoForm(page, '/todos');
		const todos = getTodosFieldset(form);
		const task0 = getTaskFieldset(todos.tasks, 'tasks', 0);
		const task1 = getTaskFieldset(todos.tasks, 'tasks', 1);
		const task2 = getTaskFieldset(todos.tasks, 'tasks', 2);

		await todos.title.type('Test plan');
		await task0.content.type('Write tests for nested list');
		await task0.completed.check();
		await Promise.all([page.waitForNavigation(), todos.insertBottom.click()]);

		await expect(todos.tasks).toHaveCount(2);

		expect(await todos.title.inputValue()).toBe('Test plan');
		expect(await task0.content.inputValue()).toBe(
			'Write tests for nested list',
		);
		expect(await task0.completed.isChecked()).toBe(true);
		expect(await task1.content.inputValue()).toBe('');
		expect(await task1.completed.isChecked()).toBe(false);

		await task1.content.type('Write more tests');
		await Promise.all([page.waitForNavigation(), todos.insertTop.click()]);

		await expect(todos.tasks).toHaveCount(3);

		expect(await task0.content.inputValue()).toBe('');
		expect(await task0.completed.isChecked()).toBe(false);
		expect(await task1.content.inputValue()).toBe(
			'Write tests for nested list',
		);
		expect(await task1.completed.isChecked()).toBe(true);
		expect(await task2.content.inputValue()).toBe('Write more tests');
		expect(await task2.completed.isChecked()).toBe(false);

		await task0.content.type('Cut a release');
		await Promise.all([page.waitForNavigation(), task1.delete.click()]);

		await expect(todos.tasks).toHaveCount(2);

		expect(await task0.content.inputValue()).toBe('Cut a release');
		expect(await task0.completed.isChecked()).toBe(false);
		expect(await task1.content.inputValue()).toBe('Write more tests');
		expect(await task1.completed.isChecked()).toBe(false);

		await task1.completed.check();
		await Promise.all([page.waitForNavigation(), task1.moveToTop.click()]);

		await expect(todos.tasks).toHaveCount(2);

		expect(await task0.content.inputValue()).toBe('Write more tests');
		expect(await task0.completed.isChecked()).toBe(true);
		expect(await task1.content.inputValue()).toBe('Cut a release');
		expect(await task1.completed.isChecked()).toBe(false);

		await Promise.all([page.waitForNavigation(), task0.clear.click()]);

		await expect(todos.tasks).toHaveCount(2);

		expect(await task0.content.inputValue()).toBe('');
		expect(await task0.completed.isChecked()).toBe(false);
		expect(await task1.content.inputValue()).toBe('Cut a release');
		expect(await task1.completed.isChecked()).toBe(false);

		await Promise.all([page.waitForNavigation(), clickSubmitButton(form)]);

		await expect(form.locator('main p')).toHaveText([
			'',
			expectNonEmptyString,
			'',
			'',
			'',
		]);
	});
});
