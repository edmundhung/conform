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
} from './helpers';

test.beforeEach(async ({ page }) => {
	await page.goto('/basic');
});

test.describe('Native Constraint', () => {
	test('configure all input fields correctly', async ({ page }) => {
		const playground = getPlaygroundLocator(page, 'Native Constraint');
		const [title, description, genres, rating] = await Promise.all([
			getConstraint(playground.locator('[name="title"]')),
			getConstraint(playground.locator('[name="description"]')),
			getConstraint(playground.locator('[name="genres"]')),
			getConstraint(playground.locator('[name="rating"]')),
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
		const title = playground.locator('[name="title"]');
		const description = playground.locator('[name="description"]');
		const genres = playground.locator('[name="genres"]');
		const rating = playground.locator('[name="rating"]');

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
		const title = playground.locator('[name="title"]');
		const description = playground.locator('[name="description"]');
		const genres = playground.locator('[name="genres"]');
		const rating = playground.locator('[name="rating"]');

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
		const title = playground.locator('[name="title"]');
		const description = playground.locator('[name="description"]');
		const genres = playground.locator('[name="genres"]');
		const rating = playground.locator('[name="rating"]');
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
