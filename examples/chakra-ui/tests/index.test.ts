import { expect, test, type Page } from '@playwright/test';

test.describe('chakra-ui', () => {
	async function getForm(page: Page, searchParams?: URLSearchParams) {
		await page.goto(searchParams ? `/?${searchParams}` : '/');
		const form = page.locator('form');
		const pin = form.locator('[data-scope="pin-input"][data-part="input"]');
		const editablePreview = form.locator(
			'[data-scope="editable"][data-part="preview"]',
		);
		const editableInput = form.locator(
			'[data-scope="editable"][data-part="input"]',
		);
		const tagItems = form.locator(
			'[data-scope="tags-input"][data-part="item-text"]',
		);

		return {
			form,
			email: form.getByLabel('Email (Input)'),
			language: form.getByLabel('Language (NativeSelect)'),
			description: form.getByLabel('Description (Textarea)'),
			quantity: form.getByLabel('Quantity (NumberInput)'),
			pin,
			getPinValue() {
				return pin.evaluateAll((inputs) =>
					inputs.map((input) => (input as HTMLInputElement).value).join(''),
				);
			},
			async setPin(value: string) {
				for (const [index, character] of Array.from(value).entries()) {
					await pin.nth(index).fill(character);
				}
			},
			editablePreview,
			editableInput,
			async setEditable(value: string) {
				if (!(await editableInput.isVisible())) {
					await editablePreview.dblclick();
				}
				await editableInput.fill(value);
				await editableInput.press('Enter');
			},
			subscribe: form.getByRole('checkbox', { name: 'Newsletter' }),
			subscribeControl: form.locator(
				'[data-scope="checkbox"][data-part="control"]',
			),
			enabled: form.getByRole('checkbox', { name: 'On' }),
			enabledControl: form.locator(
				'[data-scope="switch"][data-part="control"]',
			),
			slider: form.getByRole('slider', { name: 'Progress (Slider)' }),
			sliderControl: form.locator('[data-scope="slider"][data-part="control"]'),
			radioGroup: form.getByRole('radiogroup'),
			radioYes: form
				.locator('[data-scope="radio-group"][data-part="item"]')
				.filter({ hasText: 'Yes' }),
			radioNo: form
				.locator('[data-scope="radio-group"][data-part="item"]')
				.filter({ hasText: 'No' }),
			tagsInput: form.getByPlaceholder('Type a tag and press Enter'),
			getTagsValue() {
				return tagItems.allTextContents();
			},
			fileInput: form.locator('input[type="file"]:not([name])'),
			fileTrigger: form.getByRole('button', {
				name: 'Attachment (FileUpload, required) Choose file',
			}),
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

	test('validation and submission', async ({ page }) => {
		const controls = await getForm(page);

		await controls.pin.first().focus();
		await controls.pin.nth(1).focus();
		await expect(controls.pin.first()).toHaveAccessibleDescription('');
		await controls.heading.click();
		await expect(controls.pin.first()).toHaveAccessibleDescription(
			'PIN is required',
		);

		await controls.email.fill('ada@example.com');
		await controls.language.selectOption('japanese');
		await controls.description.fill('Chakra UI v3');

		await controls.submitButton.click();
		await expect(controls.quantity).toBeFocused();
		await expect(controls.quantity).toHaveAccessibleDescription(
			'Quantity is required',
		);
		await controls.quantity.fill('2');

		await controls.submitButton.click();
		await expect(controls.pin.first()).toBeFocused();
		await controls.setPin('1');
		await expect.poll(controls.getPinValue).toBe('1');
		await controls.setPin('1234');

		await controls.submitButton.click();
		await expect(controls.editableInput).toBeFocused();
		await expect(controls.editablePreview).toHaveAccessibleDescription(
			'Title is required',
		);
		await controls.setEditable('Modern form');

		await controls.submitButton.click();
		await expect(controls.subscribe).toBeFocused();
		await expect(controls.subscribe).toHaveAccessibleDescription(
			'Newsletter consent is required',
		);
		await controls.subscribeControl.click();

		await controls.submitButton.click();
		await expect(controls.enabled).toBeFocused();
		await expect(controls.enabled).toHaveAccessibleDescription(
			'Enable this setting',
		);
		await controls.enabledControl.click();

		await controls.submitButton.click();
		await expect(controls.slider).toBeFocused();
		await expect(controls.slider).toHaveAccessibleDescription(
			'Progress is required',
		);
		await controls.slider.scrollIntoViewIfNeeded();
		const thumbBox = await controls.slider.boundingBox();
		const controlBox = await controls.sliderControl.boundingBox();

		if (!thumbBox || !controlBox) {
			throw new Error('Slider must be visible');
		}

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

		await controls.submitButton.click();
		await expect(controls.radioYes.getByRole('radio')).toBeFocused();
		await expect(controls.radioGroup).toHaveAccessibleDescription(
			'Choose an active state',
		);
		await controls.radioNo.click();

		await controls.submitButton.click();
		await expect(controls.tagsInput).toBeFocused();
		await expect(controls.tagsInput).toHaveAccessibleDescription(
			'Add at least one topic',
		);
		await controls.tagsInput.fill('react');
		await controls.tagsInput.press('Enter');

		await controls.submitButton.click();
		await expect(controls.fileTrigger).toBeFocused();
		await expect(controls.fileTrigger).toHaveAccessibleDescription(
			'Choose a file',
		);
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
			progress: 6,
			active: 'no',
			tags: ['react'],
			attachment: {
				name: 'notes.txt',
				size: 12,
				type: 'text/plain',
			},
		});
	});

	test('updated defaults and reset', async ({ page }) => {
		const defaults = new URLSearchParams([
			['email', 'default@example.com'],
			['language', 'english'],
			['description', 'Default description'],
			['quantity', '2'],
			['pin', '1234'],
			['title', 'Default title'],
			['progress', '4'],
			['active', 'yes'],
			['tags', 'react'],
			['tags', 'chakra'],
		]);
		const controls = await getForm(page, defaults);

		await controls.email.fill('submitted@example.com');
		await controls.language.selectOption('japanese');
		await controls.description.fill('Submitted description');
		await controls.quantity.fill('3');
		await controls.setPin('5678');
		await controls.setEditable('Submitted title');
		await controls.subscribeControl.click();
		await controls.enabledControl.click();
		await controls.slider.press('ArrowRight');
		await controls.radioNo.click();
		await controls.tagsInput.fill('zod');
		await controls.tagsInput.press('Enter');
		await controls.fileInput.setInputFiles({
			name: 'submitted.txt',
			mimeType: 'text/plain',
			buffer: Buffer.from('submitted'),
		});
		await controls.submitButton.click();

		await expect.poll(controls.submittedValue).toMatchObject({
			email: 'submitted@example.com',
			pin: '5678',
			progress: 5,
			tags: ['react', 'chakra', 'zod'],
			attachment: {
				name: 'submitted.txt',
				size: 9,
				type: 'text/plain',
			},
		});

		await controls.email.fill('changed@example.com');
		await controls.language.selectOption('german');
		await controls.description.fill('Changed description');
		await controls.quantity.fill('9');
		await controls.setPin('9876');
		await expect.poll(controls.getPinValue).toBe('9876');
		await controls.setEditable('Changed title');
		await controls.subscribeControl.click();
		await controls.enabledControl.click();
		await controls.slider.press('ArrowRight');
		await controls.radioYes.click();
		await controls.tagsInput.fill('other');
		await controls.tagsInput.press('Enter');
		await controls.fileInput.setInputFiles({
			name: 'changed.txt',
			mimeType: 'text/plain',
			buffer: Buffer.from('changed'),
		});

		await controls.resetButton.click();

		await expect(controls.email).toHaveValue('submitted@example.com');
		await expect(controls.language).toHaveValue('japanese');
		await expect(controls.description).toHaveValue('Submitted description');
		await expect(controls.quantity).toHaveValue('3');
		await expect.poll(controls.getPinValue).toBe('5678');
		await expect(controls.editablePreview).toHaveText('Submitted title');
		await expect(controls.subscribe).toBeChecked();
		await expect(controls.enabled).toBeChecked();
		await expect(controls.slider).toHaveAttribute('aria-valuenow', '5');
		await expect(controls.radioNo.getByRole('radio')).toBeChecked();
		await expect
			.poll(controls.getTagsValue)
			.toEqual(['react', 'chakra', 'zod']);
		await expect(
			controls.form.locator(
				'[data-scope="file-upload"][data-part="item-name"]',
			),
		).toHaveCount(0);

		await controls.fileInput.setInputFiles({
			name: 'reset.txt',
			mimeType: 'text/plain',
			buffer: Buffer.from('reset'),
		});
		await controls.submitButton.click();

		await expect.poll(controls.submittedValue).toEqual({
			email: 'submitted@example.com',
			language: 'japanese',
			description: 'Submitted description',
			quantity: 3,
			pin: '5678',
			title: 'Submitted title',
			subscribe: true,
			enabled: true,
			progress: 5,
			active: 'no',
			tags: ['react', 'chakra', 'zod'],
			attachment: {
				name: 'reset.txt',
				size: 5,
				type: 'text/plain',
			},
		});
	});
});
