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
				password: 'secretpassword',
				confirmPassword: 'secretpassword',
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
				password: '',
			},
			error: {
				email: ['Email is required'],
				password: ['Password is required'],
			},
		});

		await email.type('invalid email');

		await clickSubmitButton(form);

		expect(await getSubmission(form)).toEqual({
			intent: 'submit',
			payload: {
				email: 'invalid email',
				password: '',
			},
			error: {
				password: ['Password is required'],
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

test.describe('No JS', () => {
	test.use({ javaScriptEnabled: false });

	test('Basic form', async ({ page }) => {
		const form = await gotoForm(page, '/login');
		const { email, password } = getLoginFieldset(form);

		await clickSubmitButton(form);
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

		await clickSubmitButton(form);
		await expect(form.locator('main p')).toHaveText([
			'The provided email or password is not valid',
			'',
			'',
		]);

		await password.dblclick();
		await password.type('$eCreTP@ssWord');
		await clickSubmitButton(form);

		await expect(form.locator('main p')).toHaveText(['', '', '']);
	});
});
