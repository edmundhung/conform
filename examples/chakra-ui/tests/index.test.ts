import { expect, test, type Locator, type Page } from '@playwright/test';

test.describe('chakra-ui', () => {
	test.describe('form', () => {
		async function getForm(page: Page, searchParams?: URLSearchParams) {
			await page.goto(searchParams ? `/?${searchParams}` : '/');
			const form = page.locator('form');

			return {
				form,
				email: form.getByLabel('Email (Input)'),
				language: form.getByLabel('Language (NativeSelect)'),
				description: form.getByLabel('Description (Textarea)'),
				quantity: form.getByLabel('Quantity (NumberInput)'),
				pin: form.locator('[data-scope="pin-input"][data-part="input"]'),
				editablePreview: form.locator(
					'[data-scope="editable"][data-part="preview"]',
				),
				editableInput: form.locator(
					'[data-scope="editable"][data-part="input"]',
				),
				subscribe: form.getByRole('checkbox', { name: 'Newsletter' }),
				subscribeControl: form.locator(
					'[data-scope="checkbox"][data-part="control"]',
				),
				enabled: form.getByRole('checkbox', { name: 'On' }),
				enabledControl: form.locator(
					'[data-scope="switch"][data-part="control"]',
				),
				slider: form.getByRole('slider'),
				sliderControl: form.locator(
					'[data-scope="slider"][data-part="control"]',
				),
				radioGroup: form.getByRole('radiogroup'),
				radioYes: form
					.locator('[data-scope="radio-group"][data-part="item"]')
					.filter({ hasText: 'Yes' }),
				radioNo: form
					.locator('[data-scope="radio-group"][data-part="item"]')
					.filter({ hasText: 'No' }),
				tagsInput: form.getByPlaceholder('Type a tag and press Enter'),
				fileInput: form.locator('input[type="file"]:not([name])'),
				fileTrigger: form.getByRole('button', { name: 'Choose file' }),
				heading: page.getByRole('heading', { name: 'Chakra UI Example' }),
				resetButton: form.getByRole('button', { name: 'Reset' }),
				submitButton: form.getByRole('button', { name: 'Submit' }),
				submittedValue: () =>
					form
						.locator('pre')
						.innerText()
						.then((value) => JSON.parse(value)),
			};
		}

		async function setEditable(
			preview: Locator,
			input: Locator,
			value: string,
		) {
			if (!(await input.isVisible())) {
				await preview.dblclick();
			}
			await input.fill(value);
			await input.press('Enter');
		}

		async function setPin(inputs: Locator, value: string) {
			await expect(inputs).toHaveCount(value.length);

			for (let index = 0; index < value.length; index++) {
				const input = inputs.nth(index);
				const character = value[index] ?? '';
				await input.fill(character);
				await expect(input).toHaveValue(character);
			}
		}

		async function expectPin(inputs: Locator, value: string) {
			await expect(inputs).toHaveCount(value.length);

			for (let index = 0; index < value.length; index++) {
				await expect(inputs.nth(index)).toHaveValue(value[index] ?? '');
			}
		}

		async function getFormData(form: Locator) {
			return form.evaluate((element) => {
				const entries = Array.from(
					new FormData(element as HTMLFormElement),
				).map(([name, value]) => [
					name,
					value instanceof File
						? { name: value.name, size: value.size, type: value.type }
						: value,
				]);

				return entries;
			});
		}

		test('submit', async ({ page }) => {
			const controls = await getForm(page);

			await controls.email.fill('ada@example.com');
			await controls.language.selectOption('japanese');
			await controls.description.fill('Chakra UI v3');
			await controls.quantity.fill('2');
			await setPin(controls.pin, '1234');
			await setEditable(
				controls.editablePreview,
				controls.editableInput,
				'Modern form',
			);
			await controls.subscribeControl.click();
			await controls.enabledControl.click();
			await controls.slider.press('ArrowRight');
			await controls.slider.press('ArrowRight');
			await controls.slider.press('ArrowRight');
			await controls.radioNo.click();
			await controls.tagsInput.fill('react');
			await controls.tagsInput.press('Enter');
			await expect(
				controls.form
					.locator('[data-scope="tags-input"][data-part="item-text"]')
					.filter({ hasText: 'react' }),
			).toHaveCount(1);
			await controls.tagsInput.click();
			await controls.tagsInput.pressSequentially('chakra');
			await controls.tagsInput.press('Enter');
			await expect(
				controls.form
					.locator('[data-scope="tags-input"][data-part="item-text"]')
					.filter({ hasText: 'chakra' }),
			).toHaveCount(1);
			await controls.fileInput.setInputFiles({
				name: 'notes.txt',
				mimeType: 'text/plain',
				buffer: Buffer.from('Chakra UI v3'),
			});

			await controls.submitButton.click();

			await expect.poll(controls.submittedValue).toEqual({
				email: 'ada@example.com',
				language: 'japanese',
				description: 'Chakra UI v3',
				quantity: 2,
				pin: '1234',
				title: 'Modern form',
				subscribe: true,
				enabled: true,
				progress: 3,
				active: 'no',
				tags: ['react', 'chakra'],
				attachment: {
					name: 'notes.txt',
					size: 12,
					type: 'text/plain',
				},
			});
		});

		test('reset', async ({ page }) => {
			const defaults = new URLSearchParams([
				['email', 'default@example.com'],
				['language', 'english'],
				['description', 'Default description'],
				['quantity', '2'],
				['pin', '1234'],
				['title', 'Default title'],
				['subscribe', 'on'],
				['enabled', 'on'],
				['progress', '4'],
				['active', 'yes'],
				['tags', 'react'],
				['tags', 'chakra'],
			]);

			for (const reset of ['conform', 'browser']) {
				const controls = await getForm(page, defaults);

				await controls.email.fill('changed@example.com');
				await controls.quantity.fill('9');
				await setPin(controls.pin, '9876');
				await setEditable(
					controls.editablePreview,
					controls.editableInput,
					'Changed title',
				);
				await controls.subscribeControl.click();
				await controls.enabledControl.click();
				await controls.slider.press('ArrowRight');
				await controls.radioNo.click();
				await controls.tagsInput.fill('zod');
				await controls.tagsInput.press('Enter');
				await controls.fileInput.setInputFiles({
					name: 'reset.txt',
					mimeType: 'text/plain',
					buffer: Buffer.from('reset'),
				});

				if (reset === 'conform') {
					await controls.resetButton.click();
				} else {
					await controls.form.evaluate((form) =>
						(form as HTMLFormElement).reset(),
					);
				}

				await expect(controls.email).toHaveValue('default@example.com');
				await expect(controls.quantity).toHaveValue('2');
				await expectPin(controls.pin, '1234');
				await expect(controls.editablePreview).toHaveText('Default title');
				await expect(controls.subscribe).toBeChecked();
				await expect(controls.enabled).toBeChecked();
				await expect(controls.slider).toHaveAttribute('aria-valuenow', '4');
				await expect(controls.radioYes.getByRole('radio')).toBeChecked();
				await expect(
					controls.form
						.locator('[data-scope="tags-input"][data-part="item-text"]')
						.filter({ hasText: 'zod' }),
				).toHaveCount(0);
				await expect(
					controls.form
						.locator('[data-scope="file-upload"][data-part="item-name"]')
						.filter({ hasText: 'reset.txt' }),
				).toHaveCount(0);

				expect(await getFormData(controls.form)).toEqual([
					['email', 'default@example.com'],
					['language', 'english'],
					['description', 'Default description'],
					['quantity', '2'],
					['pin', '1234'],
					['title', 'Default title'],
					['subscribe', 'on'],
					['enabled', 'on'],
					['progress', '4'],
					['active', 'yes'],
					['tags', 'react'],
					['tags', 'chakra'],
					[
						'attachment',
						{ name: '', size: 0, type: 'application/octet-stream' },
					],
				]);
			}
		});

		test('reset after submission', async ({ page }) => {
			const controls = await getForm(page);

			await controls.email.fill('submitted@example.com');
			await controls.language.selectOption('english');
			await controls.description.fill('Submitted description');
			await controls.quantity.fill('2');
			await setPin(controls.pin, '1234');
			await setEditable(
				controls.editablePreview,
				controls.editableInput,
				'Submitted title',
			);
			await controls.subscribeControl.click();
			await controls.enabledControl.click();
			await controls.slider.press('ArrowRight');
			await controls.slider.press('ArrowRight');
			await controls.slider.press('ArrowRight');
			await controls.slider.press('ArrowRight');
			await controls.radioYes.click();
			await controls.tagsInput.fill('react');
			await controls.tagsInput.press('Enter');
			await controls.fileInput.setInputFiles({
				name: 'submitted.txt',
				mimeType: 'text/plain',
				buffer: Buffer.from('submitted'),
			});
			await controls.submitButton.click();

			await expect.poll(controls.submittedValue).toMatchObject({
				email: 'submitted@example.com',
				progress: 4,
				tags: ['react'],
			});

			await controls.email.fill('changed@example.com');
			await controls.language.selectOption('japanese');
			await controls.description.fill('Changed description');
			await controls.quantity.fill('9');
			await setPin(controls.pin, '9876');
			await setEditable(
				controls.editablePreview,
				controls.editableInput,
				'Changed title',
			);
			await controls.subscribeControl.click();
			await controls.enabledControl.click();
			await controls.slider.press('ArrowRight');
			await controls.radioNo.click();
			await controls.tagsInput.fill('zod');
			await controls.tagsInput.press('Enter');
			await controls.fileInput.setInputFiles({
				name: 'changed.txt',
				mimeType: 'text/plain',
				buffer: Buffer.from('changed'),
			});

			await controls.resetButton.click();

			await expect(controls.email).toHaveValue('submitted@example.com');
			await expect(controls.language).toHaveValue('english');
			await expect(controls.description).toHaveValue('Submitted description');
			await expect(controls.quantity).toHaveValue('2');
			await expectPin(controls.pin, '1234');
			await expect(controls.editablePreview).toHaveText('Submitted title');
			await expect(controls.subscribe).toBeChecked();
			await expect(controls.enabled).toBeChecked();
			await expect(controls.slider).toHaveAttribute('aria-valuenow', '4');
			await expect(controls.radioYes.getByRole('radio')).toBeChecked();
			await expect(
				controls.form
					.locator('[data-scope="tags-input"][data-part="item-text"]')
					.filter({ hasText: 'react' }),
			).toHaveCount(1);
			await expect(
				controls.form.locator(
					'[data-scope="file-upload"][data-part="item-name"]',
				),
			).toHaveCount(0);

			expect(await getFormData(controls.form)).toEqual([
				['email', 'submitted@example.com'],
				['language', 'english'],
				['description', 'Submitted description'],
				['quantity', '2'],
				['pin', '1234'],
				['title', 'Submitted title'],
				['subscribe', 'on'],
				['enabled', 'on'],
				['progress', '4'],
				['active', 'yes'],
				['tags', 'react'],
				['attachment', { name: '', size: 0, type: 'application/octet-stream' }],
			]);
		});

		test('blur validation', async ({ page }) => {
			const controls = await getForm(page);

			await controls.quantity.focus();
			await controls.heading.click();
			await expect(controls.quantity).toHaveAccessibleDescription(
				'Quantity is required',
			);

			await controls.pin.first().focus();
			await controls.pin.nth(1).focus();
			await expect(controls.pin.first()).toHaveAccessibleDescription('');
			await controls.heading.click();
			await expect(controls.pin.first()).toHaveAccessibleDescription(
				'PIN is required',
			);

			await controls.editablePreview.dblclick();
			await expect(controls.editableInput).toHaveAttribute('required', '');
			await controls.heading.click();
			await expect(controls.editablePreview).toHaveAccessibleDescription(
				'Title is required',
			);

			await controls.subscribe.focus();
			await controls.heading.click();
			await expect(controls.subscribe).toHaveAccessibleDescription(
				'Newsletter consent is required',
			);

			await controls.enabled.focus();
			await controls.heading.click();
			await expect(controls.enabled).toHaveAccessibleDescription(
				'Enable this setting',
			);

			await controls.slider.focus();
			await expect(controls.slider).toHaveAttribute('aria-invalid', 'false');
			await expect(controls.slider).toHaveAttribute('aria-required', 'true');
			await expect(controls.slider.locator('input')).toHaveAttribute(
				'required',
				'',
			);
			await controls.heading.click();
			await expect(controls.slider).toHaveAttribute('aria-invalid', 'true');
			await expect(controls.slider).toHaveAccessibleDescription(
				'Progress is required',
			);

			await controls.radioYes.getByRole('radio').focus();
			await controls.radioNo.getByRole('radio').focus();
			await expect(controls.radioGroup).toHaveAccessibleDescription('');
			await controls.heading.click();
			await expect(controls.radioGroup).toHaveAttribute('aria-invalid', 'true');
			await expect(controls.radioGroup).toHaveAccessibleDescription(
				'Choose an active state',
			);

			await controls.tagsInput.focus();
			await expect(controls.tagsInput).toHaveAttribute('aria-required', 'true');
			await controls.heading.click();
			await expect(controls.tagsInput).toHaveAccessibleDescription(
				'Add at least one topic',
			);

			await controls.fileTrigger.focus();
			await controls.heading.click();
			await expect(controls.fileTrigger).toHaveAttribute(
				'aria-invalid',
				'true',
			);
			await expect(controls.fileTrigger).toHaveAccessibleDescription(
				'Choose a file',
			);
		});

		test('slider pointer input', async ({ page }) => {
			const controls = await getForm(page);
			await controls.slider.scrollIntoViewIfNeeded();
			const thumbBox = await controls.slider.boundingBox();
			const controlBox = await controls.sliderControl.boundingBox();

			expect(thumbBox).not.toBeNull();
			expect(controlBox).not.toBeNull();
			if (!thumbBox || !controlBox) return;

			expect(controlBox.width).toBeGreaterThan(0);
			await page.mouse.move(
				thumbBox.x + thumbBox.width / 2,
				thumbBox.y + thumbBox.height / 2,
			);
			await page.mouse.down();
			await page.mouse.move(
				controlBox.x + controlBox.width * 0.6,
				controlBox.y + controlBox.height / 2,
				{ steps: 5 },
			);
			await page.mouse.up();

			await expect(controls.slider).toHaveAttribute('aria-valuenow', '6');
			expect(await getFormData(controls.form)).toContainEqual([
				'progress',
				'6',
			]);
		});

		test('focus', async ({ page }) => {
			const controls = await getForm(page);

			await controls.submitButton.click();
			await expect(controls.form).not.toContainText('undefined');
			await expect(controls.email).toBeFocused();
			await controls.email.fill('ada@example.com');

			await controls.submitButton.click();
			await expect(controls.language).toBeFocused();
			await controls.language.selectOption('german');

			await controls.submitButton.click();
			await expect(controls.description).toBeFocused();
			await controls.description.fill('Description');

			await controls.submitButton.click();
			await expect(controls.quantity).toBeFocused();
			await controls.quantity.fill('1');

			await controls.submitButton.click();
			await expect(controls.pin.first()).toBeFocused();
			await setPin(controls.pin, '1234');

			await controls.submitButton.click();
			await expect(controls.editableInput).toBeFocused();
			await setEditable(
				controls.editablePreview,
				controls.editableInput,
				'Title',
			);

			await controls.submitButton.click();
			await expect(controls.subscribe).toBeFocused();
			await controls.subscribeControl.click();

			await controls.submitButton.click();
			await expect(controls.enabled).toBeFocused();
			await controls.enabledControl.click();

			await controls.submitButton.click();
			await expect(controls.slider).toBeFocused();
			await controls.slider.press('ArrowRight');
			await controls.slider.press('ArrowRight');
			await controls.slider.press('ArrowRight');

			await controls.submitButton.click();
			await expect(controls.radioYes.getByRole('radio')).toBeFocused();
			await controls.radioYes.click();

			await controls.submitButton.click();
			await expect(controls.tagsInput).toBeFocused();
			await controls.tagsInput.fill('react');
			await controls.tagsInput.press('Enter');

			await controls.submitButton.click();
			await expect(controls.fileTrigger).toBeFocused();
		});
	});
});
