import { type FieldProps, type Primitive } from '@conform-to/dom';
import {
	type InputHTMLAttributes,
	type SelectHTMLAttributes,
	type TextareaHTMLAttributes,
} from 'react';

export function input<Schema extends Primitive>(
	props: FieldProps<Schema>,
	{ type, value }: { type?: string; value?: string } = {},
): InputHTMLAttributes<HTMLInputElement> {
	const isCheckboxOrRadio = type === 'checkbox' || type === 'radio';
	const attributes: InputHTMLAttributes<HTMLInputElement> = {
		type,
		name: props.name,
		form: props.form,
		required: props.required,
		minLength: props.minLength,
		maxLength: props.maxLength,
		min: props.min,
		max: props.max,
		step: props.step,
		pattern: props.pattern,
		multiple: props.multiple,
	};

	if (isCheckboxOrRadio) {
		attributes.value = value ?? 'on';
		attributes.defaultChecked = props.defaultValue === attributes.value;
	} else {
		attributes.defaultValue = props.defaultValue;
	}

	return attributes;
}

export function select<Schema extends Primitive | Array<Primitive>>(
	props: FieldProps<Schema>,
): SelectHTMLAttributes<HTMLSelectElement> {
	return {
		name: props.name,
		form: props.form,
		defaultValue: props.multiple
			? Array.isArray(props.defaultValue)
				? props.defaultValue
				: []
			: `${props.defaultValue ?? ''}`,
		required: props.required,
		multiple: props.multiple,
	};
}

export function textarea<Schema extends Primitive>(
	props: FieldProps<Schema>,
): TextareaHTMLAttributes<HTMLTextAreaElement> {
	return {
		name: props.name,
		form: props.form,
		defaultValue: `${props.defaultValue ?? ''}`,
		required: props.required,
		minLength: props.minLength,
		maxLength: props.maxLength,
	};
}
