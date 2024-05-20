import { type Locator, test, expect } from '@playwright/test';
import { getPlayground } from './helpers';

function getFieldset(form: Locator) {
	return {
		email: form.locator('[name="email"]'),
		password: form.locator('[name="password"]'),
		confirmPassword: form.locator('[name="confirmPassword"]'),
		inputWithNoName: form.locator('input[name=""]'),
	};
}

test('shouldValidate: onSubmit', async ({ page }) => {
	await page.goto('/validation-flow?shouldValidate=onSubmit');

	const playground = getPlayground(page);
	const { email, password, confirmPassword } = getFieldset(
		playground.container,
	);

	await email.type('Invalid email');
	await password.type('1234');
	await confirmPassword.type('5678');

	// To ensure it leaves the last field
	await playground.form.press('Tab');

	await expect(playground.error).toHaveText(['', '', '']);

	await playground.submit.click();

	await expect(playground.error).toHaveText([
		'Email is invalid',
		'Password is too short',
		'Password does not match',
	]);

	await email.clear();
	await email.type('example@conform.guide');
	await password.clear();
	await password.type('secretpassword');
	await confirmPassword.clear();
	await confirmPassword.type('secretpassword');

	// To check if revalidate defaults to onSubmit as well
	await playground.form.press('Tab');
	await expect(playground.error).toHaveText([
		'Email is invalid',
		'Password is too short',
		'Password does not match',
	]);

	await playground.submit.click();
	await expect(playground.error).toHaveText(['', '', '']);
});

test('shouldValidate: onInput', async ({ page }) => {
	await page.goto(
		'/validation-flow?showInputWithNoName=yes&shouldValidate=onInput',
	);

	const playground = getPlayground(page);
	const { email, password, confirmPassword, inputWithNoName } = getFieldset(
		playground.container,
	);

	// It should ignore input with no name
	await inputWithNoName.type('hi');
	await expect(playground.error).toHaveText(['', '', '', '']);

	await email.type('Invalid email');
	await expect(playground.error).toHaveText(['Email is invalid', '', '', '']);

	await password.type('1234');
	await expect(playground.error).toHaveText([
		'Email is invalid',
		'Password is too short',
		'',
		'',
	]);

	await confirmPassword.type('5678');
	await expect(playground.error).toHaveText([
		'Email is invalid',
		'Password is too short',
		'Password does not match',
		'',
	]);

	// To check if revalidate defaults to onInput as well
	await email.clear();
	await email.type('example@conform.guide');
	await expect(playground.error).toHaveText([
		'',
		'Password is too short',
		'Password does not match',
		'',
	]);

	await password.clear();
	await password.type('secretpassword');
	await expect(playground.error).toHaveText([
		'',
		'',
		'Password does not match',
		'',
	]);

	await confirmPassword.clear();
	await confirmPassword.type('secretpassword');
	await expect(playground.error).toHaveText(['', '', '', '']);
});

test('shouldValidate: onBlur', async ({ page }) => {
	await page.goto('/validation-flow?shouldValidate=onBlur');

	const playground = getPlayground(page);
	const { email, password, confirmPassword } = getFieldset(
		playground.container,
	);

	await email.fill('Invalid email');
	await expect(playground.error).toHaveText(['', '', '']);

	await playground.form.press('Tab');
	await expect(playground.error).toHaveText(['Email is invalid', '', '']);

	await password.fill('1234');
	await expect(playground.error).toHaveText(['Email is invalid', '', '']);

	await playground.form.press('Tab');
	await expect(playground.error).toHaveText([
		'Email is invalid',
		'Password is too short',
		'',
	]);

	await confirmPassword.fill('5678');
	await expect(playground.error).toHaveText([
		'Email is invalid',
		'Password is too short',
		'',
	]);

	await playground.form.press('Tab');
	await expect(playground.error).toHaveText([
		'Email is invalid',
		'Password is too short',
		'Password does not match',
	]);

	await email.clear();
	await email.fill('test@email.registered');
	await expect(playground.error).toHaveText([
		'Email is invalid',
		'Password is too short',
		'Password does not match',
	]);

	await playground.form.press('Tab');
	await expect(playground.error).toHaveText([
		'',
		'Password is too short',
		'Password does not match',
	]);

	await password.fill('secretpassword');
	await expect(playground.error).toHaveText([
		'',
		'Password is too short',
		'Password does not match',
	]);

	await playground.form.press('Tab');
	await expect(playground.error).toHaveText([
		'',
		'',
		'Password does not match',
	]);

	await confirmPassword.fill('secretpassword');
	await expect(playground.error).toHaveText([
		'',
		'',
		'Password does not match',
	]);

	await playground.form.press('Tab');
	await expect(playground.error).toHaveText(['', '', '']);

	await playground.submit.click();
	await expect(playground.error).toHaveText([
		'Email is already registered',
		'',
		'',
	]);

	await email.click();
	await password.click();
	await expect(playground.error).toHaveText([
		'Email is already registered',
		'',
		'',
	]);

	await email.fill('example@conform.guide');
	await playground.form.press('Tab');
	await expect(playground.error).toHaveText(['', '', '']);
});

test('shouldRevalidate: onSubmit', async ({ page }) => {
	await page.goto('/validation-flow?shouldRevalidate=onSubmit');

	const playground = getPlayground(page);
	const { email, password, confirmPassword } = getFieldset(
		playground.container,
	);

	await playground.submit.click();

	await expect(playground.error).toHaveText([
		'Email is required',
		'Password is required',
		'Confirm password is required',
	]);

	await email.type('support@conform.guide');
	await password.type('12345678');
	await confirmPassword.type('12345678');
	await expect(playground.error).toHaveText([
		'Email is required',
		'Password is required',
		'Confirm password is required',
	]);

	await playground.submit.click();
	await expect(playground.error).toHaveText(['', '', '']);
});

test('shouldRevalidate: onInput', async ({ page }) => {
	await page.goto('/validation-flow?shouldRevalidate=onInput');

	const playground = getPlayground(page);
	const { email, password, confirmPassword } = getFieldset(
		playground.container,
	);

	await playground.submit.click();
	await expect(playground.error).toHaveText([
		'Email is required',
		'Password is required',
		'Confirm password is required',
	]);

	await email.type('support@conform.guide');
	await expect(playground.error).toHaveText([
		'',
		'Password is required',
		'Confirm password is required',
	]);
	await password.type('12345678');
	await expect(playground.error).toHaveText([
		'',
		'',
		'Confirm password is required',
	]);
	await confirmPassword.type('12345678');
	await expect(playground.error).toHaveText(['', '', '']);
});

test('shouldRevalidate: onBlur', async ({ page }) => {
	await page.goto('/validation-flow?shouldRevalidate=onBlur');

	const playground = getPlayground(page);
	const { email, password, confirmPassword } = getFieldset(
		playground.container,
	);

	await playground.submit.click();
	await expect(playground.error).toHaveText([
		'Email is required',
		'Password is required',
		'Confirm password is required',
	]);

	await email.type('support@conform.guide');
	await expect(playground.error).toHaveText([
		'Email is required',
		'Password is required',
		'Confirm password is required',
	]);
	await playground.form.press('Tab');
	await expect(playground.error).toHaveText([
		'',
		'Password is required',
		'Confirm password is required',
	]);

	await password.type('12345678');
	await expect(playground.error).toHaveText([
		'',
		'Password is required',
		'Confirm password is required',
	]);
	await playground.form.press('Tab');
	await expect(playground.error).toHaveText([
		'',
		'',
		'Confirm password is required',
	]);

	await confirmPassword.type('12345678');
	await expect(playground.error).toHaveText([
		'',
		'',
		'Confirm password is required',
	]);
	await playground.form.press('Tab');
	await expect(playground.error).toHaveText(['', '', '']);
});
