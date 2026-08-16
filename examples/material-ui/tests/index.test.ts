import { expect, test, type Page } from '@playwright/test';

test.describe('material-ui', () => {
	async function getForm(page: Page, searchParams?: URLSearchParams) {
		await page.goto(searchParams ? `/?${searchParams}` : '/');

		const form = page.locator('form');
		const language = form.getByRole('combobox', {
			name: 'Language (Select)',
		});
		const movie = form.getByRole('combobox', {
			name: 'Movie (Autocomplete)',
		});
		const quantity = form.getByLabel('Quantity (NumberField)');
		const rating = (value: number) =>
			form.getByLabel(`${value} Star${value === 1 ? '' : 's'}`);
		const slider = form.getByRole('slider', { name: 'Progress (Slider)' });

		return {
			form,
			heading: page.getByRole('heading', { name: 'Material UI Example' }),
			email: form.getByLabel('Email (TextField)'),
			description: form.getByLabel('Description (TextField - multiline)'),
			language,
			async selectLanguage(label: string) {
				await language.selectOption({ label });
			},
			movie,
			async selectMovie(title: string) {
				await movie.fill(title);
				await page.getByRole('option', { name: title }).click();
			},
			quantity,
			async setQuantity(value: string) {
				// Base UI formats controlled text entry, so clear and replace in two
				// interactions to match how a user edits an existing number.
				await quantity.fill('');
				await quantity.fill(value);
			},
			increaseQuantity: form.getByRole('button', { name: 'Increase' }),
			subscribe: form.getByRole('checkbox', { name: 'Newsletter' }),
			activeYes: form.getByRole('radio', { name: 'Yes' }),
			activeNo: form.getByRole('radio', { name: 'No' }),
			enabled: form.getByRole('switch'),
			rating,
			ratingGroup: form.getByRole('radiogroup', {
				name: 'Score (Rating)',
			}),
			emptyRating: form.getByRole('radio', { name: 'Empty' }),
			async selectRating(value: number) {
				await rating(value).press('Space');
			},
			slider,
			async setSlider(value: number) {
				await slider.press('Home');

				for (let index = 0; index < value; index++) {
					await slider.press('ArrowRight');
				}
			},
			resetButton: form.getByRole('button', { name: 'Reset' }),
			submitButton: form.getByRole('button', { name: 'Submit' }),
			submittedValue: () =>
				form
					.locator('pre')
					.innerText()
					.then((value) => JSON.parse(value)),
		};
	}

	test('validation and submission', async ({ page }) => {
		const controls = await getForm(
			page,
			new URLSearchParams([
				['quantity', 'not-a-number'],
				['score', '1.5'],
				['progress', 'not-a-number'],
			]),
		);

		await expect(controls.quantity).toHaveValue('');
		await expect(controls.slider).toHaveValue('0');

		await controls.movie.focus();
		await controls.heading.click();
		await expect(controls.movie).toHaveAccessibleDescription('Choose a movie');

		await controls.email.fill('ada@example.com');
		await controls.description.fill('Material UI 9 example');
		await controls.selectLanguage('Japanese');
		await controls.activeYes.check();

		await controls.submitButton.click();
		await expect(controls.movie).toBeFocused();
		await expect(controls.movie).toHaveAccessibleDescription('Choose a movie');
		await controls.selectMovie('Pulp Fiction');

		await controls.submitButton.click();
		await expect(controls.quantity).toBeFocused();
		await expect(controls.quantity).toHaveAccessibleDescription(
			'Quantity is required',
		);
		await controls.setQuantity('20');
		await controls.increaseQuantity.click();
		await expect(controls.quantity).toHaveValue('21');

		await controls.submitButton.click();
		await expect(
			controls.ratingGroup.locator('input[type="radio"]:focus'),
		).toHaveCount(1);
		await expect(controls.ratingGroup).toHaveAccessibleDescription(
			'Score must be an integer from 1 to 5',
		);
		await controls.selectRating(4);
		await expect(controls.rating(4)).toBeChecked();

		await controls.submitButton.click();
		await expect(controls.slider).toBeFocused();
		await expect(controls.slider).toHaveAccessibleDescription(
			'Progress is required',
		);
		await controls.setSlider(5);
		await expect(controls.slider).toHaveValue('5');

		await controls.submitButton.click();

		await expect.poll(controls.submittedValue).toEqual({
			email: 'ada@example.com',
			description: 'Material UI 9 example',
			language: 'japanese',
			movie: 'Pulp Fiction',
			quantity: 21,
			subscribe: false,
			active: 'yes',
			enabled: false,
			score: 4,
			progress: 5,
		});
	});

	test('updated defaults and reset', async ({ page }) => {
		const defaults = new URLSearchParams([
			['email', 'default@example.com'],
			['description', 'Default description'],
			['language', 'english'],
			['movie', 'Pulp Fiction'],
			['quantity', '20'],
			['active', 'yes'],
			['score', '4'],
			['progress', '5'],
		]);
		const controls = await getForm(page, defaults);

		await controls.email.fill('submitted@example.com');
		await controls.description.fill('Submitted description');
		await controls.selectLanguage('Japanese');
		await controls.selectMovie('The Godfather');
		await controls.setQuantity('30');
		await controls.subscribe.check();
		await controls.activeNo.check();
		await controls.enabled.check();
		await controls.selectRating(2);
		await controls.setSlider(6);
		await controls.submitButton.click();

		await expect.poll(controls.submittedValue).toEqual({
			email: 'submitted@example.com',
			description: 'Submitted description',
			language: 'japanese',
			movie: 'The Godfather',
			quantity: 30,
			subscribe: true,
			active: 'no',
			enabled: true,
			score: 2,
			progress: 6,
		});

		await controls.email.fill('changed@example.com');
		await controls.description.fill('Changed description');
		await controls.selectLanguage('German');
		await controls.selectMovie('Pulp Fiction');
		await controls.setQuantity('40');
		await controls.subscribe.uncheck();
		await controls.activeYes.check();
		await controls.enabled.uncheck();
		await controls.selectRating(5);
		await controls.setSlider(7);

		await controls.resetButton.click();

		await expect(controls.email).toHaveValue('submitted@example.com');
		await expect(controls.description).toHaveValue('Submitted description');
		await expect(controls.language).toHaveValue('japanese');
		await expect(controls.movie).toHaveValue('The Godfather');
		await expect(controls.quantity).toHaveValue('30');
		await expect(controls.subscribe).toBeChecked();
		await expect(controls.activeNo).toBeChecked();
		await expect(controls.enabled).toBeChecked();
		await expect(controls.rating(2)).toBeChecked();
		await expect(controls.slider).toHaveValue('6');

		await controls.submitButton.click();

		await expect.poll(controls.submittedValue).toEqual({
			email: 'submitted@example.com',
			description: 'Submitted description',
			language: 'japanese',
			movie: 'The Godfather',
			quantity: 30,
			subscribe: true,
			active: 'no',
			enabled: true,
			score: 2,
			progress: 6,
		});
	});
});
