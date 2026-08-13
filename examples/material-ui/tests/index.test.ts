import { expect, test, type Locator, type Page } from '@playwright/test';

test.describe('material-ui', () => {
	test.describe('form', () => {
		async function getForm(page: Page, searchParams?: URLSearchParams) {
			await page.goto(searchParams ? `/?${searchParams}` : '/');

			const container = page.locator('form');

			return {
				container,
				heading: page.getByRole('heading', { name: 'Material UI Example' }),
				submitButton: container.getByRole('button', { name: 'Submit' }),
				resetButton: container.getByRole('button', { name: 'Reset' }),
				submittedValue: () =>
					container
						.locator('pre')
						.innerText()
						.then((value) => JSON.parse(value)),
				formData: () =>
					container.evaluate((form) =>
						Array.from(new FormData(form as HTMLFormElement).entries()).map(
							([name, value]) => [name, String(value)] as const,
						),
					),
				email: container.getByLabel('Email (TextField)'),
				description: container.getByLabel(
					'Description (TextField - multiline)',
				),
				language: container.getByRole('combobox', {
					name: 'Language (Select)',
				}),
				movie: container.getByRole('combobox', {
					name: 'Movie (Autocomplete)',
				}),
				quantity: container.getByLabel('Quantity (NumberField)'),
				subscribe: container.getByRole('checkbox', { name: 'Newsletter' }),
				activeYes: container.getByRole('radio', { name: 'Yes' }),
				enabled: container.getByRole('switch'),
				rating: (value: number) =>
					container.getByLabel(`${value} Star${value === 1 ? '' : 's'}`),
				ratingGroup: container.getByRole('radiogroup', {
					name: 'Score (Rating)',
				}),
				emptyRating: container.getByRole('radio', { name: 'Empty' }),
				slider: container.getByRole('slider', { name: 'Progress (Slider)' }),
			};
		}

		async function selectLanguage(page: Page, language: string) {
			await page.getByRole('combobox', { name: 'Language (Select)' }).click();
			await page.getByRole('option', { name: language }).click();
		}

		async function selectMovie(movie: Locator, page: Page, title: string) {
			await movie.fill(title);
			await page.getByRole('option', { name: title }).click();
		}

		async function setSlider(slider: Locator, value: number) {
			await slider.press('Home');

			for (let index = 0; index < value; index++) {
				await slider.press('ArrowRight');
			}
		}

		async function selectRating(page: Page, rating: Locator) {
			const id = await rating.getAttribute('id');

			if (!id) {
				throw new Error('Expected the Rating input to have an id');
			}

			await page.locator(`label[for="${id}"]`).click({ force: true });
		}

		test('submits Autocomplete, NumberField, Slider, Rating, and native values', async ({
			page,
		}) => {
			const form = await getForm(page);

			await form.email.fill('hello@example.com');
			await form.description.fill('A useful description');
			await selectLanguage(page, 'English');
			await selectMovie(form.movie, page, 'The Godfather');
			await form.quantity.fill('20');
			await form.container.getByRole('button', { name: 'Increase' }).click();
			await expect(form.quantity).toHaveValue('21');
			await form.subscribe.check();
			await form.activeYes.check();
			await form.enabled.check();
			await selectRating(page, form.rating(4));
			await setSlider(form.slider, 5);

			await expect.poll(form.formData).toEqual([
				['email', 'hello@example.com'],
				['description', 'A useful description'],
				['language', 'english'],
				['movie', 'The Godfather'],
				['quantity', '21'],
				['subscribe', 'on'],
				['active', 'yes'],
				['enabled', 'on'],
				['score', '4'],
				['progress', '5'],
			]);
			await form.submitButton.click();

			await expect.poll(form.submittedValue).toEqual({
				email: 'hello@example.com',
				description: 'A useful description',
				language: 'english',
				movie: 'The Godfather',
				quantity: 21,
				subscribe: true,
				active: 'yes',
				enabled: true,
				score: 4,
				progress: 5,
			});
		});

		test('validates custom controlled widgets on blur', async ({ page }) => {
			const form = await getForm(page);

			await form.movie.focus();
			await form.heading.click();
			await expect(form.movie).toHaveAttribute('aria-invalid', 'true');
			await expect(form.movie).toHaveAccessibleDescription('Invalid input');

			await form.quantity.focus();
			await form.heading.click();
			await expect(form.quantity).toHaveAttribute('aria-invalid', 'true');
			await expect(form.quantity).toHaveAccessibleDescription('Invalid input');

			await form.emptyRating.focus();
			await form.heading.click();
			await expect(form.ratingGroup).toHaveAttribute('aria-invalid', 'true');
			await expect(form.ratingGroup).toHaveAccessibleDescription(
				'Invalid input',
			);

			await form.slider.focus();
			await form.heading.click();
			await expect(form.slider).toHaveAttribute('aria-invalid', 'true');
			await expect(form.slider).toHaveAccessibleDescription('Invalid input');
		});

		test('moves validation focus through each custom controlled widget', async ({
			page,
		}) => {
			const searchParams = new URLSearchParams([
				['email', 'hello@example.com'],
				['description', 'A useful description'],
				['language', 'english'],
				['subscribe', 'on'],
				['active', 'yes'],
				['enabled', 'on'],
			]);
			const form = await getForm(page, searchParams);

			await form.submitButton.click();
			await expect(form.movie).toBeFocused();
			await selectMovie(form.movie, page, 'Pulp Fiction');

			await form.submitButton.click();
			await expect(form.quantity).toBeFocused();
			await form.quantity.fill('20');

			await form.submitButton.click();
			await expect(form.emptyRating).toBeFocused();
			await form.rating(4).press('Space');
			await expect(form.rating(4)).toBeChecked();

			await form.submitButton.click();
			await expect(form.slider).toBeFocused();
			await setSlider(form.slider, 5);

			await form.submitButton.click();
			await expect.poll(form.submittedValue).toMatchObject({
				movie: 'Pulp Fiction',
				quantity: 20,
				score: 4,
				progress: 5,
			});
		});

		test('resets custom controlled widgets to URL-backed defaults', async ({
			page,
		}) => {
			const searchParams = new URLSearchParams([
				['email', 'hello@example.com'],
				['description', 'A useful description'],
				['language', 'english'],
				['movie', 'Pulp Fiction'],
				['quantity', '20'],
				['subscribe', 'on'],
				['active', 'yes'],
				['enabled', 'on'],
				['score', '4'],
				['progress', '5'],
			]);
			for (const reset of ['conform', 'browser']) {
				const form = await getForm(page, searchParams);

				await selectMovie(form.movie, page, 'The Godfather');
				await form.quantity.fill('30');
				await selectRating(page, form.rating(2));
				await setSlider(form.slider, 7);

				if (reset === 'conform') {
					await form.resetButton.click();
				} else {
					await form.container.evaluate((element) =>
						(element as HTMLFormElement).reset(),
					);
				}

				await expect(form.movie).toHaveValue('Pulp Fiction');
				await expect(form.quantity).toHaveValue('20');
				await expect(form.rating(4)).toBeChecked();
				await expect(form.slider).toHaveValue('5');
				await expect.poll(form.formData).toEqual(Array.from(searchParams));

				await form.submitButton.click();
				await expect.poll(form.submittedValue).toEqual({
					email: 'hello@example.com',
					description: 'A useful description',
					language: 'english',
					movie: 'Pulp Fiction',
					quantity: 20,
					subscribe: true,
					active: 'yes',
					enabled: true,
					score: 4,
					progress: 5,
				});
			}
		});
	});
});
