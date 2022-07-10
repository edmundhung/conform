import type { Page, Locator } from '@playwright/test';

export function getPlaygroundLocator(page: Page, title: string): Locator {
	return page.locator(`[data-playground="${title}"]`);
}

export async function clickSubmitButton(playground: Locator): Promise<void> {
	return playground.locator('button[type="submit"]').click();
}

export async function clickResetButton(playground: Locator): Promise<void> {
	return playground.locator('button[type="reset"]').click();
}

export async function getValidationMessage(field: Locator): Promise<string> {
	return field.evaluate<
		string,
		HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
	>((field) => field.validationMessage);
}

export async function isTouched(field: Locator): Promise<boolean> {
	return field.evaluate<
		boolean,
		HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
	>((field) => typeof field.dataset.touched !== 'undefined');
}

export async function getErrorMessages(playground: Locator): Promise<string[]> {
	return playground.locator('label > p').allInnerTexts();
}

export async function getConstraint(field: Locator) {
	return field.evaluate((input: HTMLInputElement) => ({
		required: input.required,
		minLength: input.minLength,
		maxLength: input.maxLength,
		min: input.min,
		max: input.max,
		step: input.step,
		multiple: input.multiple,
		pattern: input.pattern,
	}));
}

export async function getFormResult(playground: Locator): Promise<unknown> {
	const result = await playground.locator('pre').innerText();
	const data = JSON.parse(result);

	return data;
}
