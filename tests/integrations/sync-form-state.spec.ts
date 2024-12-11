import { type Locator, test, expect } from '@playwright/test';
import { getPlayground } from './helpers';

function getFieldset(form: Locator) {
	return {
		text: form.locator('[name="text"]'),
		textarea: form.locator('[name="textarea"]'),
		select: form.locator('[name="select"]'),
		multiSelect: form.locator('[name="multiSelect"]'),
		checkbox: form.locator('[name="checkbox"]'),
		checkboxGroup: form.locator('[name="checkboxGroup"]'),
		radioGroup: form.locator('[name="radioGroup"]'),
	};
}

async function assertFieldsetValue(
	form: Locator,
	value: {
		text: string;
		textarea: string;
		select: string;
		multiSelect: string[];
		checkbox: boolean;
		checkboxGroup: string[];
		radioGroup: string;
	},
) {
	const fieldset = getFieldset(form);

	await expect(fieldset.text).toHaveValue(value.text);
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
	const updateValueButton = playground.container.locator(
		'button:text("Update value")',
	);
	const defaultValue = {
		text: 'Hello World',
		textarea: 'Once upon a time',
		select: 'green',
		multiSelect: ['banana', 'cherry'],
		checkbox: false,
		checkboxGroup: ['HTML', 'CSS'],
		radioGroup: 'Deutsch',
	};
	const valueToBeSet = {
		text: 'Updated',
		textarea: 'Some text here',
		select: 'blue',
		multiSelect: ['apple', 'cherry'],
		checkbox: true,
		checkboxGroup: ['HTML', 'JS'],
		radioGroup: 'English',
	};
	const newDefaultValue = {
		text: 'Default text',
		textarea: 'You need to write something here',
		select: 'red',
		multiSelect: ['apple', 'banana', 'cherry'],
		checkbox: false,
		checkboxGroup: ['JS', 'CSS'],
		radioGroup: 'Français',
	};

	await assertFieldsetValue(playground.container, defaultValue);
	await updateValueButton.click();
	await assertFieldsetValue(playground.container, valueToBeSet);
	await playground.reset.click();
	await assertFieldsetValue(playground.container, defaultValue);
	await updateValueButton.click();
	await assertFieldsetValue(playground.container, valueToBeSet);
	await playground.submit.click();
	await assertFieldsetValue(playground.container, newDefaultValue);
	await updateValueButton.click();
	await assertFieldsetValue(playground.container, valueToBeSet);
	await playground.reset.click();
	await assertFieldsetValue(playground.container, newDefaultValue);
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
	await expect(fieldset.text).toHaveJSProperty('min', '5');
	await expect(fieldset.text).toHaveJSProperty('max', '10');
	await expect(fieldset.text).toHaveJSProperty('step', '1');

	await expect(fieldset.textarea).toHaveJSProperty('required', true);
	await expect(fieldset.textarea).toHaveJSProperty('minLength', 10);
	await expect(fieldset.textarea).toHaveJSProperty('maxLength', 1000);

	await expect(fieldset.select).toHaveJSProperty('required', true);
	await expect(fieldset.multiSelect).toHaveJSProperty('required', true);
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
