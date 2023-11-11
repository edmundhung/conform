import { test, expect } from '@playwright/test';
import { conform } from '@conform-to/react';
import { installGlobals } from '@remix-run/node';

test.beforeAll(() => {
	installGlobals();
});

test.describe('conform-react', () => {
	test('conform.input', () => {
		const config = {
			id: 'test',
			name: 'message',
			formId: 'example',
			errorId: 'test-error',
			descriptionId: 'test-description',
			constraint: {},
			defaultValue: undefined,
			value: undefined,
			error: undefined,
			allError: {},
			allValid: true,
			valid: true,
			dirty: false,
		} as const;
		const props = {
			id: 'test',
			name: 'message',
			form: 'example',
		} as const;

		expect(conform.input(config)).toEqual(props);
		expect(
			conform.input({
				...config,
				defaultValue: 'string',
				constraint: {
					required: true,
					min: 1,
					max: 10,
					step: 1,
					minLength: 1,
					maxLength: 2,
					pattern: '[0-9]+',
					multiple: true,
				},
			}),
		).toEqual({
			...props,
			defaultValue: 'string',
			required: true,
			min: 1,
			max: 10,
			step: 1,
			minLength: 1,
			maxLength: 2,
			pattern: '[0-9]+',
			multiple: true,
		});
		expect(conform.input({ ...config, valid: false })).toEqual({
			...props,
			autoFocus: true,
			'aria-invalid': true,
			'aria-describedby': 'test-error',
		});
		expect(conform.input(config, { type: 'text' })).toEqual({
			...props,
			type: 'text',
		});
		expect(conform.input(config, { description: true })).toEqual({
			...props,
			'aria-describedby': 'test-description',
		});
		expect(
			conform.input({
				...config,
				valid: false,
			}),
		).toEqual({
			...props,
			autoFocus: true,
			'aria-invalid': true,
			'aria-describedby': 'test-error',
		});
		expect(
			conform.input(
				{
					...config,
					valid: false,
				},
				{ description: true },
			),
		).toEqual({
			...props,
			autoFocus: true,
			'aria-invalid': true,
			'aria-describedby': 'test-error test-description',
		});
		expect(
			conform.input(
				{
					...config,
					valid: false,
				},
				{ ariaAttributes: false },
			),
		).toEqual({
			...props,
			autoFocus: true,
		});
		expect(conform.input(config, { type: 'checkbox' })).toEqual({
			...props,
			type: 'checkbox',
			value: 'on',
			defaultChecked: false,
		});
		expect(
			conform.input({ ...config, defaultValue: 'on' }, { type: 'radio' }),
		).toEqual({
			...props,
			type: 'radio',
			value: 'on',
			defaultChecked: true,
		});
		expect(
			conform.input(
				{ ...config, defaultValue: 'something else' },
				{ type: 'checkbox', value: 'something else' },
			),
		).toEqual({
			...props,
			type: 'checkbox',
			value: 'something else',
			defaultChecked: true,
		});
		expect(
			conform.input(
				{ ...config, defaultValue: 'something else' },
				{ type: 'checkbox', value: 'something else' },
			),
		).toEqual({
			...props,
			type: 'checkbox',
			value: 'something else',
			defaultChecked: true,
		});
		expect(conform.input(config, { type: 'file' })).toEqual({
			...props,
			type: 'file',
		});
	});

	test('conform.textarea', () => {
		const config = {
			id: 'test',
			name: 'message',
			formId: 'example',
			errorId: 'test-error',
			descriptionId: 'test-description',
			constraint: {},
			defaultValue: undefined,
			value: undefined,
			error: undefined,
			allError: {},
			allValid: true,
			valid: true,
			dirty: false,
		} as const;
		const props = {
			id: 'test',
			name: 'message',
			form: 'example',
		} as const;

		expect(conform.textarea(config)).toEqual(props);
		expect(
			conform.textarea({
				...config,
				defaultValue: 'string',
				constraint: {
					required: true,
					min: 1,
					max: 10,
					step: 1,
					minLength: 1,
					maxLength: 2,
					pattern: '[0-9]+',
					multiple: true,
				},
			}),
		).toEqual({
			...props,
			defaultValue: 'string',
			required: true,
			minLength: 1,
			maxLength: 2,
		});
		expect(conform.textarea({ ...config, valid: false })).toEqual({
			...props,
			autoFocus: true,
			'aria-invalid': true,
			'aria-describedby': 'test-error',
		});
		expect(conform.textarea(config, { description: true })).toEqual({
			...props,
			'aria-describedby': 'test-description',
		});
		expect(
			conform.textarea({
				...config,
				valid: false,
			}),
		).toEqual({
			...props,
			autoFocus: true,
			'aria-invalid': true,
			'aria-describedby': 'test-error',
		});
		expect(
			conform.textarea(
				{
					...config,
					valid: false,
				},
				{ description: true },
			),
		).toEqual({
			...props,
			autoFocus: true,
			'aria-invalid': true,
			'aria-describedby': 'test-error test-description',
		});
		expect(
			conform.textarea(
				{
					...config,
					valid: false,
				},
				{ ariaAttributes: false },
			),
		).toEqual({
			...props,
			autoFocus: true,
		});
	});

	test('conform.select', () => {
		const config = {
			id: 'test',
			name: 'message',
			formId: 'example',
			errorId: 'test-error',
			descriptionId: 'test-description',
			constraint: {},
			defaultValue: undefined,
			value: undefined,
			error: undefined,
			allError: {},
			allValid: true,
			valid: true,
			dirty: false,
		} as const;
		const props = {
			id: 'test',
			name: 'message',
			form: 'example',
		} as const;

		expect(conform.select(config)).toEqual(props);
		expect(
			conform.select({
				...config,
				defaultValue: 'string',
				constraint: {
					required: true,
					min: 1,
					max: 10,
					step: 1,
					minLength: 1,
					maxLength: 2,
					pattern: '[0-9]+',
					multiple: true,
				},
			}),
		).toEqual({
			...props,
			defaultValue: 'string',
			required: true,
			multiple: true,
		});
		expect(conform.select({ ...config, valid: false })).toEqual({
			...props,
			autoFocus: true,
			'aria-invalid': true,
			'aria-describedby': 'test-error',
		});
		expect(conform.select(config, { description: true })).toEqual({
			...props,
			'aria-describedby': 'test-description',
		});
		expect(
			conform.select(
				{
					...config,
					valid: false,
				},
				{ description: true },
			),
		).toEqual({
			...props,
			autoFocus: true,
			'aria-invalid': true,
			'aria-describedby': 'test-error test-description',
		});
		expect(
			conform.select(
				{
					...config,
					valid: false,
				},
				{ ariaAttributes: false },
			),
		).toEqual({ ...props, autoFocus: true });
	});

	test('conform.fieldset', () => {
		const config = {
			id: 'test',
			name: 'message',
			formId: 'example',
			errorId: 'test-error',
			descriptionId: 'test-description',
			constraint: {},
			defaultValue: undefined,
			value: undefined,
			error: undefined,
			allError: {},
			allValid: true,
			valid: true,
			dirty: false,
		} as const;
		const props = {
			id: 'test',
			name: 'message',
			form: 'example',
		} as const;

		expect(conform.fieldset(config)).toEqual(props);
		expect(conform.fieldset(config, { ariaAttributes: true })).toEqual(props);
		expect(
			conform.fieldset({
				...config,
				valid: false,
			}),
		).toEqual({
			...props,
			'aria-invalid': true,
			'aria-describedby': 'test-error',
		});
		expect(conform.fieldset(config, { description: true })).toEqual({
			...props,
			'aria-describedby': 'test-description',
		});
		expect(
			conform.fieldset(
				{
					...config,
					valid: false,
				},
				{ description: true },
			),
		).toEqual({
			...props,
			'aria-invalid': true,
			'aria-describedby': 'test-error test-description',
		});

		expect(
			conform.fieldset(
				{
					...config,
					valid: false,
				},
				{ ariaAttributes: false },
			),
		).toEqual(props);
	});
});
