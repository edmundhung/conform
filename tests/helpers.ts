import type { Constraint } from '@conform-to/dom';
import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

export function getPlaygroundLocator(page: Page, title: string): Locator {
	return page.locator(`[data-playground="${title}"]`);
}

export async function clickSubmitButton(playground: Locator): Promise<void> {
	return playground.locator('footer button[type="submit"]').click();
}

export async function clickResetButton(playground: Locator): Promise<void> {
	return playground.locator('footer button[type="reset"]').click();
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
	>((field) => typeof field.dataset.conformTouched !== 'undefined');
}

export async function getErrorMessages(playground: Locator): Promise<string[]> {
	return playground.locator('label > p').allInnerTexts();
}

export async function getConstraint(field: Locator): Promise<Constraint> {
	return field.evaluate((input: HTMLInputElement) => {
		const constraint: Constraint = {};

		if (input.required) {
			constraint.required = true;
		}

		if (input.multiple) {
			constraint.multiple = true;
		}

		if (typeof input.minLength !== 'undefined' && input.minLength !== -1) {
			constraint.minLength = input.minLength;
		}

		if (typeof input.maxLength !== 'undefined' && input.maxLength !== -1) {
			constraint.maxLength = input.maxLength;
		}

		if (input.min) {
			constraint.min = input.min;
		}

		if (input.max) {
			constraint.max = input.max;
		}

		if (input.step) {
			constraint.step = input.step;
		}

		if (input.pattern) {
			constraint.pattern = input.pattern;
		}

		return constraint;
	});
}

export async function getSubmission(playground: Locator): Promise<unknown> {
	const result = await playground.locator('pre').innerText();
	const data = result ? JSON.parse(result) : null;

	return data;
}

export function getMovieFieldset(playground: Locator) {
	const title = playground.locator('[name="title"]');
	const description = playground.locator('[name="description"]');
	const genres = playground.locator('[name="genres"]');
	const rating = playground.locator('[name="rating"]');

	return {
		title,
		description,
		genres,
		rating,
	};
}

export function getStudentFieldset(playground: Locator) {
	const name = playground.locator('[name="name"]');
	const remarks = playground.locator('[name="remarks"]');
	const score = playground.locator('[name="score"]');
	const grade = playground.locator('[name="grade"]');

	return {
		name,
		remarks,
		score,
		grade,
	};
}

export function getPaymentFieldset(playground: Locator) {
	const account = playground.locator('[name="account"]');
	const amount = playground.locator('[name="amount"]');
	const timestamp = playground.locator('[name="timestamp"]');
	const verified = playground.locator('[name="verified"]');

	return {
		account,
		amount,
		timestamp,
		verified,
	};
}

export function getLoginFieldset(playground: Locator) {
	return {
		email: playground.locator('[name="email"]'),
		password: playground.locator('[name="password"]'),
	};
}

export function getTaskFieldset(fieldset: Locator, name: string) {
	return {
		content: fieldset.locator(`[name="${name}.content"]`),
		completed: fieldset.locator(`[name="${name}.completed"]`),
	};
}

export const expectNonEmptyString = expect.stringMatching(/^$|\s/);
