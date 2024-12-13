import { type Locator, test, expect } from '@playwright/test';
import { getPlayground } from './helpers';

function getFieldset(form: Locator) {
	return {
		token: form.locator('[name="token"]'),
		text: form.locator('[name="input.text"]'),
		number: form.locator('[name="input.number"]'),
		files: form.locator('[name="input.files"]'),
		textarea: form.locator('[name="textarea"]'),
		select: form.locator('[name="select"]'),
		multiSelect: form.locator('[name="multiSelect"]'),
		checkbox: form.locator('[name="checkbox"]'),
		checkboxGroup: form.locator('[name="checkboxGroup"]'),
		radioGroup: form.locator('[name="radioGroup"]'),
	};
}

async function assertFieldsetValue(
	fieldset: ReturnType<typeof getFieldset>,
	value: {
		input: {
			text: string;
			number: number;
		};
		textarea: string;
		select: string;
		multiSelect: string[];
		checkbox: boolean;
		checkboxGroup: string[];
		radioGroup: string;
	},
) {
	// This check if Conform omit the token field based on the shouldSyncElement option
	await expect(fieldset.token).toHaveValue('1-0624770');

	await expect(fieldset.text).toHaveValue(value.input.text);
	await expect(fieldset.number).toHaveValue(value.input.number.toString());
	await expect(fieldset.files).toHaveValue('');
	await expect(fieldset.textarea).toHaveValue(value.textarea);
	await expect(fieldset.select).toHaveValue(value.select);
	await expect(fieldset.multiSelect).toHaveValues(value.multiSelect);

	if (value.checkbox) {
		await expect(fieldset.checkbox).toBeChecked();
	} else {
		await expect(fieldset.checkbox).not.toBeChecked();
	}

	for (const option of await fieldset.checkboxGroup.all()) {
		if (value.checkboxGroup.includes(await option.inputValue())) {
			await expect(option).toBeChecked();
		} else {
			await expect(option).not.toBeChecked();
		}
	}

	for (const option of await fieldset.radioGroup.all()) {
		if ((await option.inputValue()) === value.radioGroup) {
			await expect(option).toBeChecked();
		} else {
			await expect(option).not.toBeChecked();
		}
	}
}

test('sync fields value', async ({ page }) => {
	await page.goto('/sync-form-state');

	const playground = getPlayground(page);
	const fieldset = getFieldset(playground.container);
	const updateValueButton = playground.container.locator(
		'button:text("Update value")',
	);
	const toggleNumberFieldButton = playground.container.locator(
		'button:text("Toggle number field")',
	);
	const defaultValue = {
		input: {
			text: 'Hello World',
			number: 2,
		},
		textarea: 'Once upon a time',
		select: 'green',
		multiSelect: ['banana', 'cherry'],
		checkbox: false,
		checkboxGroup: ['HTML', 'CSS'],
		radioGroup: 'Deutsch',
	};
	const valueToBeSet = {
		input: {
			text: 'Updated',
			number: 3,
		},
		textarea: 'Some text here',
		select: 'blue',
		multiSelect: ['apple', 'cherry'],
		checkbox: true,
		checkboxGroup: ['HTML', 'JS'],
		radioGroup: 'English',
	};
	const newDefaultValue = {
		input: {
			text: 'Default text',
			number: 4,
		},
		textarea: 'You need to write something here',
		select: 'red',
		multiSelect: ['apple', 'banana', 'cherry'],
		checkbox: false,
		checkboxGroup: ['JS', 'CSS'],
		radioGroup: 'Français',
	};

	await assertFieldsetValue(fieldset, defaultValue);
	await updateValueButton.click();
	await assertFieldsetValue(fieldset, valueToBeSet);

	// Check if mounting/unmounting the number field will break the sync
	await toggleNumberFieldButton.click();
	await expect(fieldset.number).not.toBeAttached();
	await toggleNumberFieldButton.click();
	// FIXME: The value of the number field should be the default value?
	// We need a better way to differentiate default value vs last submitted value vs value user set
	await expect(fieldset.number).toHaveValue(
		valueToBeSet.input.number.toString(),
	);

	await playground.reset.click();
	await assertFieldsetValue(fieldset, defaultValue);
	await updateValueButton.click();
	await assertFieldsetValue(fieldset, valueToBeSet);
	await playground.submit.click();
	await assertFieldsetValue(fieldset, newDefaultValue);
	await updateValueButton.click();
	await assertFieldsetValue(fieldset, valueToBeSet);
	await playground.reset.click();
	await assertFieldsetValue(fieldset, newDefaultValue);
});

test('sync validation attributes', async ({ page }) => {
	await page.goto('/sync-form-state');

	const playground = getPlayground(page);
	const fieldset = getFieldset(playground.container);

	await expect(fieldset.text).toHaveJSProperty('required', true);
	await expect(fieldset.text).toHaveJSProperty('minLength', 5);
	await expect(fieldset.text).toHaveJSProperty('maxLength', 30);
	await expect(fieldset.text).toHaveJSProperty('pattern', '[a-zA-Z]+');
	await expect(fieldset.text).toHaveJSProperty('multiple', false);

	await expect(fieldset.number).toHaveJSProperty('required', false);
	await expect(fieldset.number).toHaveJSProperty('min', '5');
	await expect(fieldset.number).toHaveJSProperty('max', '10');
	await expect(fieldset.number).toHaveJSProperty('step', '1');

	await expect(fieldset.files).toHaveJSProperty('required', true);
	await expect(fieldset.files).toHaveJSProperty('multiple', true);

	await expect(fieldset.textarea).toHaveJSProperty('required', true);
	await expect(fieldset.textarea).toHaveJSProperty('minLength', 10);
	await expect(fieldset.textarea).toHaveJSProperty('maxLength', 1000);

	await expect(fieldset.select).toHaveJSProperty('required', true);
	await expect(fieldset.multiSelect).toHaveJSProperty('required', false);
	await expect(fieldset.multiSelect).toHaveJSProperty('multiple', true);

	await expect(fieldset.checkbox).toHaveJSProperty('required', true);

	expect(fieldset.checkboxGroup).toHaveCount(3);

	for (const option of await fieldset.checkboxGroup.all()) {
		await expect(option).toHaveJSProperty('required', false);
	}

	expect(fieldset.radioGroup).toHaveCount(3);

	for (const option of await fieldset.radioGroup.all()) {
		await expect(option).toHaveJSProperty('required', true);
	}
});
