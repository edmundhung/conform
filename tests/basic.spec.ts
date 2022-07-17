import { test, expect } from '@playwright/test';
import {
	getPlaygroundLocator,
	getConstraint,
	clickSubmitButton,
	getErrorMessages,
	getValidationMessage,
	getSubmission,
	isTouched,
	clickResetButton,
	getLoginFieldset,
	getMovieFieldset,
} from './helpers';

test.beforeEach(async ({ page }) => {
	await page.goto('/basic');
});

test.describe('Native Constraint', () => {
	test('configure all input fields correctly', async ({ page }) => {
		const playground = getPlaygroundLocator(page, 'Native Constraint');
		const fieldset = getMovieFieldset(playground);
		const [title, description, genres, rating] = await Promise.all([
			getConstraint(fieldset.title),
			getConstraint(fieldset.description),
			getConstraint(fieldset.genres),
			getConstraint(fieldset.rating),
		]);

		expect({ title, description, genres, rating }).toEqual({
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

	test('report error message provided by the browser vendor', async ({
		page,
	}) => {
		const playground = getPlaygroundLocator(page, 'Native Constraint');
		const { title, description, genres, rating } = getMovieFieldset(playground);

		async function expectErrorMessagesEqualsToValidationMessages() {
			const [actualMessages, ...expectedMessages] = await Promise.all([
				getErrorMessages(playground),
				getValidationMessage(title),
				getValidationMessage(description),
				getValidationMessage(genres),
				getValidationMessage(rating),
			]);

			expect(actualMessages).toEqual(expectedMessages);
		}

		await clickSubmitButton(playground);
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
		await clickSubmitButton(playground);

		expect(await getSubmission(playground)).toEqual({
			state: 'accepted',
			data: {
				title: 'The Dark Knight',
				description: 'When the menace known as the Joker wreaks havoc...',
				genres: 'action',
				rating: '4.5',
			},
			form: {
				value: {
					title: 'The Dark Knight',
					description: 'When the menace known as the Joker wreaks havoc...',
					genres: 'action',
					rating: '4.5',
				},
				error: {},
			},
		});
	});
});

test.describe('Custom Constraint', () => {
	test('report error messages correctly', async ({ page }) => {
		const playground = getPlaygroundLocator(page, 'Custom Constraint');
		const { title, description, genres, rating } = getMovieFieldset(playground);

		await clickSubmitButton(playground);

		expect(await getErrorMessages(playground)).toEqual([
			'Title is required',
			'',
			'Genre is required',
			'',
		]);

		await title.type('What?');
		expect(await getErrorMessages(playground)).toEqual([
			'Please enter a valid title',
			'',
			'Genre is required',
			'',
		]);

		await title.fill('');
		await title.type('The Matrix');
		expect(await getErrorMessages(playground)).toEqual([
			'',
			'',
			'Genre is required',
			'',
		]);

		await description.type('When a beautiful stranger...');
		expect(await getErrorMessages(playground)).toEqual([
			'',
			'Please provides more details',
			'Genre is required',
			'',
		]);

		await description.fill('');
		await description.type(
			'When a beautiful stranger leads computer hacker Neo to...',
		);
		expect(await getErrorMessages(playground)).toEqual([
			'',
			'',
			'Genre is required',
			'',
		]);

		await genres.selectOption({ label: 'Science Fiction' });
		expect(await getErrorMessages(playground)).toEqual(['', '', '', '']);

		await rating.type('3.9');
		expect(await getErrorMessages(playground)).toEqual([
			'',
			'',
			'',
			'The provided rating is invalid',
		]);

		await rating.fill('');
		await rating.type('4.0');
		expect(await getErrorMessages(playground)).toEqual(['', '', '', '']);

		await clickSubmitButton(playground);
		expect(await getSubmission(playground)).toEqual({
			state: 'accepted',
			data: {
				title: 'The Matrix',
				description:
					'When a beautiful stranger leads computer hacker Neo to...',
				genres: 'sci-fi',
				rating: '4.0',
			},
			form: {
				value: {
					title: 'The Matrix',
					description:
						'When a beautiful stranger leads computer hacker Neo to...',
					genres: 'sci-fi',
					rating: '4.0',
				},
				error: {},
			},
		});
	});

	test('clear error messages, touched state and reset validity on reset', async ({
		page,
	}) => {
		const playground = getPlaygroundLocator(page, 'Custom Constraint');
		const { title, description, genres, rating } = getMovieFieldset(playground);
		const initialValidationMessages = await Promise.all([
			getValidationMessage(title),
			getValidationMessage(description),
			getValidationMessage(genres),
			getValidationMessage(rating),
		]);

		await clickSubmitButton(playground);

		expect(await getErrorMessages(playground)).toEqual(
			initialValidationMessages,
		);
		expect(
			await Promise.all([
				isTouched(title),
				isTouched(description),
				isTouched(genres),
				isTouched(rating),
			]),
		).not.toContain(false);

		await title.type('Up');
		expect(await getErrorMessages(playground)).toEqual([
			'',
			...initialValidationMessages.slice(1),
		]);

		await clickResetButton(playground);

		expect(await getErrorMessages(playground)).toEqual(['', '', '', '']);
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
});

test.describe('Skip Validation', () => {
	test('submit without providing any values', async ({ page }) => {
		const playground = getPlaygroundLocator(page, 'Skip Validation');
		const { email } = getLoginFieldset(playground);

		await clickSubmitButton(playground);

		expect(await getSubmission(playground)).toEqual({
			state: 'accepted',
			data: {
				email: '',
				password: '',
			},
			form: {
				value: {
					email: '',
					password: '',
				},
				error: {},
			},
		});

		await email.type('invalid email');

		await clickSubmitButton(playground);

		expect(await getSubmission(playground)).toEqual({
			state: 'accepted',
			data: {
				email: 'invalid email',
				password: '',
			},
			form: {
				value: {
					email: 'invalid email',
					password: '',
				},
				error: {},
			},
		});
	});
});

test.describe('Reporting on submit', () => {
	test('no error would be reported before users try submitting the form', async ({
		page,
	}) => {
		const playground = getPlaygroundLocator(page, 'Reporting on submit');
		const { email, password } = getLoginFieldset(playground);

		await email.type('Invalid email');
		await password.type('1234');

		// To ensure it leaves the password field
		await playground.press('Tab');

		expect(await getErrorMessages(playground)).toEqual(['', '']);

		await clickSubmitButton(playground);

		expect(await getErrorMessages(playground)).toEqual([
			expect.stringMatching(/\w+/),
			expect.stringMatching(/\w+/),
		]);
	});
});

test.describe('Reporting on change', () => {
	test('error to be reported once the users type something on the field', async ({
		page,
	}) => {
		const playground = getPlaygroundLocator(page, 'Reporting on change');
		const { email, password } = getLoginFieldset(playground);

		await email.type('Invalid email');
		expect(await getErrorMessages(playground)).toEqual([
			expect.stringMatching(/\w+/),
			'',
		]);

		await password.type('1234');
		expect(await getErrorMessages(playground)).toEqual([
			expect.stringMatching(/\w+/),
			expect.stringMatching(/\w+/),
		]);
	});
});

test.describe('Reporting on blur', () => {
	test('error not to be reported until the users leave the field', async ({
		page,
	}) => {
		const playground = getPlaygroundLocator(page, 'Reporting on blur');
		const { email, password } = getLoginFieldset(playground);

		await email.type('Invalid email');
		expect(await getErrorMessages(playground)).toEqual(['', '']);

		await playground.press('Tab');
		expect(await getErrorMessages(playground)).toEqual([
			expect.stringMatching(/\w+/),
			'',
		]);

		await password.type('1234');
		expect(await getErrorMessages(playground)).toEqual([
			expect.stringMatching(/\w+/),
			'',
		]);

		await playground.press('Tab');
		expect(await getErrorMessages(playground)).toEqual([
			expect.stringMatching(/\w+/),
			expect.stringMatching(/\w+/),
		]);
	});
});

test.describe('Remote form', () => {
	test('validate like normal form setup', async ({ page }) => {
		const playground = getPlaygroundLocator(page, 'Reporting on blur');
		const { email, password } = getLoginFieldset(playground);

		await email.type('Invalid email');
		await password.type('1234');
		await clickSubmitButton(playground);

		expect(await getErrorMessages(playground)).toEqual([
			expect.stringMatching(/\w+/),
			expect.stringMatching(/\w+/),
		]);

		await email.press('Control+a');
		await email.type('me@edmund.dev');
		await password.press('Control+a');
		await password.type('secretpassword');

		expect(await getErrorMessages(playground)).toEqual(['', '']);

		await clickSubmitButton(playground);

		expect(await getSubmission(playground)).toEqual({
			state: 'accepted',
			data: {
				email: 'me@edmund.dev',
				password: 'secretpassword',
			},
			form: {
				value: {
					email: 'me@edmund.dev',
					password: 'secretpassword',
				},
				error: {},
			},
		});
	});
});
