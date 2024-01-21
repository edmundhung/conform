import { describe, test, expect } from 'vitest';
import {
	type FieldMetadata,
	getInputProps,
	getTextareaProps,
	getSelectProps,
	getFieldsetProps,
} from '@conform-to/react';

function createFieldMetadata(): FieldMetadata<string> {
	return {
		key: undefined,
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
		valid: true,
		dirty: false,
	};
}

function getProps(metadata: FieldMetadata<any>) {
	return {
		id: metadata.id,
		name: metadata.name,
		form: metadata.formId,
	};
}

describe('conform-react', () => {
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
		expect(getInputProps(metadata, { type: 'text' })).toEqual({
			...props,
			type: 'text',
		});
		expect(getInputProps(metadata, { ariaDescribedBy: 'something' })).toEqual({
			...props,
			'aria-describedby': 'something',
		});
		expect(
			getInputProps({
				...metadata,
				errors: ['required'],
			}),
		).toEqual({
			...props,
			'aria-invalid': true,
			'aria-describedby': 'test-error',
		});
		expect(
			getInputProps(
				{
					...metadata,
					errors: ['required'],
				},
				{ ariaDescribedBy: 'something' },
			),
		).toEqual({
			...props,
			'aria-invalid': true,
			'aria-describedby': 'test-error something',
		});
		expect(
			getInputProps(
				{
					...metadata,
					errors: ['required'],
				},
				{ ariaAttributes: false },
			),
		).toEqual(props);
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
		expect(getTextareaProps({ ...metadata, errors: ['required'] })).toEqual({
			...props,
			'aria-invalid': true,
			'aria-describedby': 'test-error',
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
				errors: ['required'],
			}),
		).toEqual({
			...props,
			'aria-invalid': true,
			'aria-describedby': 'test-error',
		});
		expect(
			getTextareaProps(
				{
					...metadata,
					errors: ['required'],
				},
				{ ariaDescribedBy: 'something' },
			),
		).toEqual({
			...props,
			'aria-invalid': true,
			'aria-describedby': 'test-error something',
		});
		expect(
			getTextareaProps(
				{
					...metadata,
					errors: ['required'],
				},
				{ ariaAttributes: false },
			),
		).toEqual(props);
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
		expect(getSelectProps({ ...metadata, errors: ['required'] })).toEqual({
			...props,
			'aria-invalid': true,
			'aria-describedby': 'test-error',
		});
		expect(getSelectProps(metadata, { ariaDescribedBy: 'something' })).toEqual({
			...props,
			'aria-describedby': 'something',
		});
		expect(
			getSelectProps(
				{
					...metadata,
					errors: ['required'],
				},
				{ ariaDescribedBy: 'something' },
			),
		).toEqual({
			...props,
			'aria-invalid': true,
			'aria-describedby': 'test-error something',
		});
		expect(
			getSelectProps(
				{
					...metadata,
					errors: ['required'],
				},
				{ ariaAttributes: false },
			),
		).toEqual(props);
	});

	test('getFieldsetProps', () => {
		const metadata = createFieldMetadata();
		const props = getProps(metadata);

		expect(getFieldsetProps(metadata)).toEqual(props);
		expect(getFieldsetProps(metadata, { ariaAttributes: true })).toEqual(props);
		expect(
			getFieldsetProps({
				...metadata,
				errors: ['required'],
			}),
		).toEqual({
			...props,
			'aria-invalid': true,
			'aria-describedby': 'test-error',
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
					errors: ['required'],
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
					errors: ['required'],
				},
				{ ariaAttributes: false },
			),
		).toEqual(props);
	});
});
