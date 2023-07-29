import type { Page, Locator, Response } from '@playwright/test';

interface FormConfig {
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

export function getPlayground(page: Page) {
	const container = page.locator('body');

	return {
		container,
		form: container.locator('form'),
		submit: container.locator('footer button[type="submit"]'),
		reset: container.locator('footer button[type="reset"]'),
		submission: container.locator('pre'),
		error: container.locator('main p'),
	};
}

export const expectNonEmptyString = /\w+/;
