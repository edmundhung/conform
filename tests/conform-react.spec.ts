import { test, expect } from '@playwright/test';
import { type FieldMetadata, conform } from '@conform-to/react';

function createFieldMetadata(): FieldMetadata<any> {
	return {
		id: 'test',
		name: 'message',
		formId: 'example',
		errorId: 'test-error',
		descriptionId: 'test-description',
		constraint: {},
		initialValue: undefined,
		value: undefined,
		errors: undefined,
		allErrors: {},
		allValid: true,
		valid: true,
		dirty: false,
		fields: {},
		items: [],
	};
}

function getProps(metadata: FieldMetadata<any>) {
	return {
		id: metadata.id,
		name: metadata.name,
		form: metadata.formId,
	};
}

test.describe('conform', () => {
	test('input', () => {
		const metadata = createFieldMetadata();
		const props = getProps(metadata);

		expect(conform.input(metadata)).toEqual(props);
		expect(
			conform.input({
				...metadata,
				initialValue: 'string',
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
		expect(conform.input({ ...metadata, valid: false })).toEqual({
			...props,
			autoFocus: true,
			'aria-invalid': true,
			'aria-describedby': 'test-error',
		});
		expect(conform.input(metadata, { type: 'text' })).toEqual({
			...props,
			type: 'text',
		});
		expect(conform.input(metadata, { description: true })).toEqual({
			...props,
			'aria-describedby': 'test-description',
		});
		expect(
			conform.input({
				...metadata,
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
					...metadata,
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
					...metadata,
					valid: false,
				},
				{ ariaAttributes: false },
			),
		).toEqual({
			...props,
			autoFocus: true,
		});
		expect(conform.input(metadata, { type: 'checkbox' })).toEqual({
			...props,
			type: 'checkbox',
			value: 'on',
			defaultChecked: false,
		});
		expect(
			conform.input({ ...metadata, initialValue: 'on' }, { type: 'radio' }),
		).toEqual({
			...props,
			type: 'radio',
			value: 'on',
			defaultChecked: true,
		});
		expect(
			conform.input(
				{ ...metadata, initialValue: 'something else' },
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
				{ ...metadata, initialValue: 'something else' },
				{ type: 'checkbox', value: 'something else' },
			),
		).toEqual({
			...props,
			type: 'checkbox',
			value: 'something else',
			defaultChecked: true,
		});
		expect(conform.input(metadata, { type: 'file' })).toEqual({
			...props,
			type: 'file',
		});
	});

	test('textarea', () => {
		const metadata = createFieldMetadata();
		const props = getProps(metadata);

		expect(conform.textarea(metadata)).toEqual(props);
		expect(
			conform.textarea({
				...metadata,
				initialValue: 'string',
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
		expect(conform.textarea({ ...metadata, valid: false })).toEqual({
			...props,
			autoFocus: true,
			'aria-invalid': true,
			'aria-describedby': 'test-error',
		});
		expect(conform.textarea(metadata, { description: true })).toEqual({
			...props,
			'aria-describedby': 'test-description',
		});
		expect(
			conform.textarea({
				...metadata,
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
					...metadata,
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
					...metadata,
					valid: false,
				},
				{ ariaAttributes: false },
			),
		).toEqual({
			...props,
			autoFocus: true,
		});
	});

	test('select', () => {
		const metadata = createFieldMetadata();
		const props = getProps(metadata);

		expect(conform.select(metadata)).toEqual(props);
		expect(
			conform.select({
				...metadata,
				initialValue: 'string',
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
		expect(conform.select({ ...metadata, valid: false })).toEqual({
			...props,
			autoFocus: true,
			'aria-invalid': true,
			'aria-describedby': 'test-error',
		});
		expect(conform.select(metadata, { description: true })).toEqual({
			...props,
			'aria-describedby': 'test-description',
		});
		expect(
			conform.select(
				{
					...metadata,
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
					...metadata,
					valid: false,
				},
				{ ariaAttributes: false },
			),
		).toEqual({ ...props, autoFocus: true });
	});

	test('fieldset', () => {
		const metadata = createFieldMetadata();
		const props = getProps(metadata);

		expect(conform.fieldset(metadata)).toEqual(props);
		expect(conform.fieldset(metadata, { ariaAttributes: true })).toEqual(props);
		expect(
			conform.fieldset({
				...metadata,
				valid: false,
			}),
		).toEqual({
			...props,
			'aria-invalid': true,
			'aria-describedby': 'test-error',
		});
		expect(conform.fieldset(metadata, { description: true })).toEqual({
			...props,
			'aria-describedby': 'test-description',
		});
		expect(
			conform.fieldset(
				{
					...metadata,
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
					...metadata,
					valid: false,
				},
				{ ariaAttributes: false },
			),
		).toEqual(props);
	});
});
