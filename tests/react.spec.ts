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
	getFieldsetConstraint,
	gotoForm,
	getStudentFieldset,
	getLoginFieldset,
	expectNonEmptyString,
	getSignupFieldset,
	hasFocus,
	getTaskFieldset,
	waitForFormState,
	getTodosFieldset,
} from './helpers';

test.describe('Constraint', () => {
	test('Manual constraint definition', async ({ page }) => {
		const form = await gotoForm(page, '/movie');
		const fieldset = getMovieFieldset(form);
		const constraint = await getFieldsetConstraint(fieldset);

		expect(constraint).toEqual({
			title: {
				required: true,
				pattern: '[0-9a-zA-Z ]{1,20}',
			},
			description: {
				minLength: 30,
				maxLength: 200,
			},
			genres: {
				required: true,
				multiple: true,
			},
			rating: {
				min: '0.5',
				max: '5',
				step: '0.5',
			},
		});
	});

	test('Derived constraint from zod schema', async ({ page }) => {
		const form = await gotoForm(page, '/payment');
		const fieldset = getPaymentFieldset(form);
		const constraint = await getFieldsetConstraint(fieldset);

		expect(constraint).toEqual({
			iban: {
				required: true,
				pattern: '^[A-Z]{2}[0-9]{2}(?:[ ]?[0-9]{4}){4}(?:[ ]?[0-9]{1,2})?$',
			},
			currency: {
				required: true,
			},
			value: {
				required: true,
				min: '1',
			},
			timestamp: {
				required: true,
			},
			verified: {},
		});
	});

	test('Derived constraint from yup schema', async ({ page }) => {
		const form = await gotoForm(page, '/student');
		const fieldset = getStudentFieldset(form);
		const constraint = await getFieldsetConstraint(fieldset);

		expect(constraint).toEqual({
			name: {
				required: true,
				minLength: 8,
				maxLength: 20,
				pattern: '^[0-9a-zA-Z]{8,20}$',
			},
			remarks: {},
			score: {
				min: '0',
				max: '100',
			},
			grade: {
				pattern: 'A|B|C|D|E|F',
			},
		});
	});
});

test.describe('Client Validation', () => {
	test('Browser validation', async ({ page }) => {
		const form = await gotoForm(page, '/movie', { validate: false });
		const { title, description, genres, rating } = getMovieFieldset(form);

		async function expectErrorMessagesEqualsToValidationMessages() {
			const [actualMessages, ...expectedMessages] = await Promise.all([
				getErrorMessages(form),
				getValidationMessage(title),
				getValidationMessage(description),
				getValidationMessage(genres),
				getValidationMessage(rating),
			]);

			expect(actualMessages).toEqual(expectedMessages);
		}

		await clickSubmitButton(form);
		await expectErrorMessagesEqualsToValidationMessages();
		await title.type('The Dark Knight');
		await expectErrorMessagesEqualsToValidationMessages();
		await description.type(
			'When the menace known as the Joker wreaks havoc...',
		);
		await expectErrorMessagesEqualsToValidationMessages();
		await genres.selectOption({ label: 'Action' });
		await expectErrorMessagesEqualsToValidationMessages();
		await rating.type('4.5');
		await clickSubmitButton(form);

		expect(await getSubmission(form)).toEqual({
			scope: ['title', 'description', 'genres', 'rating'],
			value: {
				title: 'The Dark Knight',
				description: 'When the menace known as the Joker wreaks havoc...',
				genres: 'action',
				rating: '4.5',
			},
			error: [],
		});
	});

	test('Custom Validation', async ({ page }) => {
		const form = await gotoForm(page, '/movie');
		const { title, description, genres, rating } = getMovieFieldset(form);

		await clickSubmitButton(form);

		expect(await getErrorMessages(form)).toEqual([
			'Title is required',
			'',
			'Genre is required',
			'',
		]);

		await title.type('What?');
		expect(await getErrorMessages(form)).toEqual([
			'Please enter a valid title',
			'',
			'Genre is required',
			'',
		]);

		await title.fill('');
		await title.type('The Matrix');
		expect(await getErrorMessages(form)).toEqual([
			'',
			'',
			'Genre is required',
			'',
		]);

		await description.type('When a beautiful stranger...');
		expect(await getErrorMessages(form)).toEqual([
			'',
			'Please provides more details',
			'Genre is required',
			'',
		]);

		await description.fill('');
		await description.type(
			'When a beautiful stranger leads computer hacker Neo to...',
		);
		expect(await getErrorMessages(form)).toEqual([
			'',
			'',
			'Genre is required',
			'',
		]);

		await genres.selectOption({ label: 'Science Fiction' });
		expect(await getErrorMessages(form)).toEqual(['', '', '', '']);

		await rating.type('3.9');
		expect(await getErrorMessages(form)).toEqual([
			'',
			'',
			'',
			'The provided rating is invalid',
		]);

		await rating.fill('');
		await rating.type('4.0');
		expect(await getErrorMessages(form)).toEqual(['', '', '', '']);

		await clickSubmitButton(form);
		expect(await getSubmission(form)).toEqual({
			scope: ['title', 'description', 'genres', 'rating'],
			value: {
				title: 'The Matrix',
				description:
					'When a beautiful stranger leads computer hacker Neo to...',
				genres: 'sci-fi',
				rating: '4.0',
			},
			error: [],
		});
	});

	test('Associating input', async ({ page }) => {
		const playground = await gotoForm(page, '/signup');
		const { email, password, confirmPassword } = getSignupFieldset(playground);

		await email.type('Invalid email');
		await password.type('1234');
		await clickSubmitButton(playground);

		expect(await getErrorMessages(playground)).toEqual([
			expectNonEmptyString,
			expectNonEmptyString,
			expectNonEmptyString,
		]);

		await email.press('Control+a');
		await email.type('me@edmund.dev');
		await password.press('Control+a');
		await password.type('secretpassword');
		await confirmPassword.type('secretpassword');

		expect(await getErrorMessages(playground)).toEqual(['', '', '']);

		await clickSubmitButton(playground);

		expect(await getSubmission(playground)).toEqual({
			scope: ['email', 'password', 'confirmPassword'],
			value: {
				email: 'me@edmund.dev',
			},
			error: [],
		});
	});

	test('Reset', async ({ page }) => {
		const form = await gotoForm(page, '/movie');
		const { title, description, genres, rating } = getMovieFieldset(form);
		const initialValidationMessages = await Promise.all([
			getValidationMessage(title),
			getValidationMessage(description),
			getValidationMessage(genres),
			getValidationMessage(rating),
		]);

		await clickSubmitButton(form);

		expect(await getErrorMessages(form)).toEqual(initialValidationMessages);
		expect(
			await Promise.all([
				isTouched(title),
				isTouched(description),
				isTouched(genres),
				isTouched(rating),
			]),
		).not.toContain(false);

		await title.type('Up');
		expect(await getErrorMessages(form)).toEqual([
			'',
			...initialValidationMessages.slice(1),
		]);

		await clickResetButton(form);

		expect(await getErrorMessages(form)).toEqual(['', '', '', '']);
		expect(
			await Promise.all([
				getValidationMessage(title),
				getValidationMessage(description),
				getValidationMessage(genres),
				getValidationMessage(rating),
			]),
		).toEqual(initialValidationMessages);
		expect(
			await Promise.all([
				isTouched(title),
				isTouched(description),
				isTouched(genres),
				isTouched(rating),
			]),
		).not.toContain(true);
	});

	test('Submission with `noValidate: true`', async ({ page }) => {
		const form = await gotoForm(page, '/login', { noValidate: true });
		const { email } = getLoginFieldset(form);

		await clickSubmitButton(form);

		expect(await getSubmission(form)).toEqual({
			scope: ['email', 'password'],
			value: {},
			error: [
				['email', 'Email is required'],
				['password', 'Password is required'],
			],
		});

		await email.type('invalid email');

		await clickSubmitButton(form);

		expect(await getSubmission(form)).toEqual({
			scope: ['email', 'password'],
			value: {
				email: 'invalid email',
			},
			error: [['password', 'Password is required']],
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
		const { email } = getLoginFieldset(form);

		await clickSubmitButton(form);

		expect(await getErrorMessages(form)).toEqual([
			'Email is required',
			'Password is required',
		]);

		await email.type('me@edmund.dev');
		await Promise.all([waitForFormState(page), clickSubmitButton(form)]);

		expect(await getErrorMessages(form)).toEqual(['', 'Password is required']);
	});

	test('Autofocus invalid field', async ({ page }) => {
		const form = await gotoForm(page, '/login', {
			validate: false,
			noValidate: true,
		});
		const { email, password } = getLoginFieldset(form);

		await clickSubmitButton(form);

		expect(await hasFocus(email)).toBe(true);

		await email.type('me@edmund.dev');
		await clickSubmitButton(form);

		expect(await hasFocus(password)).toBe(true);
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

		expect(await getErrorMessages(form)).toEqual(['', '', '']);

		await clickSubmitButton(form);

		expect(await getErrorMessages(form)).toEqual([
			expectNonEmptyString,
			expectNonEmptyString,
			expectNonEmptyString,
		]);
	});

	test('initialReport: onChange', async ({ page }) => {
		const form = await gotoForm(page, '/signup', { initialReport: 'onChange' });
		const { email, password, confirmPassword } = getSignupFieldset(form);

		await email.type('Invalid email');
		expect(await getErrorMessages(form)).toEqual([
			expectNonEmptyString,
			'',
			'',
		]);

		await password.type('1234');
		expect(await getErrorMessages(form)).toEqual([
			expectNonEmptyString,
			expectNonEmptyString,
			'',
		]);

		await confirmPassword.type('5678');
		expect(await getErrorMessages(form)).toEqual([
			expectNonEmptyString,
			expectNonEmptyString,
			expectNonEmptyString,
		]);
	});

	test('initialReport: onBlur', async ({ page }) => {
		const form = await gotoForm(page, '/signup', { initialReport: 'onBlur' });
		const { email, password, confirmPassword } = getSignupFieldset(form);

		await email.type('Invalid email');
		expect(await getErrorMessages(form)).toEqual(['', '', '']);

		await form.press('Tab');
		expect(await getErrorMessages(form)).toEqual([
			expectNonEmptyString,
			'',
			'',
		]);

		await password.type('1234');
		expect(await getErrorMessages(form)).toEqual([
			expectNonEmptyString,
			'',
			'',
		]);

		await form.press('Tab');
		expect(await getErrorMessages(form)).toEqual([
			expectNonEmptyString,
			expectNonEmptyString,
			'',
		]);

		await confirmPassword.type('5678');
		expect(await getErrorMessages(form)).toEqual([
			expectNonEmptyString,
			expectNonEmptyString,
			'',
		]);

		await form.press('Tab');
		expect(await getErrorMessages(form)).toEqual([
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

		expect(await getErrorMessages(form)).toEqual([
			expectNonEmptyString,
			expectNonEmptyString,
			'',
		]);

		await form.locator('button:text("Insert top")').click();
		await clickSubmitButton(form);

		expect(await getErrorMessages(form)).toEqual([
			expectNonEmptyString,
			expectNonEmptyString,
			'',
			expectNonEmptyString,
			'',
		]);

		await form.locator('button:text("Insert bottom")').click();
		await clickSubmitButton(form);

		expect(await getErrorMessages(form)).toEqual([
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
			scope: [
				'title',
				'tasks[0].content',
				'tasks[1].content',
				'tasks[2].content',
			],
			value: {
				title: 'My schedule',
				tasks: [
					{ content: 'Urgent task' },
					{ content: 'Daily task' },
					{ content: 'Ad hoc task' },
				],
			},
			error: [],
		});
	});

	test('Control buttons', async ({ page }) => {
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
			scope: [
				'title',
				'tasks[0].content',
				'tasks[1].content',
				'tasks[1].completed',
			],
			value: {
				title: 'Testing plan',
				tasks: [
					{ content: 'Write even more tests' },
					{ content: 'Write tests for nested list', completed: 'on' },
				],
			},
			error: [],
		});
	});

	test('Reset', async ({ page }) => {
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

		expect(await getErrorMessages(form)).toEqual([
			'Email is required',
			'Password is required',
		]);

		await email.type('me@edmund.dev');
		await password.type('$eCreTP@ssWord');

		expect(await getErrorMessages(form)).toEqual([
			'Email is required',
			'Password is required',
		]);

		await Promise.all([page.waitForNavigation(), clickSubmitButton(form)]);

		expect(await getErrorMessages(form)).toEqual(['', '']);
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

		expect(await getErrorMessages(form)).toEqual([
			'',
			expectNonEmptyString,
			'',
			'',
			'',
		]);
	});
});
