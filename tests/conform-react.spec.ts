import { test, expect } from '@playwright/test';
import {
	type FieldMetadata,
	getInputProps,
	getTextareaProps,
	getSelectProps,
	getFieldsetProps,
} from '@conform-to/react';

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
		error: undefined,
		allError: {},
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

test.describe('conform-react', () => {
	test('getInputProps', () => {
		const metadata = createFieldMetadata();
		const props = getProps(metadata);

		expect(getInputProps(metadata)).toEqual(props);
		expect(
			getInputProps({
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
		expect(getInputProps({ ...metadata, valid: false })).toEqual({
			...props,
			autoFocus: true,
			'aria-invalid': true,
			'aria-describedby': 'test-error',
		});
		expect(getInputProps(metadata, { type: 'text' })).toEqual({
			...props,
			type: 'text',
		});
		expect(getInputProps(metadata, { ariaDescribedBy: true })).toEqual({
			...props,
			'aria-describedby': 'test-description',
		});
		expect(getInputProps(metadata, { ariaDescribedBy: 'something' })).toEqual({
			...props,
			'aria-describedby': 'something',
		});
		expect(
			getInputProps({
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
			getInputProps(
				{
					...metadata,
					valid: false,
				},
				{ ariaDescribedBy: true },
			),
		).toEqual({
			...props,
			autoFocus: true,
			'aria-invalid': true,
			'aria-describedby': 'test-error test-description',
		});
		expect(
			getInputProps(
				{
					...metadata,
					valid: false,
				},
				{ ariaDescribedBy: 'something' },
			),
		).toEqual({
			...props,
			autoFocus: true,
			'aria-invalid': true,
			'aria-describedby': 'test-error something',
		});
		expect(
			getInputProps(
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
		expect(getInputProps(metadata, { type: 'checkbox' })).toEqual({
			...props,
			type: 'checkbox',
			value: 'on',
			defaultChecked: false,
		});
		expect(
			getInputProps({ ...metadata, initialValue: 'on' }, { type: 'radio' }),
		).toEqual({
			...props,
			type: 'radio',
			value: 'on',
			defaultChecked: true,
		});
		expect(
			getInputProps(
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
			getInputProps(
				{ ...metadata, initialValue: 'something else' },
				{ type: 'checkbox', value: 'something else' },
			),
		).toEqual({
			...props,
			type: 'checkbox',
			value: 'something else',
			defaultChecked: true,
		});
		expect(getInputProps(metadata, { type: 'file' })).toEqual({
			...props,
			type: 'file',
		});
	});

	test('getTextareaProps', () => {
		const metadata = createFieldMetadata();
		const props = getProps(metadata);

		expect(getTextareaProps(metadata)).toEqual(props);
		expect(
			getTextareaProps({
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
		expect(getTextareaProps({ ...metadata, valid: false })).toEqual({
			...props,
			autoFocus: true,
			'aria-invalid': true,
			'aria-describedby': 'test-error',
		});
		expect(getTextareaProps(metadata, { ariaDescribedBy: true })).toEqual({
			...props,
			'aria-describedby': 'test-description',
		});
		expect(
			getTextareaProps(metadata, { ariaDescribedBy: 'something' }),
		).toEqual({
			...props,
			'aria-describedby': 'something',
		});
		expect(
			getTextareaProps({
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
			getTextareaProps(
				{
					...metadata,
					valid: false,
				},
				{ ariaDescribedBy: true },
			),
		).toEqual({
			...props,
			autoFocus: true,
			'aria-invalid': true,
			'aria-describedby': 'test-error test-description',
		});
		expect(
			getTextareaProps(
				{
					...metadata,
					valid: false,
				},
				{ ariaDescribedBy: 'something' },
			),
		).toEqual({
			...props,
			autoFocus: true,
			'aria-invalid': true,
			'aria-describedby': 'test-error something',
		});
		expect(
			getTextareaProps(
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

	test('getSelectProps', () => {
		const metadata = createFieldMetadata();
		const props = getProps(metadata);

		expect(getSelectProps(metadata)).toEqual(props);
		expect(
			getSelectProps({
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
		expect(getSelectProps({ ...metadata, valid: false })).toEqual({
			...props,
			autoFocus: true,
			'aria-invalid': true,
			'aria-describedby': 'test-error',
		});
		expect(getSelectProps(metadata, { ariaDescribedBy: true })).toEqual({
			...props,
			'aria-describedby': 'test-description',
		});
		expect(getSelectProps(metadata, { ariaDescribedBy: 'something' })).toEqual({
			...props,
			'aria-describedby': 'something',
		});
		expect(
			getSelectProps(
				{
					...metadata,
					valid: false,
				},
				{ ariaDescribedBy: true },
			),
		).toEqual({
			...props,
			autoFocus: true,
			'aria-invalid': true,
			'aria-describedby': 'test-error test-description',
		});
		expect(
			getSelectProps(
				{
					...metadata,
					valid: false,
				},
				{ ariaDescribedBy: 'something' },
			),
		).toEqual({
			...props,
			autoFocus: true,
			'aria-invalid': true,
			'aria-describedby': 'test-error something',
		});
		expect(
			getSelectProps(
				{
					...metadata,
					valid: false,
				},
				{ ariaAttributes: false },
			),
		).toEqual({ ...props, autoFocus: true });
	});

	test('getFieldsetProps', () => {
		const metadata = createFieldMetadata();
		const props = getProps(metadata);

		expect(getFieldsetProps(metadata)).toEqual(props);
		expect(getFieldsetProps(metadata, { ariaAttributes: true })).toEqual(props);
		expect(
			getFieldsetProps({
				...metadata,
				valid: false,
			}),
		).toEqual({
			...props,
			'aria-invalid': true,
			'aria-describedby': 'test-error',
		});
		expect(getFieldsetProps(metadata, { ariaDescribedBy: true })).toEqual({
			...props,
			'aria-describedby': 'test-description',
		});
		expect(
			getFieldsetProps(metadata, { ariaDescribedBy: 'something' }),
		).toEqual({
			...props,
			'aria-describedby': 'something',
		});
		expect(
			getFieldsetProps(
				{
					...metadata,
					valid: false,
				},
				{ ariaDescribedBy: true },
			),
		).toEqual({
			...props,
			'aria-invalid': true,
			'aria-describedby': 'test-error test-description',
		});
		expect(
			getFieldsetProps(
				{
					...metadata,
					valid: false,
				},
				{ ariaDescribedBy: 'something' },
			),
		).toEqual({
			...props,
			'aria-invalid': true,
			'aria-describedby': 'test-error something',
		});
		expect(
			getFieldsetProps(
				{
					...metadata,
					valid: false,
				},
				{ ariaAttributes: false },
			),
		).toEqual(props);
	});
});
