import type { FieldConstraint } from '@conform-to/dom';
import type { Page, Locator, Response } from '@playwright/test';
import { expect } from '@playwright/test';

interface FormConfig {
	mode?: 'client-only' | 'server-validation';
	initialReport?: 'onSubmit' | 'onChange' | 'onBlur';
	defaultValue?: any;
	fallbackNative?: boolean;
	noValidate?: boolean;
	validate?: boolean;
}

export async function gotoForm(
	page: Page,
	route: string,
	config?: FormConfig,
): Promise<Locator> {
	const searchParams = new URLSearchParams();

	if (typeof config?.mode !== 'undefined') {
		searchParams.set('mode', config.mode);
	}

	if (typeof config?.initialReport !== 'undefined') {
		searchParams.set('initialReport', config.initialReport);
	}

	if (typeof config?.defaultValue !== 'undefined') {
		searchParams.set('defaultValue', JSON.stringify(config.defaultValue));
	}

	if (typeof config?.fallbackNative !== 'undefined') {
		searchParams.set(
			'fallbackNative',
			config.fallbackNative ? 'true' : 'false',
		);
	}

	if (typeof config?.noValidate !== 'undefined') {
		searchParams.set('noValidate', config.noValidate ? 'true' : 'false');
	}

	if (typeof config?.validate !== 'undefined') {
		searchParams.set('validate', config.validate ? 'true' : 'false');
	}

	await page.goto(`${route}?${searchParams}`);

	return page.locator('section');
}

export function hasFocus(locator: Locator): Promise<boolean> {
	return locator.evaluate((el) => el === document.activeElement);
}

export async function waitForDataResponse(page: Page): Promise<Response> {
	return await page.waitForResponse(async (response) => {
		const request = response.request();
		const method = request.method();
		const url = new URL(response.url());

		return method === 'POST' && url.searchParams.has('_data');
	});
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
	return playground.locator('main p').allInnerTexts();
}

export async function getConstraint(field: Locator): Promise<FieldConstraint> {
	return field.evaluate((input: HTMLInputElement) => {
		const constraint: FieldConstraint = {};

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

export async function getFieldsetConstraint(
	fieldset: Record<string, Locator>,
): Promise<Record<string, FieldConstraint>> {
	const result = await Promise.all(
		Object.entries(fieldset).map<Promise<[string, FieldConstraint]>>(
			async ([key, locator]) => {
				const constraint = await getConstraint(locator);

				return [key, constraint];
			},
		),
	);

	return Object.fromEntries(result);
}

export async function getSubmission(playground: Locator): Promise<unknown> {
	const result = await playground.locator('pre').innerText();
	const data = result ? JSON.parse(result) : null;

	return data;
}

export function getMovieFieldset(playground: Locator) {
	const title = playground.locator('[name="title"]');
	const description = playground.locator('[name="description"]');
	const genre = playground.locator('[name="genre"]');
	const rating = playground.locator('[name="rating"]');

	return {
		title,
		description,
		genre,
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
	const iban = playground.locator('[name="iban"]');
	const currency = playground.locator('[name="amount.currency"]');
	const value = playground.locator('[name="amount.value"]');
	const timestamp = playground.locator('[name="timestamp"]');
	const verified = playground.locator('[name="verified"]');

	return {
		iban,
		currency,
		value,
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

export function getSignupFieldset(playground: Locator) {
	return {
		email: playground.locator('[name="email"]'),
		password: playground.locator('[name="password"]'),
		confirmPassword: playground.locator('[name="confirmPassword"]'),
	};
}

export function getEmployeeFieldset(playground: Locator) {
	return {
		name: playground.locator('[name="name"]'),
		email: playground.locator('[name="email"]'),
		title: playground.locator('[name="title"]'),
	};
}

export function getTodosFieldset(playground: Locator) {
	return {
		title: playground.locator('[name="title"]'),
		tasks: playground.locator('ol > li'),
		insertTop: playground.locator('button:text("Insert top")'),
		insertBottom: playground.locator('button:text("Insert bottom")'),
	};
}

export function getTaskFieldset(list: Locator, name: string, index: number) {
	return {
		content: list.nth(index).locator(`[name="${name}[${index}].content"]`),
		completed: list.nth(index).locator(`[name="${name}[${index}].completed"]`),
		delete: list.nth(index).locator('button:text("Delete")'),
		clear: list.nth(index).locator('button:text("Clear")'),
		moveToTop: list.nth(index).locator('button:text("Move to top")'),
	};
}

export function getPlayground(page: Page) {
	const form = page.locator('section');

	return {
		form,
		submit: form.locator('footer button[type="submit"]'),
		reset: form.locator('footer button[type="reset"]'),
		submission: form.locator('pre'),
		error: form.locator('main p'),
	};
}

export const expectNonEmptyString = expect.stringMatching(/\w+/);
