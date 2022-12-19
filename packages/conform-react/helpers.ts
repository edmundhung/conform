import { type FieldConfig, type Primitive } from '@conform-to/dom';
import { type HTMLInputTypeAttribute } from 'react';

interface FieldProps {
	name: string;
	form?: string;
	required?: boolean;
	autoFocus?: boolean;
}

interface InputProps<Schema> extends FieldProps {
	type?: HTMLInputTypeAttribute;
	minLength?: number;
	maxLength?: number;
	min?: Schema extends number ? number : string | number;
	max?: Schema extends number ? number : string | number;
	step?: Schema extends number ? number : string | number;
	pattern?: string;
	multiple?: boolean;
	value?: string;
	defaultChecked?: boolean;
	defaultValue?: string;
}

interface SelectProps extends FieldProps {
	defaultValue?: string | number | readonly string[] | undefined;
	multiple?: boolean;
}

interface TextareaProps extends FieldProps {
	minLength?: number;
	maxLength?: number;
	defaultValue?: string;
}

export function input<Schema extends Primitive>(
	config: FieldConfig<Schema>,
	{ type, value }: { type?: HTMLInputTypeAttribute; value?: string } = {},
): InputProps<Schema> {
	const isCheckboxOrRadio = type === 'checkbox' || type === 'radio';
	const attributes: InputProps<Schema> = {
		type,
		name: config.name,
		form: config.form,
		required: config.required,
		minLength: config.minLength,
		maxLength: config.maxLength,
		min: config.min,
		max: config.max,
		step: config.step,
		pattern: config.pattern,
		multiple: config.multiple,
	};

	if (config.initialError && config.initialError.length > 0) {
		attributes.autoFocus = true;
	}

	if (isCheckboxOrRadio) {
		attributes.value = value ?? 'on';
		attributes.defaultChecked = config.defaultValue === attributes.value;
	} else {
		attributes.defaultValue = config.defaultValue;
	}

	return attributes;
}

export function select<Schema extends Primitive | Array<Primitive>>(
	config: FieldConfig<Schema>,
): SelectProps {
	const attributes: SelectProps = {
		name: config.name,
		form: config.form,
		defaultValue: config.multiple
			? Array.isArray(config.defaultValue)
				? config.defaultValue
				: []
			: `${config.defaultValue ?? ''}`,
		required: config.required,
		multiple: config.multiple,
	};

	if (config.initialError && config.initialError.length > 0) {
		attributes.autoFocus = true;
	}

	return attributes;
}

export function textarea<Schema extends Primitive>(
	config: FieldConfig<Schema>,
): TextareaProps {
	const attributes: TextareaProps = {
		name: config.name,
		form: config.form,
		defaultValue: `${config.defaultValue ?? ''}`,
		required: config.required,
		minLength: config.minLength,
		maxLength: config.maxLength,
		autoFocus: Boolean(config.initialError),
	};

	if (config.initialError && config.initialError.length > 0) {
		attributes.autoFocus = true;
	}

	return attributes;
}
