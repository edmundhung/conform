import { type Locator, test, expect } from '@playwright/test';
import { getPlayground } from '../helpers';

function getFieldset(form: Locator) {
	return {
		email: form.locator('[name="email"]'),
		password: form.locator('[name="password"]'),
		confirmPassword: form.locator('[name="confirmPassword"]'),
	};
}

test.skip('Basic usage with constraint', async ({ page }) => {
	await page.goto('/validate-constraint');

	const playground = getPlayground(page);
	const { email, password, confirmPassword } = getFieldset(
		playground.container,
	);

	await playground.submit.click();
	await expect(playground.error).toHaveText([
		'required',
		'required',
		'required',
	]);

	await email.type('a');
	await expect(playground.error).toHaveText([
		'type',
		'pattern',
		'required',
		'required',
	]);

	await email.type('@');
	await expect(playground.error).toHaveText([
		'type',
		'pattern',
		'required',
		'required',
	]);

	await email.type('e');
	await expect(playground.error).toHaveText([
		'pattern',
		'required',
		'required',
	]);

	await email.type('xample.');
	await expect(playground.error).toHaveText([
		'type',
		'pattern',
		'required',
		'required',
	]);

	await email.type('com');
	await expect(playground.error).toHaveText(['', 'required', 'required']);

	await password.type('H');
	await expect(playground.error).toHaveText([
		'',
		'minLength',
		'pattern',
		'required',
		'match',
	]);

	await password.type('ello');
	await expect(playground.error).toHaveText([
		'',
		'pattern',
		'required',
		'match',
	]);

	await password.type('123');
	await expect(playground.error).toHaveText(['', '', 'required', 'match']);

	await confirmPassword.type('Hello123');
	await expect(playground.error).toHaveText(['', '', '']);

	await confirmPassword.type('4');
	await expect(playground.error).toHaveText(['', '', 'match']);

	await password.press('Control+a');
	await password.press('ArrowRight');
	await password.type('4');
	await expect(playground.error).toHaveText(['', '', '']);

	await playground.submit.click();
	await expect(playground.submission).toHaveText(
		JSON.stringify(
			{
				intent: 'submit',
				payload: {
					email: 'a@example.com',
					password: 'Hello1234',
					confirmPassword: 'Hello1234',
				},
				error: {},
			},
			null,
			2,
		),
	);
});

test.skip('Mutliple error support', async ({ page }) => {
	await page.goto('/validate-constraint');

	const playground = getPlayground(page);
	const { email, password, confirmPassword } = getFieldset(
		playground.container,
	);

	await email.type('test@example.com');
	await confirmPassword.type('Hello1234');
	await playground.submit.click();
	await expect(playground.error).toHaveText(['', 'required', 'match']);

	await password.type('H');
	await expect(playground.error).toHaveText([
		'',
		'minLength',
		'pattern',
		'match',
	]);

	await password.type('ello');
	await expect(playground.error).toHaveText(['', 'pattern', 'match']);

	await password.type('1234');
	await expect(playground.error).toHaveText(['', '', '']);
});

test.skip('Custom error message support', async ({ page }) => {
	await page.goto('/validate-constraint?enableCustomMessage=yes');

	const playground = getPlayground(page);

	await playground.submit.click();
	await expect(playground.error).toHaveText([
		'Email is required',
		'Password is required',
		'Confirm password is required',
	]);
});

test.skip('Form reset', async ({ page }) => {
	await page.goto('/validate-constraint');

	const playground = getPlayground(page);

	await playground.submit.click();
	await expect(playground.error).toHaveText([
		'required',
		'required',
		'required',
	]);

	await playground.reset.click();
	await expect(playground.error).toHaveText(['', '', '']);
});
