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
			form: 'example',
		} as const;

		expect(conform.input({ name: config.name })).toEqual({
			name: config.name,
		});
		expect(
			conform.input({
				...config,
				defaultValue: 'string',
				required: true,
				min: 1,
				max: 10,
				step: 1,
				minLength: 1,
				maxLength: 2,
				pattern: '[0-9]+',
				multiple: true,
			}),
		).toEqual({
			...config,
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
		expect(
			conform.input({ ...config, initialError: { '': 'Invalid' } }),
		).toEqual({
			...config,
			autoFocus: true,
		});
		expect(conform.input(config, { type: 'text' })).toEqual({
			...config,
			type: 'text',
		});
		expect(conform.input(config, { hidden: true })).toEqual({
			...config,
			style: conform.hiddenProps.style,
			tabIndex: conform.hiddenProps.tabIndex,
			'aria-hidden': conform.hiddenProps['aria-hidden'],
		});
		expect(conform.input(config, { ariaAttributes: true })).toEqual(config);
		expect(
			conform.input(
				{ ...config, errorId: 'test-error', descriptionId: 'test-description' },
				{ ariaAttributes: true },
			),
		).toEqual(config);
		expect(
			conform.input(
				{ ...config, errorId: 'test-error', descriptionId: 'test-description' },
				{ ariaAttributes: true, description: true },
			),
		).toEqual({
			...config,
			'aria-describedby': 'test-description',
		});
		expect(
			conform.input(
				{
					...config,
					errorId: 'test-error',
					descriptionId: 'test-description',
					error: 'Invalid',
				},
				{ ariaAttributes: true },
			),
		).toEqual({
			...config,
			'aria-invalid': true,
			'aria-describedby': 'test-error',
		});
		expect(
			conform.input(
				{
					...config,
					errorId: 'test-error',
					descriptionId: 'test-description',
					error: 'Invalid',
				},
				{ ariaAttributes: true, description: true },
			),
		).toEqual({
			...config,
			'aria-invalid': true,
			'aria-describedby': 'test-error test-description',
		});
		expect(conform.input(config, { type: 'checkbox' })).toEqual({
			...config,
			type: 'checkbox',
			value: 'on',
			defaultChecked: false,
		});
		expect(
			conform.input({ ...config, defaultValue: 'on' }, { type: 'radio' }),
		).toEqual({
			...config,
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
			...config,
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
			...config,
			type: 'checkbox',
			value: 'something else',
			defaultChecked: true,
		});
		expect(
			conform.input(
				{ ...config, defaultValue: new File([], '') },
				{ type: 'file' },
			),
		).toEqual({
			...config,
			type: 'file',
		});
	});

	test('conform.textarea', () => {
		const config = {
			id: 'test',
			name: 'message',
			form: 'example',
		} as const;

		expect(conform.textarea({ name: config.name })).toEqual({
			name: config.name,
		});
		expect(
			conform.textarea({
				...config,
				defaultValue: 'string',
				required: true,
				min: 1,
				max: 10,
				step: 1,
				minLength: 1,
				maxLength: 2,
				pattern: '[0-9]+',
				multiple: true,
			}),
		).toEqual({
			...config,
			defaultValue: 'string',
			required: true,
			minLength: 1,
			maxLength: 2,
		});
		expect(
			conform.textarea({ ...config, initialError: { '': 'Invalid' } }),
		).toEqual({
			...config,
			autoFocus: true,
		});
		expect(conform.textarea(config, { hidden: true })).toEqual({
			...config,
			style: conform.hiddenProps.style,
			tabIndex: conform.hiddenProps.tabIndex,
			'aria-hidden': conform.hiddenProps['aria-hidden'],
		});
		expect(conform.textarea(config, { ariaAttributes: true })).toEqual(config);
		expect(
			conform.textarea(
				{ ...config, errorId: 'test-error', descriptionId: 'test-description' },
				{ ariaAttributes: true },
			),
		).toEqual(config);
		expect(
			conform.textarea(
				{ ...config, errorId: 'test-error', descriptionId: 'test-description' },
				{ ariaAttributes: true, description: true },
			),
		).toEqual({
			...config,
			'aria-describedby': 'test-description',
		});
		expect(
			conform.textarea(
				{
					...config,
					errorId: 'test-error',
					descriptionId: 'test-description',
					error: 'Invalid',
				},
				{ ariaAttributes: true },
			),
		).toEqual({
			...config,
			'aria-invalid': true,
			'aria-describedby': 'test-error',
		});
		expect(
			conform.textarea(
				{
					...config,
					errorId: 'test-error',
					descriptionId: 'test-description',
					error: 'Invalid',
				},
				{ ariaAttributes: true, description: true },
			),
		).toEqual({
			...config,
			'aria-invalid': true,
			'aria-describedby': 'test-error test-description',
		});
	});

	test('conform.select', () => {
		const config = {
			id: 'test',
			name: 'message',
			form: 'example',
		} as const;

		expect(conform.select({ name: config.name })).toEqual({
			name: config.name,
		});
		expect(
			conform.select({
				...config,
				defaultValue: 'string',
				required: true,
				min: 1,
				max: 10,
				step: 1,
				minLength: 1,
				maxLength: 2,
				pattern: '[0-9]+',
				multiple: true,
			}),
		).toEqual({
			...config,
			defaultValue: 'string',
			required: true,
			multiple: true,
		});
		expect(
			conform.select({ ...config, initialError: { '': 'Invalid' } }),
		).toEqual({
			...config,
			autoFocus: true,
		});
		expect(conform.select(config, { hidden: true })).toEqual({
			...config,
			style: conform.hiddenProps.style,
			tabIndex: conform.hiddenProps.tabIndex,
			'aria-hidden': conform.hiddenProps['aria-hidden'],
		});
		expect(conform.select(config, { ariaAttributes: true })).toEqual(config);
		expect(
			conform.select(
				{ ...config, errorId: 'test-error', descriptionId: 'test-description' },
				{ ariaAttributes: true },
			),
		).toEqual(config);
		expect(
			conform.select(
				{ ...config, errorId: 'test-error', descriptionId: 'test-description' },
				{ ariaAttributes: true, description: true },
			),
		).toEqual({
			...config,
			'aria-describedby': 'test-description',
		});
		expect(
			conform.select(
				{
					...config,
					errorId: 'test-error',
					descriptionId: 'test-description',
					error: 'Invalid',
				},
				{ ariaAttributes: true },
			),
		).toEqual({
			...config,
			'aria-invalid': true,
			'aria-describedby': 'test-error',
		});
		expect(
			conform.select(
				{
					...config,
					errorId: 'test-error',
					descriptionId: 'test-description',
					error: 'Invalid',
				},
				{ ariaAttributes: true, description: true },
			),
		).toEqual({
			...config,
			'aria-invalid': true,
			'aria-describedby': 'test-error test-description',
		});
	});

	test('conform.fieldset', () => {
		const config = {
			id: 'test',
			name: 'message',
			form: 'example',
		} as const;

		expect(conform.fieldset({ name: config.name })).toEqual({
			name: config.name,
		});
		expect(conform.fieldset(config)).toEqual(config);
		expect(conform.fieldset(config, { ariaAttributes: true })).toEqual(config);
		expect(
			conform.fieldset(
				{ ...config, errorId: 'test-error', descriptionId: 'test-description' },
				{ ariaAttributes: true },
			),
		).toEqual(config);
		expect(
			conform.fieldset(
				{ ...config, errorId: 'test-error', descriptionId: 'test-description' },
				{ ariaAttributes: true, description: true },
			),
		).toEqual({
			...config,
			'aria-describedby': 'test-description',
		});
		expect(
			conform.fieldset(
				{
					...config,
					errorId: 'test-error',
					descriptionId: 'test-description',
					error: 'Invalid',
				},
				{ ariaAttributes: true },
			),
		).toEqual({
			...config,
			'aria-invalid': true,
			'aria-describedby': 'test-error',
		});
		expect(
			conform.fieldset(
				{
					...config,
					errorId: 'test-error',
					descriptionId: 'test-description',
					error: 'Invalid',
				},
				{ ariaAttributes: true, description: true },
			),
		).toEqual({
			...config,
			'aria-invalid': true,
			'aria-describedby': 'test-error test-description',
		});
	});
});
