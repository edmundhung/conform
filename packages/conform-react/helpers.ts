import type { FieldConfig } from '@conform-to/dom';
import type { HTMLInputTypeAttribute } from 'react';

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

type InputOptions =
	| {
			type: 'checkbox' | 'radio';
			value?: string;
	  }
	| {
			type: 'file';
			value?: never;
	  }
	| {
			type?: Exclude<
				HTMLInputTypeAttribute,
				'button' | 'submit' | 'hidden' | 'file'
			>;
			value?: never;
	  };

export function input<Schema extends File | File[]>(
	config: FieldConfig<Schema>,
	options: { type: 'file' },
): InputProps<Schema>;
export function input<Schema extends any>(
	config: FieldConfig<Schema>,
	options?: InputOptions,
): InputProps<Schema>;
export function input<Schema>(
	config: FieldConfig<Schema>,
	options: InputOptions = {},
): InputProps<Schema> {
	const attributes: InputProps<Schema> = {
		type: options.type,
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

	if (options.type === 'checkbox' || options.type === 'radio') {
		attributes.value = options.value ?? 'on';
		attributes.defaultChecked = config.defaultValue === attributes.value;
	} else if (options.type !== 'file') {
		attributes.defaultValue = config.defaultValue as string | undefined;
	}

	return attributes;
}

export function select<Schema>(config: FieldConfig<Schema>): SelectProps {
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

export function textarea<Schema>(config: FieldConfig<Schema>): TextareaProps {
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
