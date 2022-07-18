import { type FieldProps } from '@conform-to/dom';
import {
	type InputHTMLAttributes,
	type SelectHTMLAttributes,
	type TextareaHTMLAttributes,
} from 'react';

export function input<
	Type extends string | number | Date | boolean | undefined,
>(
	props: FieldProps<Type>,
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
		attributes.defaultValue = `${props.defaultValue ?? ''}`;
	}

	return attributes;
}

export function select<T extends any>(
	props: FieldProps<T>,
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

export function textarea<T extends string | undefined>(
	props: FieldProps<T>,
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
