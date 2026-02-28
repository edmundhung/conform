/// <reference types="@vitest/browser/matchers" />
import { describe, it, expect } from 'vitest';
import { render } from 'vitest-browser-react';
import { BaseControl } from '../future';

describe('future export: BaseControl', () => {
	it('forwards native props to the rendered base control', async () => {
		const screen = render(
			<form>
				<BaseControl
					type="checkbox"
					name="newsletter"
					value="yes"
					defaultChecked
					disabled
					data-kind="checkbox"
				/>
				<BaseControl
					type="radio"
					name="theme"
					value="dark"
					defaultChecked
					data-kind="radio"
				/>
				<BaseControl
					type="checkbox"
					name="native-default"
					defaultChecked
					data-kind="default-checkbox"
				/>
				<BaseControl
					type="select"
					name="categories"
					defaultValue={['tutorial', 'guide']}
					multiple
					required
					data-kind="select"
				/>
				<BaseControl
					type="textarea"
					name="notes"
					defaultValue="Remember me"
					rows={4}
					maxLength={100}
					data-kind="textarea"
				/>
				<BaseControl
					type="file"
					name="attachments"
					defaultValue={undefined}
					multiple
					accept="image/*"
					data-kind="file"
				/>
			</form>,
		);

		const checkbox = screen.container.querySelector<HTMLInputElement>(
			'input[data-kind="checkbox"]',
		);
		const radio = screen.container.querySelector<HTMLInputElement>(
			'input[data-kind="radio"]',
		);
		const defaultCheckbox = screen.container.querySelector<HTMLInputElement>(
			'input[data-kind="default-checkbox"]',
		);
		const select = screen.container.querySelector<HTMLSelectElement>(
			'select[data-kind="select"]',
		);
		const textarea = screen.container.querySelector<HTMLTextAreaElement>(
			'textarea[data-kind="textarea"]',
		);
		const fileInput = screen.container.querySelector<HTMLInputElement>(
			'input[data-kind="file"]',
		);

		expect(checkbox?.checked).toBe(true);
		expect(checkbox?.disabled).toBe(true);
		expect(checkbox?.value).toBe('yes');

		expect(radio?.checked).toBe(true);
		expect(radio?.value).toBe('dark');

		expect(defaultCheckbox?.checked).toBe(true);
		expect(defaultCheckbox?.value).toBe('on');

		expect(select?.multiple).toBe(true);
		expect(select?.required).toBe(true);
		expect(
			Array.from(select?.selectedOptions ?? []).map((option) => option.value),
		).toEqual(['tutorial', 'guide']);

		expect(textarea?.rows).toBe(4);
		expect(textarea?.maxLength).toBe(100);
		expect(textarea?.defaultValue).toBe('Remember me');

		expect(fileInput?.type).toBe('file');
		expect(fileInput?.multiple).toBe(true);
		expect(fileInput?.accept).toBe('image/*');
	});

	it('renders structured values for fieldset base controls', async () => {
		const screen = render(
			<form id="test-form">
				<BaseControl
					type="fieldset"
					name="range"
					defaultValue={{
						start: '2026-01-01',
						end: '2026-01-07',
						members: [{ id: '1' }, { id: '2' }],
					}}
					form="test-form"
					disabled
					data-kind="fieldset"
				/>
			</form>,
		);

		const fieldset = screen.container.querySelector<HTMLFieldSetElement>(
			'fieldset[data-kind="fieldset"]',
		);

		expect(fieldset?.hidden).toBe(true);
		expect(fieldset?.disabled).toBe(true);
		expect(fieldset?.getAttribute('name')).toBe('range');

		const values = Array.from(
			screen.container.querySelectorAll<HTMLInputElement>('fieldset input'),
		).map((input) => ({
			name: input.name,
			value: input.defaultValue,
			form: input.getAttribute('form'),
		}));

		expect(values).toEqual([
			{ name: 'range.start', value: '2026-01-01', form: 'test-form' },
			{ name: 'range.end', value: '2026-01-07', form: 'test-form' },
			{ name: 'range.members[0].id', value: '1', form: 'test-form' },
			{ name: 'range.members[1].id', value: '2', form: 'test-form' },
		]);
	});
});
