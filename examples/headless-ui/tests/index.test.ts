import { test, expect, type Page } from '@playwright/test';

test.describe('headless-ui', () => {
	test.describe('Listbox', () => {
		async function getForm(page: Page) {
			await page.goto('/');

			const container = page.locator('form');

			return {
				container,
				owner: container.getByLabel('Owner (Listbox)'),
				formData: () =>
					container.evaluate((form) =>
						Array.from(new FormData(form as HTMLFormElement).entries()).map(
							([name, value]) => [name, String(value)] as const,
						),
					),
			};
		}

		test('multiple values', async ({ page }) => {
			const form = await getForm(page);

			await form.owner.click();
			await expect(form.owner).not.toHaveAttribute('aria-invalid', 'true');
			await page.getByRole('option', { name: 'Durward Reynolds' }).click();
			await page.getByRole('option', { name: 'Therese Wunsch' }).click();
			await page.keyboard.press('Escape');

			await expect(form.owner).toContainText(
				'Durward Reynolds, Therese Wunsch',
			);
			await expect.poll(form.formData).toContainEqual(['owner', '1']);
			await expect.poll(form.formData).toContainEqual(['owner', '3']);
		});
	});

	test.describe('Combobox', () => {
		async function getForm(page: Page) {
			await page.goto('/');

			const container = page.locator('form');

			return {
				container,
				heading: page.getByRole('heading', { name: 'Headless UI Example' }),
				assignee: container.getByLabel('Assigned to (Combobox)'),
				formData: () =>
					container.evaluate((form) =>
						Array.from(new FormData(form as HTMLFormElement).entries()).map(
							([name, value]) => [name, String(value)] as const,
						),
					),
			};
		}

		test('selection', async ({ page }) => {
			const form = await getForm(page);

			await form.assignee.fill('kess');
			await page.getByRole('option', { name: 'Benedict Kessler' }).click();

			await expect(form.assignee).toHaveValue('Benedict Kessler');
			await expect.poll(form.formData).toContainEqual(['assignee', '4']);
		});

		test('blur validation', async ({ page }) => {
			const form = await getForm(page);

			await form.assignee.focus();
			await form.heading.click();

			await expect(form.assignee).toHaveAttribute('aria-invalid', 'true');
			await expect(form.assignee).toHaveAccessibleDescription('Invalid input');
		});
	});

	test.describe('form', () => {
		async function getForm(page: Page, searchParams?: URLSearchParams) {
			await page.goto(searchParams ? `/?${searchParams}` : '/');

			const container = page.locator('form');

			return {
				container,
				heading: page.getByRole('heading', { name: 'Headless UI Example' }),
				submitButton: container.getByRole('button', { name: 'Save to URL' }),
				resetButton: container.getByRole('button', {
					name: 'Discard changes',
				}),
				submittedValue: () =>
					container.getByTestId('submitted-value').innerText().then(JSON.parse),
				formData: () =>
					container.evaluate((form) =>
						Array.from(new FormData(form as HTMLFormElement).entries()).map(
							([name, value]) => [name, String(value)] as const,
						),
					),
				owner: container.getByLabel('Owner (Listbox)'),
				assignee: container.getByLabel('Assigned to (Combobox)'),
				enabled: container.getByLabel('Enabled (Switch)'),
				color: container.getByLabel('Color (RadioGroup)'),
				colorError: container.locator('[id$="-field-color-error"]'),
				project: container.getByLabel('Project name'),
				notes: container.getByLabel('Notes'),
				priority: container.getByLabel('Priority'),
				notifications: container.getByLabel('Send notifications'),
			};
		}

		test('reset', async ({ page }) => {
			const searchParams = new URLSearchParams([
				['owner', '1'],
				['owner', '3'],
				['assignee', '2'],
				['enabled', 'on'],
				['color', 'Blue'],
				['project', 'Conform'],
				['notes', 'Original notes'],
				['priority', 'high'],
				['notifications', 'on'],
			]);
			const form = await getForm(page, searchParams);

			await form.owner.click();
			await page.getByRole('option', { name: 'Katelyn Rohan' }).click();
			await page.keyboard.press('Escape');
			await form.assignee.fill('Benedict');
			await page.getByRole('option', { name: 'Benedict Kessler' }).click();
			await form.enabled.click();
			await form.color.getByRole('radio', { name: 'Green' }).click();
			await form.project.fill('Changed');
			await form.notes.fill('Changed notes');
			await form.priority.selectOption('low');
			await form.notifications.click();

			await form.resetButton.click();

			await expect(form.owner).toContainText(
				'Durward Reynolds, Therese Wunsch',
			);
			await expect(form.assignee).toHaveValue('Kenton Towne');
			await expect(form.enabled).toBeChecked();
			await expect(
				form.color.getByRole('radio', { name: 'Blue' }),
			).toBeChecked();
			await expect(form.project).toHaveValue('Conform');
			await expect(form.notes).toHaveValue('Original notes');
			await expect(form.priority).toHaveValue('high');
			await expect(form.notifications).toBeChecked();
			await expect.poll(form.formData).toEqual([
				['owner', '1'],
				['owner', '3'],
				['assignee', '2'],
				['enabled', 'on'],
				['notifications', 'on'],
				['color', 'Blue'],
				['project', 'Conform'],
				['notes', 'Original notes'],
				['priority', 'high'],
			]);
		});

		test('reset to submitted values', async ({ page }) => {
			const form = await getForm(page);

			await form.owner.click();
			await page.getByRole('option', { name: 'Durward Reynolds' }).click();
			await page.keyboard.press('Escape');
			await form.assignee.fill('Kenton');
			await page.getByRole('option', { name: 'Kenton Towne' }).click();
			await form.enabled.click();
			await form.color.getByRole('radio', { name: 'Blue' }).click();
			await form.project.fill('Headless UI migration');
			await form.notes.fill('Submitted notes');
			await form.priority.selectOption('high');
			await form.notifications.click();
			await form.submitButton.click();

			await expect.poll(form.submittedValue).toEqual({
				owner: ['1'],
				assignee: '2',
				enabled: true,
				color: 'Blue',
				project: 'Headless UI migration',
				notes: 'Submitted notes',
				priority: 'high',
				notifications: true,
			});
			await form.owner.click();
			await page.getByRole('option', { name: 'Therese Wunsch' }).click();
			await page.keyboard.press('Escape');
			await form.assignee.fill('Benedict');
			await page.getByRole('option', { name: 'Benedict Kessler' }).click();
			await form.enabled.click();
			await form.color.getByRole('radio', { name: 'Green' }).click();
			await form.project.fill('Changed project');
			await form.notes.fill('Changed notes');
			await form.priority.selectOption('low');
			await form.notifications.click();

			await form.resetButton.click();

			await expect(form.owner).toContainText('Durward Reynolds');
			await expect(form.owner).not.toContainText('Therese Wunsch');
			await expect(form.assignee).toHaveValue('Kenton Towne');
			await expect(form.enabled).toBeChecked();
			await expect(
				form.color.getByRole('radio', { name: 'Blue' }),
			).toBeChecked();
			await expect(form.project).toHaveValue('Headless UI migration');
			await expect(form.notes).toHaveValue('Submitted notes');
			await expect(form.priority).toHaveValue('high');
			await expect(form.notifications).toBeChecked();
			await expect.poll(form.formData).toEqual([
				['owner', '1'],
				['assignee', '2'],
				['enabled', 'on'],
				['notifications', 'on'],
				['color', 'Blue'],
				['project', 'Headless UI migration'],
				['notes', 'Submitted notes'],
				['priority', 'high'],
			]);
		});

		test('validation', async ({ page }) => {
			const form = await getForm(page);

			await form.owner.focus();
			await form.heading.click();
			await expect(form.owner).toHaveAttribute('aria-invalid', 'true');
			await expect(form.owner).toHaveAccessibleDescription('Invalid input');

			await form.color.getByRole('radio').first().focus();
			await form.heading.click();
			await expect(form.color).toHaveAttribute('aria-invalid', 'true');
			await expect(form.color).toHaveAttribute(
				'aria-errormessage',
				/field-color-error$/,
			);
			await expect(form.colorError).toHaveText('Invalid input');

			await form.project.focus();
			await form.heading.click();
			await expect(form.project).toHaveAttribute('aria-invalid', 'true');
			await expect(form.project).toHaveAccessibleDescription(/Invalid input/);
		});

		test('validation focus', async ({ page, browserName }) => {
			test.skip(
				browserName === 'webkit',
				'WebKit cannot focus the multiple-select base control',
			);

			const form = await getForm(page);

			await form.submitButton.click();
			await expect(form.owner).toHaveAccessibleDescription('Invalid input');
			await expect(form.owner).toHaveAttribute('aria-invalid', 'true');
			await expect(form.owner).toBeFocused();

			await form.owner.click();
			await page.getByRole('option', { name: 'Durward Reynolds' }).click();
			await page.keyboard.press('Escape');
			await form.submitButton.click();
			await expect(form.assignee).toHaveAccessibleDescription('Invalid input');
			await expect(form.assignee).toBeFocused();

			await form.assignee.fill('Kenton');
			await page.getByRole('option', { name: 'Kenton Towne' }).click();
			await form.submitButton.click();
			await expect(form.color).toHaveAttribute('aria-invalid', 'true');
			await expect(form.color).toHaveAttribute(
				'aria-errormessage',
				/field-color-error$/,
			);
			await expect(form.colorError).toHaveText('Invalid input');
			await expect(form.color.getByRole('radio').first()).toBeFocused();

			await form.color.getByRole('radio', { name: 'Blue' }).click();
			await form.submitButton.click();
			await expect(form.project).toHaveAccessibleDescription(/Invalid input/);
			await expect(form.project).toBeFocused();
		});

		test('submission', async ({ page }) => {
			const form = await getForm(page);

			await form.owner.click();
			await page.getByRole('option', { name: 'Durward Reynolds' }).click();
			await page.keyboard.press('Escape');
			await form.assignee.fill('Kenton');
			await page.getByRole('option', { name: 'Kenton Towne' }).click();
			await form.color.getByRole('radio', { name: 'Blue' }).click();
			await form.project.fill('Headless UI migration');
			await form.submitButton.click();

			await expect.poll(form.submittedValue).toEqual({
				owner: ['1'],
				assignee: '2',
				enabled: false,
				color: 'Blue',
				project: 'Headless UI migration',
				priority: 'normal',
				notifications: false,
			});
		});
	});
});
